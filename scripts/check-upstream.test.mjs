// node --test
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { compareSource, report } from './check-upstream.mjs'

const OLD = 'a'.repeat(40)
const NEW = 'b'.repeat(40)

/** Fake GitHub API: one repository whose `skills/` folder and LICENSE are given per commit. */
const fakeApi = (trees, commits = []) => async (path) => {
  if (path === 'repos/o/r') return { default_branch: 'main' }
  if (path === 'repos/o/r/commits/main') return { sha: NEW }
  if (path === `repos/o/r/commits/${OLD}`) return { commit: { committer: { date: '2026-01-01T00:00:00Z' } } }
  if (path.startsWith('repos/o/r/commits?')) return commits
  const m = /^repos\/o\/r\/contents\/?(.*)\?ref=(\w+)$/.exec(path)
  if (m) return trees[m[2]][m[1]]
  return undefined
}

const source = { repo: 'o/r', ref: OLD, licenseFiles: ['LICENSE'], skills: [{ name: 'same', path: 'skills/same' }, { name: 'moved', path: 'skills/moved' }, { name: 'gone', path: 'skills/gone' }] }

test('changed, unchanged and removed skill folders and a changed license', async () => {
  const trees = {
    [OLD]: { skills: [{ name: 'same', sha: '1' }, { name: 'moved', sha: '2' }, { name: 'gone', sha: '3' }], '': [{ name: 'LICENSE', sha: 'L1' }] },
    [NEW]: { skills: [{ name: 'same', sha: '1' }, { name: 'moved', sha: '9' }], '': [{ name: 'LICENSE', sha: 'L2' }] },
  }
  const r = await compareSource(source, fakeApi(trees, [{ sha: NEW }, { sha: 'c'.repeat(40) }, { sha: OLD }]))
  assert.deepEqual(r.behind, [{ name: 'moved', commits: '2' }])
  assert.deepEqual(r.removed, ['gone'])
  assert.deepEqual(r.license, ['LICENSE cambiato'])
  const { markdown, behind } = report([r], '2026-11-17')
  assert.equal(behind, 3)
  assert.match(markdown, /`moved`: 2 commit/)
  assert.match(markdown, /`gone`: cartella sparita/)
  assert.match(markdown, /compare\/a{40}\.\.\.b{40}/)
})

test('pinned commit equal to head needs no other call', async () => {
  const api = async (path) => (path === 'repos/o/r' ? { default_branch: 'main' } : path === 'repos/o/r/commits/main' ? { sha: OLD } : assert.fail(path))
  const r = await compareSource(source, api)
  assert.deepEqual([r.behind, r.removed, r.license], [[], [], []])
  assert.equal(report([r]).behind, 0)
})

test('a missing repository is reported, not thrown', async () => {
  const r = await compareSource(source, async () => undefined)
  assert.match(r.error, /non trovato/)
  assert.equal(report([r]).behind, 1)
})

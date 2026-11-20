// node --test. Default skills (catalog.json `defaultSkills`) reach every user of the desktop app at the next start,
// without an app release: the checks the app's release gate used to run on them run here, on every push.
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'

const root = join(import.meta.dirname, '..')
const catalog = JSON.parse(readFileSync(join(root, 'catalog.json'), 'utf8'))
const read = (...p) => readFileSync(join(root, 'skills', ...p), 'utf8')

test('every default skill is hosted here', () => {
  assert.ok(Array.isArray(catalog.defaultSkills) && catalog.defaultSkills.length > 0)
  for (const name of catalog.defaultSkills) assert.ok(existsSync(join(root, 'skills', name, 'SKILL.md')), name)
})

test('the user guide never names the engine\'s origin (users see only zero1code)', () => {
  const ORIGIN = /deepseek|harness|\bdsh\b|cordis|upstream/i
  for (const file of ['SKILL.md', 'guida.md', 'novita.md']) {
    read('zero1code-guida', file).split(/\r?\n/).forEach((line, i) => {
      assert.ok(!ORIGIN.test(line), `zero1code-guida/${file}:${i + 1} names the engine's origin: ${line.trim()}`)
    })
  }
})

test('guida.md says which engine version it was reviewed for (runtime: in the front matter)', () => {
  assert.match(read('zero1code-guida', 'guida.md'), /^---\r?\n[\s\S]*?^runtime:\s*\S+\s*$/m)
})

test('controllo-app-desktop approves only full sha256 hashes', () => {
  const approved = JSON.parse(read('controllo-app-desktop', 'approved.json'))
  assert.ok(Array.isArray(approved) && approved.length > 0 && approved.length <= 3)
  for (const entry of approved) {
    assert.match(entry.version, /^v\d+\.\d+\.\d+$/)
    for (const arch of ['x86_64', 'aarch64']) assert.match(entry.sha256[arch], /^[0-9a-f]{64}$/)
  }
})

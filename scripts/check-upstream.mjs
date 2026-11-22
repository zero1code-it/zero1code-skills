// Reports which third-party skills in catalog.json are behind their author's repository. Read-only: it changes nothing,
// because a new commit is not trusted until someone reviews it (new scripts, a changed license) and moves `ref` by hand.
// A skill is behind when its folder at the head of the default branch differs from the folder at the pinned commit
// (git tree sha, exact); the number of commits on that folder is shown as a hint of how much changed.
// Usage: GITHUB_TOKEN=$(gh auth token) node scripts/check-upstream.mjs [--out report.md]
//        In GitHub Actions it also writes `behind=<n>` to $GITHUB_OUTPUT (number of skills to review).
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const enc = (path) => path.split('/').map(encodeURIComponent).join('/')
const parentOf = (path) => (path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '')
const baseOf = (path) => path.slice(path.lastIndexOf('/') + 1)

/** GitHub REST client: `api(path)` returns the JSON body, undefined on 404, throws on anything else. */
export function githubApi({ fetchImpl = fetch, token } = {}) {
  const headers = { 'user-agent': 'zero1code-skills', accept: 'application/vnd.github+json', ...(token ? { authorization: `Bearer ${token}` } : {}) }
  return async (path) => {
    const response = await fetchImpl(`https://api.github.com/${path}`, { headers })
    if (response.status === 404) return undefined
    if (!response.ok) throw new Error(`${path}: ${response.status}`)
    return response.json()
  }
}

/** Compare one catalog source with the head of its repository's default branch. */
/** `target`: compare with this commit instead of the head of the default branch (a descendant of `ref`). */
export async function compareSource(source, api, target) {
  const { repo, ref } = source
  const info = await api(`repos/${repo}`)
  if (info === undefined) return { repo, ref, error: 'repository non trovato (rimosso o rinominato)' }
  const branch = info.default_branch
  const head = target ? { sha: target } : await api(`repos/${repo}/commits/${encodeURIComponent(branch)}`)
  const result = { repo, ref, branch, head: head.sha, fullName: info.full_name, archived: info.archived === true, behind: [], removed: [], license: [] }
  if (head.sha === ref) return result
  const listings = new Map()
  const list = async (dir, at) => {
    const key = `${at}:${dir}`
    if (!listings.has(key)) listings.set(key, api(`repos/${repo}/contents${dir ? `/${enc(dir)}` : ''}?ref=${at}`).then((l) => (Array.isArray(l) ? l : [])))
    return listings.get(key)
  }
  const shaOf = async (path, at) => (await list(parentOf(path), at)).find((e) => e.name === baseOf(path))?.sha
  const pinnedDate = (await api(`repos/${repo}/commits/${ref}`))?.commit?.committer?.date
  for (const skill of source.skills ?? []) {
    const [old, now] = await Promise.all([shaOf(skill.path, ref), shaOf(skill.path, head.sha)])
    if (now === undefined) { result.removed.push(skill.name); continue }
    if (old === now) continue
    const since = pinnedDate ? `&since=${encodeURIComponent(pinnedDate)}` : ''
    const commits = (await api(`repos/${repo}/commits?sha=${head.sha}&path=${enc(skill.path)}&per_page=100${since}`)) ?? []
    const n = commits.filter((c) => c.sha !== ref).length
    result.behind.push({ name: skill.name, commits: n >= 100 ? '100+' : String(n) })
  }
  for (const file of source.licenseFiles ?? []) {
    const [old, now] = await Promise.all([shaOf(file, ref), shaOf(file, head.sha)])
    if (old !== now) result.license.push(now === undefined ? `${file} rimosso` : `${file} cambiato`)
  }
  return result
}

const short = (sha) => sha.slice(0, 7)

/** Markdown report (Italian, it becomes the body of the tracking issue). */
export function report(results, date = new Date().toISOString().slice(0, 10)) {
  const todo = results.filter((r) => r.error || r.behind.length || r.removed.length || r.license.length)
  const skills = todo.reduce((n, r) => n + (r.behind?.length ?? 0) + (r.removed?.length ?? 0), 0)
  const lines = [`Controllo del ${date}: ${results.length} sorgenti, ${todo.length} da rivedere, ${skills} skill indietro o sparite.`, '']
  if (todo.length === 0) return { markdown: lines.concat('Tutte le skill di terzi sono allineate.').join('\n') + '\n', behind: 0 }
  lines.push('Per aggiornare: rivedi il diff (script nuovi, licenza), metti il nuovo commit in `ref` di `catalog.json`,',
    'poi `GITHUB_TOKEN=$(gh auth token) node scripts/build-index.mjs` e committa `catalog.json` con `index.json`.', '')
  for (const r of todo) {
    if (r.error) { lines.push(`### ${r.repo}`, `- ${r.error}`, ''); continue }
    const compare = `https://github.com/${r.repo}/compare/${r.ref}...${r.head}`
    lines.push(`### ${r.repo} (${r.branch}${r.archived ? ', archiviato' : ''})`, `[${short(r.ref)}...${short(r.head)}](${compare})`, '')
    for (const s of r.behind) lines.push(`- [ ] \`${s.name}\`: ${s.commits} commit sulla cartella`)
    for (const name of r.removed) lines.push(`- [ ] \`${name}\`: cartella sparita dal ramo ${r.branch} (spostata o rimossa)`)
    for (const l of r.license) lines.push(`- [ ] licenza: ${l}`)
    lines.push('')
  }
  return { markdown: lines.join('\n'), behind: skills + todo.filter((r) => r.error || r.license.length).length }
}

if (process.argv[1]?.endsWith('check-upstream.mjs')) { // CLI only; the tests import the functions
  const root = join(import.meta.dirname, '..')
  const catalog = JSON.parse(readFileSync(join(root, 'catalog.json'), 'utf8'))
  const api = githubApi({ token: process.env.GITHUB_TOKEN })
  const results = []
  for (const source of catalog.sources ?? []) {
    try { results.push(await compareSource(source, api)) } catch (error) { results.push({ repo: source.repo, ref: source.ref, error: `controllo fallito: ${error.message}` }) }
  }
  const { markdown, behind } = report(results)
  const at = process.argv.indexOf('--out')
  if (at > 0) writeFileSync(process.argv[at + 1], markdown)
  process.stdout.write(markdown)
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `behind=${behind}\n`)
}

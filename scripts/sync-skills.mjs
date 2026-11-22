// Weekly automatic update of third-party skills, with gates. Two kinds of entries in catalog.json:
//  - `sources[]`: references to the author's files at a pinned `ref`; updating = moving `ref`.
//  - `hostedCopies{}`: modified copies in skills/<name>/, described as data (folder, excluded files, extra files, text edits);
//    updating = moving `ref`, then rebuilding the folder with `materialize`.
// WAIT: a commit is a candidate only if OUR runs saw it as the head of the default branch at least 7 days earlier
// (upstream-state.json; commit dates are the author's and prove nothing). Not yet seen for 7 days = "in attesa", not blocked.
// A candidate is applied only if every gate passes; otherwise it is reported as blocked and a human decides. Hard gates:
// same repository (no rename/transfer) and a fast-forward of the pinned commit (no force-push or switch of the default
// branch to another history); license files and SKILL.md frontmatter (except description) untouched; no change at all to
// scripts or executables (exception: sources with `allowScriptChanges: true`, which still pass every other gate, the
// suspicious-line check included; never allowed on hostedCopies); no symlinks, submodules, binaries (except images/fonts), invisible Unicode or unsafe paths.
// Soft gate: no suspicious ADDED line. It is a tripwire, not a guarantee: prose that tells the agent to do harm without
// these keywords still passes.
// Usage: GITHUB_TOKEN=$(gh auth token) node scripts/sync-skills.mjs [--apply] [--verify] [--out report.md] [--now ISO]
//        --apply also writes upstream-state.json; --now only simulates time in tests.
//        In GitHub Actions it also writes `changed=<n>` and `blocked=<n>` to $GITHUB_OUTPUT.
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { compareSource, githubApi } from './check-upstream.mjs'

// Same limits and script rule as build-index.mjs (`hasScripts`), plus scripts/ at any depth and git mode 100755.
const MAX_FILES = 200
const MAX_BYTES = 5 * 1024 * 1024
const SCRIPT_EXT = new Set(['.sh', '.ps1', '.bat', '.cmd', '.py', '.js', '.mjs', '.cjs', '.ts'])
const isScript = (p) => p.startsWith('scripts/') || p.includes('/scripts/') || SCRIPT_EXT.has(p.slice(p.lastIndexOf('.')))
const LICENSE_NAME = /^(LICEN[CS]E|NOTICE|COPYING|COPYRIGHT|UNLICENSE)/i
// Binary files allowed to change (they are shown, not executed); anything else that is not UTF-8 text blocks.
const BINARY_OK = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.woff', '.woff2', '.ttf', '.otf'])
// Invisible characters that hide text from a human reviewer but not from the model: tag block (ASCII smuggling), bidi
// controls, zero-width, word joiner, BOM not at the start of a file. A ZWJ inside an emoji sequence is allowed.
const INVISIBLE = /[\u{E0000}-\u{E007F}‪-‮⁦-⁩​-‍⁠﻿]/u
const EMOJI_ZWJ = /(\p{Extended_Pictographic}️?)‍(?=\p{Extended_Pictographic})/gu

// Applied ONLY to lines ADDED by an update (present in the new file, absent from the old one, compared as a multiset per
// file), alone and joined with the adjacent line, after NFKC and removal of format characters: security-review
// legitimately contains attack examples, and those must not block every update.
export const SUSPICIOUS = [
  ['ignora istruzioni precedenti', /\b(ignore|disregard|forget|override)\b[^\n]{0,40}\b(all|any|previous|prior|above|earlier)\b[^\n]{0,40}\b(instructions?|prompts?|rules?)\b/i],
  ['scarica ed esegue', /\b(curl|wget|iwr|Invoke-WebRequest|Invoke-RestMethod)\b[^\n]*\|\s*(sudo\s+)?(sh|bash|zsh|iex|python3?)\b/i],
  ['invio dati', /\b(curl|wget)\b[^\n]*\s(-d\b|--data\S*|-F\b|--form\S*|-T\b|--upload-file|-X\s*POST)/i],
  ['decodifica ed esegue', /base64\s+(-d\b|--decode)|FromBase64String/i],
  ['reverse shell', /\b(nc|ncat)\b[^\n]*\s-e\b|\/dev\/tcp\/|bash\s+-i\s*>&/i],
  ['segreti', /(id_rsa|\.ssh\/|\.env\b|api[_-]?key|token|password|credentials)[^\n]{0,60}\b(send|post|upload|exfiltrat\w*)|\b(send|post|upload|exfiltrat\w*)\b[^\n]{0,60}(id_rsa|\.ssh\/|\.env\b|api[_-]?key|token|password|credentials)/i],
  ['installazione', /\b(npm\s+(i|install)\b|pip3?\s+install\b|npx\s)|\bcurl\b[^\n]*\binstall\b/i],
  ['rm -rf', /\brm\s+-\w+\s+(\/|~)(?=\s|$|\*|\/\*)/i],
  ['chmod +x', /\bchmod\s+(-\w+\s+)?\+x\b/i],
]

const REF7 = '{ref7}'

/** Destination of a repo file in the skill folder, or undefined if the entry does not take it. */
function destOf(entry, repoPath) {
  const prefix = `${entry.path}/`
  if (!repoPath.startsWith(prefix)) return undefined
  const rel = repoPath.slice(prefix.length)
  if (entry.exclude?.includes(rel) || (entry.only && !entry.only.includes(rel))) return undefined
  return entry.rename?.[rel] ?? rel
}

/** A relative path that is safe to write on Linux, macOS and Windows inside the skill folder. */
export function safePath(p) {
  return typeof p === 'string' && p !== '' && !p.startsWith('/') && p.split('/').every((s) =>
    s !== '' && s !== '.' && s !== '..' && s.toLowerCase() !== '.git' && !/[\\:*?"<>|\x00-\x1f\x7f]/.test(s) && !/[. ]$/.test(s))
}

/**
 * Files of a skill from the repo files at one commit. `files`: Map repo path -> Buffer.
 * entry: { path, exclude?, extraFiles? {dest: repo path}, edits? [{file, from, to}], ref? } (+ `only`, `rename` for references).
 * Throws on an unsafe destination path or two paths that differ only by case.
 */
export function materialize(entry, files) {
  const out = new Map()
  for (const [p, bytes] of files) {
    const dest = destOf(entry, p)
    if (dest !== undefined) out.set(dest, bytes)
  }
  for (const [dest, from] of Object.entries(entry.extraFiles ?? {})) {
    if (!files.has(from)) throw new Error(`file ${from} non trovato`)
    if (!out.has(dest)) out.set(dest, files.get(from))
  }
  const lower = new Set()
  for (const p of out.keys()) {
    if (!safePath(p)) throw new Error(`percorso non sicuro: ${JSON.stringify(p)}`)
    if (lower.has(p.toLowerCase())) throw new Error(`percorsi che differiscono solo per maiuscole: ${p}`)
    lower.add(p.toLowerCase())
  }
  for (const { file, from, to } of entry.edits ?? []) {
    if (!out.has(file)) throw new Error(`modifica su ${file}: file non trovato`)
    const text = out.get(file).toString('utf8')
    const n = text.split(from).length - 1
    if (n !== 1) throw new Error(`modifica su ${file}: il testo «${from.slice(0, 50)}» compare ${n} volte invece di 1`)
    out.set(file, Buffer.from(text.replace(from, () => to.replaceAll(REF7, (entry.ref ?? '').slice(0, 7)))))
  }
  return out
}

const utf8 = new TextDecoder('utf-8', { fatal: true })
/** Text of a file, or undefined if it is binary (NUL byte, e.g. UTF-16) or not valid UTF-8. A leading BOM is dropped. */
function textOf(bytes) {
  if (bytes.includes(0)) return undefined
  try { return utf8.decode(bytes).replace(/^﻿/, '') } catch { return undefined }
}
const normalize = (line) => line.normalize('NFKC').replace(/\p{Cf}/gu, '')
const ext = (p) => p.slice(p.lastIndexOf('.')).toLowerCase()
// Frontmatter keys that only describe the skill and may change freely; any other key (license, allowed-tools, model,
// hooks, disable-model-invocation, unknown ones...) blocks when it is added, removed or changed.
const FREE_KEYS = /^(description|argument-hint|when_to_use|metadata|version|compatibility)\s*:/
/** Raw SKILL.md frontmatter without the free keys (plain, quoted, folded or nested), as a comparable string. */
function frontmatterKey(bytes) {
  const block = /^﻿?---\r?\n([\s\S]*?)\r?\n---/.exec(bytes?.toString('utf8') ?? '')?.[1]
  if (block === undefined) return ''
  const out = []
  let skip = false
  for (const l of block.split(/\r?\n/)) {
    if (/^\S/.test(l)) skip = FREE_KEYS.test(l)
    if (!skip) out.push(l.trimEnd())
  }
  return out.join('\n')
}
// Third-party text in a reason: one line, no backticks (the report puts reasons in a fenced block).
const q = (s) => String(s).replace(/[\r\n]+/g, ' ').replace(/`/g, "'").slice(0, 120)

/**
 * Reasons to block an update, empty = ok. Maps: dest path -> Buffer.
 * opts: licenseFiles; oldModes/newModes (git mode by dest path); oldRaw/newRaw = the files before `edits` (to compare the
 * author's frontmatter, not ours); hosted = the result is committed here (no CR, nothing .gitignore would drop);
 * allowScripts = an array (source with allowScriptChanges): script changes are listed in it instead of blocking.
 */
export function gate(oldFiles, newFiles, { licenseFiles = [], oldModes = new Map(), newModes = new Map(), oldRaw = oldFiles, newRaw = newFiles, hosted = false, allowScripts } = {}) {
  const reasons = []
  if (oldFiles.has('SKILL.md') && !newFiles.has('SKILL.md')) reasons.push('SKILL.md sparito (cartella spostata o rimossa)')
  if (frontmatterKey(oldRaw.get('SKILL.md')) !== frontmatterKey(newRaw.get('SKILL.md'))) reasons.push('frontmatter di SKILL.md cambiato (licenza, strumenti, modello o altro oltre a description e metadati)')
  const isLicense = (p) => licenseFiles.includes(p) || LICENSE_NAME.test(p.slice(p.lastIndexOf('/') + 1))
  for (const p of new Set([...oldFiles.keys(), ...newFiles.keys()])) {
    const a = oldFiles.get(p), b = newFiles.get(p)
    const what = !b ? 'rimosso' : !a ? 'aggiunto' : !a.equals(b) ? 'cambiato' : oldModes.get(p) !== newModes.get(p) ? 'modo cambiato' : ''
    if (!what) continue
    if (isLicense(p)) reasons.push(`licenza: ${q(p)} ${what}`)
    // Any change to a script or an executable blocks: content, presence or mode (a new 100755 bit included).
    if (isScript(p) || oldModes.get(p) === '100755' || newModes.get(p) === '100755') {
      const msg = `script o eseguibile ${what}: ${q(p)}${newModes.get(p) === '100755' ? ' (100755)' : ''}`
      if (allowScripts) allowScripts.push(msg); else reasons.push(msg) // the other gates still apply to the script's added lines
    }
    if (!b || a?.equals(b)) continue
    const text = textOf(b)
    if (text === undefined) { if (!BINARY_OK.has(ext(p))) reasons.push(`file binario o non UTF-8 ${what}: ${q(p)}`); continue }
    if (hosted && text.includes('\r')) reasons.push(`fine riga CR in ${q(p)}: .gitattributes (eol=lf) cambierebbe i byte della copia`)
    if (hosted && p.split('/').some((s) => s === '__pycache__' || s === '.venv' || s.endsWith('.pyc'))) reasons.push(`file ignorato da .gitignore: ${q(p)}`)
    const now = text.split(/\r?\n/)
    const seen = new Map()
    for (const l of a ? (textOf(a) ?? '').split(/\r?\n/) : []) seen.set(l, (seen.get(l) ?? 0) + 1)
    const added = now.map((l) => (seen.get(l) > 0 ? (seen.set(l, seen.get(l) - 1), false) : true))
    const clean = now.map((l) => normalize(l.replace(EMOJI_ZWJ, '$1')))
    for (let i = 0; i < now.length; i++) {
      if (!added[i]) continue
      if (INVISIBLE.test(now[i].replace(EMOJI_ZWJ, '$1'))) reasons.push(`caratteri invisibili (zero-width, bidi o tag Unicode) in ${q(p)}:${i + 1}`)
      for (const [label, re] of SUSPICIOUS) {
        // the line alone, then joined with an adjacent one (a phrase or command wrapped over two lines)
        if (re.test(clean[i])) reasons.push(`riga aggiunta sospetta (${label}) in ${q(p)}:${i + 1}: ${q(now[i].trim())}`)
        else if (i + 1 < now.length && !re.test(clean[i + 1]) && re.test(`${clean[i]} ${clean[i + 1]}`)) reasons.push(`righe aggiunte sospette (${label}) in ${q(p)}:${i + 1}-${i + 2}: ${q(`${now[i].trim()} ${now[i + 1].trim()}`)}`)
        else if (i > 0 && !added[i - 1] && !re.test(clean[i - 1]) && re.test(`${clean[i - 1]} ${clean[i]}`)) reasons.push(`righe aggiunte sospette (${label}) in ${q(p)}:${i}-${i + 1}: ${q(`${now[i - 1].trim()} ${now[i].trim()}`)}`)
      }
    }
  }
  if (newFiles.size > MAX_FILES) reasons.push(`più di ${MAX_FILES} file`)
  if ([...newFiles.values()].reduce((n, b) => n + b.length, 0) > MAX_BYTES) reasons.push(`più di ${MAX_BYTES} byte`)
  return reasons
}

const rawUrl = (repo, ref, path) => `https://raw.githubusercontent.com/${repo}/${ref}/${path.split('/').map(encodeURIComponent).join('/')}`

export const rawFetcher = ({ fetchImpl = fetch, token } = {}) => async (repo, ref, path) => {
  const response = await fetchImpl(rawUrl(repo, ref, path), { headers: { 'user-agent': 'zero1code-skills', ...(token ? { authorization: `Bearer ${token}` } : {}) } })
  if (!response.ok) throw new Error(`${repo}@${ref.slice(0, 7)} ${path}: ${response.status}`)
  return Buffer.from(await response.arrayBuffer())
}

/** Files of one skill (folder + extraFiles) at one commit: { files: repo path -> Buffer, modes: repo path -> git mode }. */
async function snapshot(repo, ref, entry, api, fetchFile) {
  const tree = await api(`repos/${repo}/git/trees/${ref}?recursive=1`)
  if (!tree || tree.truncated || !Array.isArray(tree.tree)) throw new Error(`albero di ${repo}@${ref.slice(0, 7)} non disponibile o troncato`)
  const extra = new Set(Object.values(entry.extraFiles ?? {}))
  const inside = (e) => e.path.startsWith(`${entry.path}/`) || extra.has(e.path)
  const sub = tree.tree.find((e) => e.type === 'commit' && inside(e))
  if (sub) throw new Error(`${q(sub.path)} è un sottomodulo`)
  const blobs = tree.tree.filter((e) => e.type === 'blob' && inside(e))
  const link = blobs.find((b) => b.mode === '120000')
  if (link) throw new Error(`${q(link.path)} è un link simbolico`)
  const files = new Map(await Promise.all(blobs.map(async (b) => [b.path, await fetchFile(repo, ref, b.path)])))
  return { files, modes: new Map(blobs.map((b) => [b.path, b.mode])) }
}

/** Git modes keyed by the destination path in the skill folder (extra files keep the mode of their source). */
function destModes(entry, modes) {
  const out = new Map()
  for (const [p, mode] of modes) { const d = destOf(entry, p); if (d !== undefined) out.set(d, mode) }
  for (const [dest, from] of Object.entries(entry.extraFiles ?? {})) if (!out.has(dest) && modes.has(from)) out.set(dest, modes.get(from))
  return out
}

/** A catalog reference seen as a materialize entry: its own files (renamed) plus the source license files. */
const referenceEntry = (source, skill) => ({
  path: skill.path, only: skill.files, rename: skill.rename, extraFiles: Object.fromEntries((source.licenseFiles ?? []).map((f) => [f, f])),
})

/** Old vs new version of one skill through materialize + gate; returns the blocking reasons and the new files. */
async function review(repo, from, to, entry, api, fetchFile, { hosted = false, allowScripts = false } = {}) {
  try {
    const [a, b] = await Promise.all([snapshot(repo, from, entry, api, fetchFile), snapshot(repo, to, entry, api, fetchFile)])
    const oldFiles = materialize({ ...entry, ref: from }, a.files)
    let newFiles, sameRef
    try { newFiles = materialize({ ...entry, ref: to }, b.files); sameRef = materialize({ ...entry, ref: from }, b.files) } catch (error) { return { reasons: [`non si applica al nuovo commit: ${q(error.message)}`] } }
    const opts = { licenseFiles: Object.keys(entry.extraFiles ?? {}), oldModes: destModes(entry, a.modes), newModes: destModes(entry, b.modes), hosted, allowScripts: allowScripts ? [] : undefined }
    if (entry.edits?.length) Object.assign(opts, { oldRaw: materialize({ ...entry, edits: [] }, a.files), newRaw: materialize({ ...entry, edits: [] }, b.files) })
    const reasons = gate(oldFiles, newFiles, opts)
    // `same` ignores {ref7}: a commit elsewhere in the repo must not rewrite only the attribution line.
    const same = oldFiles.size === sameRef.size && [...sameRef].every(([p, bytes]) => oldFiles.get(p)?.equals(bytes)) &&
      [...opts.newModes].every(([p, m]) => opts.oldModes.get(p) === m)
    return { reasons, newFiles, same, scripts: opts.allowScripts ?? [] }
  } catch (error) { return { reasons: [q(error.message)] } }
}

/** Same repository (no rename/transfer: the API follows redirects silently) and `to` a fast-forward of `from`. */
async function historyReasons(repo, fullName, from, to, api) {
  const reasons = []
  if (typeof fullName !== 'string' || fullName.toLowerCase() !== repo.toLowerCase()) reasons.push(`repository rinominato o trasferito: ora ${q(fullName)}`)
  const cmp = await api(`repos/${repo}/compare/${from}...${to}?per_page=1`)
  if (cmp?.status !== 'ahead') reasons.push(`il nuovo commit non discende da quello fissato (${q(cmp?.status ?? 'confronto non disponibile')}): force-push, ramo cambiato o storia riscritta`)
  return reasons
}

const DAY = 86400000
const WAIT_DAYS = 7, KEEP_DAYS = 60, KEEP_MAX = 20

/**
 * State file: { "owner/repo": [{ sha, seen }] }, the heads of the default branch WE observed (commit dates are the author's
 * and prove nothing). Adds the current head of each repo, drops observations older than 60 days (the current head is always
 * kept; at most 20 per repo), malformed ones and repositories no longer in `heads`. A head that comes back after another
 * head was observed (A -> B -> A) is observed again now: its 7 days restart. Pure: returns a new object.
 */
export function observe(state, heads, now) {
  const out = {}
  const valid = (o) => typeof o?.sha === 'string' && /^[0-9a-f]{40}$/.test(o.sha) && typeof o.seen === 'string' && Number.isFinite(Date.parse(o.seen))
  const newestFirst = (x, y) => Date.parse(y.seen) - Date.parse(x.seen)
  for (const [repo, sha] of Object.entries(heads)) {
    let list = (Array.isArray(state[repo]) ? state[repo] : []).filter(valid).sort(newestFirst)
    if (list[0]?.sha !== sha) list = [{ sha, seen: now.toISOString() }, ...list.filter((o) => o.sha !== sha)]
    out[repo] = list.filter((o) => o.sha === sha || Date.parse(o.seen) >= now - KEEP_DAYS * DAY).slice(0, KEEP_MAX)
  }
  return out
}

/**
 * Newest observation seen at least 7 days ago (and not in the future) that is a descendant of `ref`, an ancestor of (or
 * equal to) `head`, and an ancestor of every head observed after it: a commit hidden by a force-push in the meantime and
 * pushed again does not count as 7 days public.
 */
async function pickCandidate(repo, ref, head, observed, now, api) {
  const status = async (a, b) => (await api(`repos/${repo}/compare/${a}...${b}?per_page=1`))?.status
  const contains = async (a, b) => a === b || ['ahead', 'identical'].includes(await status(a, b))
  for (const [i, o] of observed.entries()) { // newest first
    const seen = Date.parse(o.seen)
    if (o.sha === ref || !(seen <= now - WAIT_DAYS * DAY)) continue
    if (await status(ref, o.sha) !== 'ahead') continue
    let ok = await contains(o.sha, head)
    for (const later of observed.slice(0, i)) if (ok) ok = await contains(o.sha, later.sha)
    if (ok) return o.sha
  }
}

/**
 * Lines and files that `to` added to the skill (compared with `from`) and that `head` no longer has: the author took back
 * something in the last 7 days (e.g. a revert after a compromise), so the older candidate must not be published.
 */
async function retracted(repo, from, to, head, entry, api, fetchFile) {
  if (to === head) return []
  const raw = { ...entry, edits: [] }
  const [a, b, c] = await Promise.all([from, to, head].map(async (r) => materialize(raw, (await snapshot(repo, r, entry, api, fetchFile)).files)))
  const out = []
  for (const [p, bytes] of b) {
    if (a.get(p)?.equals(bytes)) continue
    if (!c.has(p)) { out.push(`${q(p)} tolto dopo il candidato`); continue }
    const count = (buf) => { const n = new Map(); for (const l of buf ? buf.toString('utf8').split(/\r?\n/) : []) n.set(l, (n.get(l) ?? 0) + 1); return n }
    const before = count(a.get(p)), now = count(c.get(p))
    for (const [l, n] of count(bytes)) if (n > (before.get(l) ?? 0) && (now.get(l) ?? 0) < n) { out.push(`${q(p)}: righe aggiunte dal candidato e poi tolte`); break }
  }
  return out
}

/**
 * Decide what to update. opts: state (see observe), now (Date). A commit is applied only if we saw it as the head at least
 * 7 days before. Returns { apply, blocked, waiting, state }: apply [{kind, name, repo, from, to, files?, skills?, scripts?}],
 * blocked [{name, repo, from, to, reasons}], waiting [{name, repo, from, to, seen, eligible}], state = the new state.
 */
export async function planUpdates(catalog, api, fetchFile, { state = {}, now = new Date() } = {}) {
  const apply = [], blocked = [], waiting = []
  const repos = [...new Set([...(catalog.sources ?? []).map((s) => s.repo), ...Object.values(catalog.hostedCopies ?? {}).map((c) => c.repo)])]
  const infos = new Map()
  const headOf = (repo) => {
    if (!infos.has(repo)) infos.set(repo, (async () => {
      const info = await api(`repos/${repo}`)
      if (info === undefined) return { error: 'repository non trovato (rimosso o rinominato)' }
      const head = await api(`repos/${repo}/commits/${encodeURIComponent(info.default_branch)}`)
      return { sha: head.sha, fullName: info.full_name, archived: info.archived === true }
    })().catch((error) => ({ error: `controllo fallito: ${q(error.message)}` })))
    return infos.get(repo)
  }
  const heads = {}
  for (const repo of repos) { const h = await headOf(repo); if (h.sha) heads[repo] = h.sha }
  const newState = observe(state, heads, now)
  // Common to sources and copies: unusable head, history gates, then the candidate (or: nothing to do / waiting).
  const target = async (base, repo, ref, relevant) => {
    const head = await headOf(repo)
    if (head.error) return void blocked.push({ ...base, reasons: [head.error] })
    if (head.sha === ref) return
    const reasons = [...(head.archived ? ['repository archiviato'] : []), ...await historyReasons(repo, head.fullName, ref, head.sha, api)]
    if (reasons.length) return void blocked.push({ ...base, to: head.sha, reasons })
    const to = await pickCandidate(repo, ref, head.sha, newState[repo] ?? [], now, api)
    if (to) return to
    if (await relevant(head.sha)) { // something that matters is on the head, but we have not seen it for 7 days yet
      const seen = newState[repo].find((o) => o.sha === head.sha).seen
      waiting.push({ ...base, to: head.sha, seen, eligible: new Date(Date.parse(seen) + WAIT_DAYS * DAY).toISOString() })
    }
  }
  const takenBack = async (base, repo, to, entries) => {
    const head = (await headOf(repo)).sha
    const notes = []
    for (const [label, entry] of entries) notes.push(...(await retracted(repo, base.from, to, head, entry, api, fetchFile)).map((m) => label + m))
    if (!notes.length) return false
    const seen = newState[repo].find((o) => o.sha === head).seen
    waiting.push({ ...base, to: head, seen, eligible: new Date(Date.parse(seen) + WAIT_DAYS * DAY).toISOString(), notes })
    return true
  }
  for (const source of catalog.sources ?? []) {
    const { repo, ref } = source
    const base = { kind: 'source', name: repo, repo, from: ref }
    const moved = (r) => r.behind.length || r.removed.length || r.license.length
    try {
      const to = await target(base, repo, ref, async (sha) => moved(await compareSource(source, api, sha)))
      if (!to) continue
      const r = await compareSource(source, api, to)
      if (r.error) { blocked.push({ ...base, reasons: [r.error] }); continue }
      if (!moved(r)) continue
      const reasons = [...r.removed.map((n) => `skill ${n}: cartella sparita`), ...r.license.map((l) => `licenza: ${l}`)]
      const scripts = []
      if (!reasons.length) {
        for (const { name } of r.behind) {
          const skill = source.skills.find((x) => x.name === name)
          const res = await review(repo, ref, to, referenceEntry(source, skill), api, fetchFile, { allowScripts: source.allowScriptChanges === true })
          reasons.push(...res.reasons.map((m) => `${name}: ${m}`))
          scripts.push(...res.scripts.map((m) => `${name}: ${m}`))
        }
      }
      if (reasons.length) blocked.push({ ...base, to, reasons })
      else if (!await takenBack(base, repo, to, r.behind.map(({ name }) => [`${name}: `, referenceEntry(source, source.skills.find((x) => x.name === name))])))
        apply.push({ ...base, to, skills: r.behind.map((b) => b.name), scripts })
    } catch (error) { blocked.push({ ...base, reasons: [`controllo fallito: ${q(error.message)}`] }) }
  }
  for (const [name, copy] of Object.entries(catalog.hostedCopies ?? {})) {
    const base = { kind: 'copy', name, repo: copy.repo, from: copy.ref }
    try {
      const to = await target(base, copy.repo, copy.ref, async (sha) => !(await review(copy.repo, copy.ref, sha, copy, api, fetchFile, { hosted: true })).same)
      if (!to) continue
      const res = await review(copy.repo, copy.ref, to, copy, api, fetchFile, { hosted: true })
      if (res.same && !res.reasons.length) continue // folder and extra files untouched: nothing to update
      if (res.reasons.length) blocked.push({ ...base, to, reasons: res.reasons })
      else if (!await takenBack(base, copy.repo, to, [['', copy]])) apply.push({ ...base, to, files: res.newFiles })
    } catch (error) { blocked.push({ ...base, reasons: [`controllo fallito: ${q(error.message)}`] }) }
  }
  return { apply, blocked, waiting, state: newState }
}

const short = (sha) => sha.slice(0, 7)
const link = (x) => (x.to ? `[${short(x.from)}...${short(x.to)}](https://github.com/${x.repo}/compare/${x.from}...${x.to})` : `\`${short(x.from)}\``)

/** Markdown report (Italian; it is the body of the issue when something is blocked). */
export function report({ apply, blocked, waiting = [] }, date = new Date().toISOString().slice(0, 10)) {
  const out = [`Aggiornamento del ${date}: ${apply.length} aggiornate, ${blocked.length} bloccate, ${waiting.length} in attesa.`, '']
  if (apply.length) {
    out.push('## Aggiornate', '')
    for (const x of apply) out.push(`- \`${x.name}\`${x.skills ? ` (${x.skills.join(', ')})` : ''}: ${link(x)}`)
    out.push('')
    const scripts = apply.flatMap((x) => (x.scripts ?? []).map((m) => `- \`${x.name}\` ${m.replace(/[\r\n`]+/g, ' ')}`))
    if (scripts.length) out.push('## Script cambiati (sorgenti con eccezione `allowScriptChanges`)', '', ...scripts, '')
  }
  if (waiting.length) {
    out.push('## In attesa (si applicano 7 giorni dopo la prima osservazione)', '')
    for (const x of waiting) {
      out.push(`- \`${x.name}\`: visto il ${x.seen.slice(0, 10)}, si applica dal ${x.eligible.slice(0, 10)}: ${link(x)}`)
      for (const n of x.notes ?? []) out.push(`  - modifica ritirata dall'autore, si riparte dalla testa: ${n.replace(/[\r\n`]+/g, ' ')}`)
    }
    out.push('')
  }
  if (blocked.length) {
    out.push('## Bloccate (da rivedere a mano)', '',
      'Rivedi il diff, poi sposta `ref` in `catalog.json` (per le copie ospitate rigenera con `node scripts/sync-skills.mjs --apply` dopo aver adattato le `edits`), `node scripts/build-index.mjs` e committa.', '')
    // reasons carry third-party text (paths, lines): a fenced block keeps mentions, links, images and HTML inert
    for (const x of blocked) out.push(`### ${x.name}`, link(x), '', '```text', ...x.reasons.map((m) => `- ${m.replace(/[\r\n]+/g, ' ').replace(/`/g, "'")}`), '```', '')
  }
  if (!apply.length && !blocked.length && !waiting.length) out.push('Tutte le skill di terzi sono allineate.')
  return out.join('\n') + '\n'
}

/** Writes new refs in catalog.json and rebuilds the folders of updated hosted copies. Does not rebuild index.json. */
export function applyUpdates(root, catalog, { apply }) {
  for (const x of apply) {
    if (x.kind === 'source') catalog.sources.find((s) => s.repo === x.repo).ref = x.to
    else {
      catalog.hostedCopies[x.name].ref = x.to
      if (!/^[a-z0-9][a-z0-9._-]*$/.test(x.name)) throw new Error(`nome di copia non valido: ${x.name}`)
      const dir = join(root, 'skills', x.name)
      for (const p of x.files.keys()) if (!safePath(p) || !resolve(dir, p).startsWith(resolve(dir) + sep)) throw new Error(`percorso non sicuro: ${JSON.stringify(p)}`)
      rmSync(dir, { recursive: true, force: true })
      for (const [p, bytes] of x.files) { mkdirSync(dirname(join(dir, p)), { recursive: true }); writeFileSync(join(dir, p), bytes) }
    }
  }
  writeFileSync(join(root, 'catalog.json'), JSON.stringify(catalog, null, 2) + '\n')
}

/** Offline-testable core of --verify: does materialize(entry, files at ref) equal skills/<name>/ byte for byte? */
export function diffFolder(dir, expected) {
  const have = existsSync(dir) ? readdirSync(dir, { recursive: true, withFileTypes: true }).filter((e) => e.isFile()).map((e) => relative(dir, join(e.parentPath, e.name)).split('\\').join('/')) : []
  const errors = []
  for (const p of new Set([...have, ...expected.keys()])) {
    if (!expected.has(p)) errors.push(`${p}: in più nella cartella`)
    else if (!have.includes(p)) errors.push(`${p}: manca nella cartella`)
    else if (!readFileSync(join(dir, p)).equals(expected.get(p))) errors.push(`${p}: byte diversi`)
  }
  return errors
}

if (process.argv[1]?.endsWith('sync-skills.mjs')) { // CLI only; the tests import the functions
  const root = join(import.meta.dirname, '..')
  const catalog = JSON.parse(readFileSync(join(root, 'catalog.json'), 'utf8'))
  const token = process.env.GITHUB_TOKEN
  const api = githubApi({ token })
  const fetchFile = rawFetcher({ token })
  if (process.argv.includes('--verify')) {
    let bad = 0
    for (const [name, copy] of Object.entries(catalog.hostedCopies ?? {})) {
      let errors
      try { errors = diffFolder(join(root, 'skills', name), materialize(copy, (await snapshot(copy.repo, copy.ref, copy, api, fetchFile)).files)) } catch (error) { errors = [error.message] }
      console.log(errors.length ? `${name}: DIVERSA\n  ${errors.join('\n  ')}` : `${name}: identica a ${copy.repo}@${short(copy.ref)} + modifiche`)
      bad += errors.length
    }
    process.exit(bad ? 1 : 0)
  }
  const arg = (name) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : undefined)
  // --now only simulates time in local dry runs: a date in the past would make the wait pass at once if saved
  if (arg('--now') && (process.env.GITHUB_ACTIONS || process.argv.includes('--apply'))) { console.error('--now non è ammesso in CI né con --apply'); process.exit(2) }
  const now = arg('--now') ? new Date(arg('--now')) : new Date()
  if (!Number.isFinite(now.getTime())) { console.error('--now: data non valida'); process.exit(2) }
  const stateFile = join(root, 'upstream-state.json')
  const state = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, 'utf8')) : {}
  const plan = await planUpdates(catalog, api, fetchFile, { state, now })
  const markdown = report(plan, now.toISOString().slice(0, 10))
  if (process.argv.includes('--apply')) {
    applyUpdates(root, catalog, plan)
    writeFileSync(stateFile, JSON.stringify(plan.state, null, 2) + '\n') // observations are facts: kept even if nothing is applied
  }
  const at = process.argv.indexOf('--out')
  if (at > 0) writeFileSync(process.argv[at + 1], markdown)
  process.stdout.write(markdown)
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `changed=${plan.apply.length}\nblocked=${plan.blocked.length}\n`)
}

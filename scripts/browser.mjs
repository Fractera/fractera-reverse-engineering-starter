// npm run browser:start -- <url> · browser:stop · browser:status — the browser REA observes (node step 563-2).
//
// REA's own guide: «Start a separate browser profile with an explicit debugging port … REA does not launch, own, or terminate this
// browser» (docs/browser-observation.md). So this element starts it: Chrome of this machine with NO window (--headless=new), its own
// profile in this element's data (<SERVICE_DATA_DIR>/browser-profile), the debugging port on the loopback only. The person's profile,
// sign-ins and cookies are never used. It lives until browser:stop — no timer stops it; the analysis skill ends with browser:stop, and
// the node's agent calls browser:stop before it turns this element off. Its state: <SERVICE_DATA_DIR>/browser.json {pid, port, url}.
// Every process: windowsHide (a window over the person's screen is not allowed); the environment without Next/core labels (law 280-6).
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ELEMENT = resolve(process.env.ELEMENT_DIR || join(dirname(fileURLToPath(import.meta.url)), '..'))
const envFile = (() => { try { return readFileSync(join(ELEMENT, '.env.local'), 'utf8') } catch { return '' } })()
const DATA = process.env.SERVICE_DATA_DIR || (envFile.match(/^SERVICE_DATA_DIR=(.+)$/m) ?? [])[1]?.trim()
if (!DATA) { console.log('===BROWSER_FAILED=== SERVICE_DATA_DIR is not set (.env.local)'); process.exit(2) }
const PROFILE = join(DATA, 'browser-profile')
const STATE = join(DATA, 'browser.json')
const argv = process.argv.slice(2)
const [action, url] = argv
const opt = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : null)
// 556-7: `--site <site>` — the profile of a test account the person confirmed (the core's `npm run study`), with the guard that lets
// only reads through; `--visible` (556-8, mode B) — the person drives the window and the guard only writes; `--budget N` — pages.
const site = opt('--site')?.toLowerCase() ?? null
const visible = argv.includes('--visible')
const budget = opt('--budget')
const say = (m) => console.log(m)

function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  const candidates = process.platform === 'win32'
    ? [join(process.env.PROGRAMFILES || 'C:/Program Files', 'Google/Chrome/Application/chrome.exe'),
       join(process.env['PROGRAMFILES(X86)'] || 'C:/Program Files (x86)', 'Google/Chrome/Application/chrome.exe'),
       join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe')]
    : process.platform === 'darwin'
      ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium']
      : ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser']
  return candidates.find((p) => p && existsSync(p)) ?? null
}

function alive(pid) {
  if (!pid) return false
  try { process.kill(pid, 0); return true } catch (e) { return e.code === 'EPERM' }
}

const state = () => { try { return JSON.parse(readFileSync(STATE, 'utf8')) } catch { return null } }

function freePort() {
  return new Promise((ok, fail) => {
    const s = createServer()
    s.once('error', fail)
    s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => ok(p)) })
  })
}

async function waitDebugger(port) {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(`http://127.0.0.1:${port}/json/version`); if (r.ok) return await r.json() } catch { /* not yet */ }
    await new Promise((r) => setTimeout(r, 250))
  }
  return null
}

function stopTree(pid) {
  if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' })
  else { try { process.kill(-pid, 'SIGTERM') } catch { try { process.kill(pid, 'SIGTERM') } catch { /* gone */ } } }
}

if (action === 'start') {
  if (!/^https?:\/\//.test(url ?? '')) { say('usage: npm run browser:start -- <http(s) url>'); process.exit(2) }
  const now = state()
  if (now && alive(now.pid)) { say(`===BROWSER_RUNNING=== pid ${now.pid}, debugging http://127.0.0.1:${now.port} (stop it first: npm run browser:stop)`); process.exit(0) }
  const chrome = chromePath()
  if (!chrome) { say('===BROWSER_FAILED=== no Chrome found on this machine (set CHROME_PATH)'); process.exit(3) }
  let profile = PROFILE
  let study = null
  if (visible && !site) { say('===BROWSER_FAILED=== --visible is for a test account (--site): the person drives the window'); process.exit(2) }
  if (site) {
    // Only a sign-in the node saw AFTER the person's consent counts (core lib/study/study.mjs, stateOf — the same rule).
    study = join(DATA, 'study', site.replace(':', '_'))
    const read = (f) => { try { return JSON.parse(readFileSync(join(study, f), 'utf8')) } catch { return null } }
    const consent = read('consent.json')
    const session = read('session.json')
    const valid = consent && session && session.consentAt === consent.at && Date.parse(session.at) > Date.parse(consent.at)
    if (!valid) { say(`===BROWSER_FAILED=== no test account the person confirmed for ${site}: the core's main agent opens the login window (npm run study -- login ${site})`); process.exit(4) }
    const bare = (h) => h.replace(/:\d+$/, '').replace(/^www\./, '')
    let host = ''
    try { host = new URL(url).host.toLowerCase() } catch { /* checked above */ }
    if (host !== site && bare(host) !== bare(site) && !bare(host).endsWith(`.${bare(site)}`)) {
      say(`===BROWSER_FAILED=== ${url} is not on ${site}: a test account is used only on its own site`); process.exit(4)
    }
    profile = join(study, 'profile')
    rmSync(join(study, 'guard.json'), { force: true })
  }
  mkdirSync(profile, { recursive: true })
  const port = await freePort()
  const env = {}
  for (const [k, v] of Object.entries(process.env)) if (v !== undefined && !/^(__NEXT|NEXT_|AGI_)/.test(k)) env[k] = v
  // A test account's cookies were written by the login window: on macOS and Linux both programs keep them without the system store.
  const keychain = site ? (process.platform === 'darwin' ? ['--use-mock-keychain'] : process.platform === 'linux' ? ['--password-store=basic'] : []) : []
  // Lighter: no GPU, no background services, at most two renderer processes. Site isolation stays on — this browser opens other
  // people's sites. Measured 2026-10-22 on lagrix.dev: without these flags 9 processes and ~850 MB working set.
  // With a test account the first page is blank: the guard attaches first and opens the page itself, so no request passes unseen.
  const child = spawn(chrome, [...(visible ? [] : ['--headless=new']), `--remote-debugging-port=${port}`, '--remote-debugging-address=127.0.0.1',
    `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--window-size=1366,900',
    '--disable-gpu', '--disable-background-networking', '--disable-component-update', '--disable-default-apps', '--disable-sync',
    '--no-pings', '--mute-audio', '--renderer-process-limit=2', '--disable-features=Translate,OptimizationHints,MediaRouter', ...keychain,
    site ? 'about:blank' : url],
  // A visible window is the person's own window (mode B): windowsHide would hide Chrome itself, and Chrome has no console window.
  { detached: true, stdio: 'ignore', windowsHide: !visible, env })
  child.unref()
  const version = await waitDebugger(port)
  if (!version) { stopTree(child.pid); say('===BROWSER_FAILED=== Chrome did not open its debugging port'); process.exit(1) }
  let guardPid = null
  if (site) {
    const guard = spawn(process.execPath, [join(ELEMENT, 'scripts', 'study-guard.mjs'), String(port), site, study, url,
      ...(visible ? ['--log-only'] : []), ...(budget ? ['--budget', budget] : [])], { detached: true, stdio: 'ignore', windowsHide: true, env })
    guard.unref()
    guardPid = guard.pid
    let ready = false
    for (let i = 0; i < 60 && !ready; i++) {
      await new Promise((r) => setTimeout(r, 250))
      try { ready = JSON.parse(readFileSync(join(study, 'guard.json'), 'utf8')).ready === true } catch { /* not yet */ }
    }
    if (!ready) { stopTree(child.pid); stopTree(guardPid); say('===BROWSER_FAILED=== the guard did not attach — the browser is stopped'); process.exit(1) }
  }
  writeFileSync(STATE, JSON.stringify({ pid: child.pid, port, url, profile, site, guardPid, mode: site ? (visible ? 'person drives' : 'agent reads') : 'public pages', startedAt: new Date().toISOString() }, null, 2) + '\n')
  say(`===BROWSER_STARTED=== pid ${child.pid} · debugging http://127.0.0.1:${port} · ${version.Browser} · ${visible ? 'a window on this computer' : 'no window'}` +
    (site ? ` · test account ${site}, guard ${visible ? 'writing only' : 'letting only reads through'}` : ''))
} else if (action === 'stop') {
  const now = state()
  if (!now) { say('===BROWSER_STOPPED=== nothing was running'); process.exit(0) }
  if (alive(now.pid)) stopTree(now.pid)
  if (now.guardPid && alive(now.guardPid)) stopTree(now.guardPid)
  rmSync(STATE, { force: true })
  say(`===BROWSER_STOPPED=== pid ${now.pid}`)
} else if (action === 'status') {
  const now = state()
  say(now && alive(now.pid) ? `===BROWSER_RUNNING=== pid ${now.pid} · debugging http://127.0.0.1:${now.port} · ${now.url} · ${now.mode ?? 'public pages'}` : '===BROWSER_STOPPED===')
  if (now?.site) {
    // The guard's journal: what was blocked and why it stopped — method, host and path only.
    const dir = join(DATA, 'study', now.site.replace(':', '_'))
    const lines = (() => { try { return readFileSync(join(dir, 'guard.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l)) } catch { return [] } })()
    const blocked = lines.filter((l) => String(l.kind).startsWith('blocked'))
    const stop = lines.filter((l) => l.kind === 'stop').pop()
    say(`guard: ${blocked.length} blocked${stop ? ` · stopped: ${stop.reason}` : ''}`)
    for (const b of blocked.slice(-5)) say(`  ${b.kind} ${b.method} ${b.host}${b.path}`)
  }
} else {
  say('usage: npm run browser:start -- <url> [--site <test account site> [--visible] [--budget N]] | browser:stop | browser:status')
  process.exit(2)
}

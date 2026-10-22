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
const [action, url] = process.argv.slice(2)
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
  mkdirSync(PROFILE, { recursive: true })
  const port = await freePort()
  const env = {}
  for (const [k, v] of Object.entries(process.env)) if (v !== undefined && !/^(__NEXT|NEXT_|AGI_)/.test(k)) env[k] = v
  // Lighter: no GPU, no background services, at most two renderer processes. Site isolation stays on — this browser opens other
  // people's sites. Measured 2026-10-22 on lagrix.dev: without these flags 9 processes and ~850 MB working set.
  const child = spawn(chrome, ['--headless=new', `--remote-debugging-port=${port}`, '--remote-debugging-address=127.0.0.1',
    `--user-data-dir=${PROFILE}`, '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--window-size=1366,900',
    '--disable-gpu', '--disable-background-networking', '--disable-component-update', '--disable-default-apps', '--disable-sync',
    '--no-pings', '--mute-audio', '--renderer-process-limit=2', '--disable-features=Translate,OptimizationHints,MediaRouter', url],
  { detached: true, stdio: 'ignore', windowsHide: true, env })
  child.unref()
  const version = await waitDebugger(port)
  if (!version) { stopTree(child.pid); say('===BROWSER_FAILED=== Chrome did not open its debugging port'); process.exit(1) }
  writeFileSync(STATE, JSON.stringify({ pid: child.pid, port, url, profile: PROFILE, startedAt: new Date().toISOString() }, null, 2) + '\n')
  say(`===BROWSER_STARTED=== pid ${child.pid} · debugging http://127.0.0.1:${port} · ${version.Browser} · no window`)
} else if (action === 'stop') {
  const now = state()
  if (!now) { say('===BROWSER_STOPPED=== nothing was running'); process.exit(0) }
  if (alive(now.pid)) stopTree(now.pid)
  rmSync(STATE, { force: true })
  say(`===BROWSER_STOPPED=== pid ${now.pid}`)
} else if (action === 'status') {
  const now = state()
  say(now && alive(now.pid) ? `===BROWSER_RUNNING=== pid ${now.pid} · debugging http://127.0.0.1:${now.port} · ${now.url}` : '===BROWSER_STOPPED===')
} else {
  say('usage: npm run browser:start -- <url> | browser:stop | browser:status')
  process.exit(2)
}

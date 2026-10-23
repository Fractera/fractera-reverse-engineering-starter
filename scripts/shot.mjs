// npm run shot -- --task <task id> --name <screen name> [--file <png>] [--viewport] — a screenshot into the node's storage (node step 556-14).
//
// Owner 2026-10-23: «он может создавать скриншоты и охранять их в наш файловое хранилище чтобы в будущем, разрабатываем интерфейс можно
// было подсматривать кнопки карточки и прочее инструменты». The screen of the running study browser (npm run browser:start …) is taken
// through its debugging port (CDP `Page.captureScreenshot`, the whole page unless --viewport) — or an existing PNG with `--file` — and
// uploaded to the node's storage through the data layer (`REMOTE_DATA_URL/media/upload`, key `DATA_SECRET`). It prints the storage id
// and the link through the core (`/api/media/<id>/file`: the core gives the file to the architect; the storage itself answers 401
// without the node key). Nothing is clicked or typed: the guard of a test account (556-7) stays the only one who lets requests through.
// Screens look, they are not copied into a product (node law 538: our own design and texts).
import { existsSync, readFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ELEMENT = resolve(process.env.ELEMENT_DIR || join(dirname(fileURLToPath(import.meta.url)), '..'))
const envFile = (() => { try { return readFileSync(join(ELEMENT, '.env.local'), 'utf8') } catch { return '' } })()
const envOf = (name) => process.env[name] || (envFile.match(new RegExp(`^${name}=(.+)$`, 'm')) ?? [])[1]?.trim() || ''
const DATA = envOf('SERVICE_DATA_DIR')
const DATA_URL = envOf('REMOTE_DATA_URL').replace(/\/+$/, '')
const DATA_SECRET = envOf('DATA_SECRET')
const argv = process.argv.slice(2)
const opt = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] ?? null : null)
const say = (m) => console.log(m)
const fail = (code, m) => { say(`===SHOT_FAILED=== ${m}`); process.exit(code) }

const task = opt('--task')
const name = opt('--name')
const file = opt('--file')
if (!task || !/^[0-9a-z][0-9a-z-]{2,80}$/.test(task) || !name) fail(2, 'usage: npm run shot -- --task <task id> --name <screen name> [--file <png>] [--viewport]')
if (!DATA_URL || !DATA_SECRET) fail(2, 'REMOTE_DATA_URL or DATA_SECRET is not set (.env.local)')

async function capture() {
  const state = (() => { try { return JSON.parse(readFileSync(join(DATA, 'browser.json'), 'utf8')) } catch { return null } })()
  if (!state?.port) fail(4, 'no study browser is running (npm run browser:start -- <url> [--site <site>])')
  let targets = []
  try { targets = await (await fetch(`http://127.0.0.1:${state.port}/json/list`)).json() } catch { fail(4, `the study browser does not answer on port ${state.port} (npm run browser:status)`) }
  const page = targets.find((t) => t.type === 'page' && !t.url.startsWith('about:')) ?? targets.find((t) => t.type === 'page')
  if (!page?.webSocketDebuggerUrl) fail(4, 'the study browser has no page open')
  const sock = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((ok, no) => { sock.onopen = ok; sock.onerror = () => no(new Error('cdp')) }).catch(() => fail(4, 'could not attach to the page'))
  let id = 0
  const waiting = new Map()
  sock.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id) } }
  const send = (method, params = {}) => new Promise((ok) => { const n = ++id; waiting.set(n, ok); sock.send(JSON.stringify({ id: n, method, params })) })
  const params = { format: 'png' }
  if (!argv.includes('--viewport')) {
    // The whole page, up to 8000 px tall: a longer page is cut, which the result says.
    const m = (await send('Page.getLayoutMetrics')).result
    const size = m?.cssContentSize ?? m?.contentSize
    if (size) Object.assign(params, { captureBeyondViewport: true, clip: { x: 0, y: 0, width: Math.ceil(size.width), height: Math.min(Math.ceil(size.height), 8000), scale: 1 } })
  }
  const shot = await send('Page.captureScreenshot', params)
  sock.close()
  if (!shot.result?.data) fail(1, `the browser did not give a screenshot: ${shot.error?.message ?? 'no data'}`)
  return { png: Buffer.from(shot.result.data, 'base64'), url: page.url, title: page.title }
}

const got = file
  ? (existsSync(file) ? { png: readFileSync(file), url: '', title: basename(file) } : fail(2, `no file ${file}`))
  : await capture()
if (got.png.length < 1000 || got.png.subarray(1, 4).toString() !== 'PNG') fail(1, 'not a PNG image')
const form = new FormData()
form.append('file', new Blob([got.png], { type: 'image/png' }), `${task}-${name.replace(/[^0-9a-z-]+/gi, '-').toLowerCase()}.png`)
form.append('title', `${task} · ${name}`)
let res
try {
  res = await fetch(`${DATA_URL}/media/upload`, { method: 'POST', headers: { 'X-Data-Secret': DATA_SECRET }, body: form })
} catch (e) { fail(1, `the data layer did not answer: ${e.message}`) }
const body = await res.json().catch(() => null)
if (!res.ok || !body?.ok || !body.item?.id) fail(1, `the storage refused: ${res.status} ${body?.error ?? ''}`)
say(JSON.stringify({ name, id: body.item.id, file: `/api/media/${body.item.id}/file`, page: got.url, bytes: got.png.length }))
say(`===SHOT_OK=== ${name} · ${body.item.id} · put it into screens[] of the report part: {"name":…,"id":…,"file":…,"page":…}`)

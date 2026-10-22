// npm run rea -- <command> [args…] [--save <file>] — REA from the core's single copy (node steps 539-2, 563-2).
//
// The node keeps ONE copy of REA (rea-agents 6.7.0) in <node>/data/tools/rea; this element only calls it. No MCP server is registered
// anywhere (decision of step 539): the CLI has the same tools, and no tool descriptions ride in any agent's context.
// Not installed → the node's agent installs it with the core door /api/node/rea (44 s); this script says so and stops (code 3).
//
// --save <file>: REA's JSON answer can be huge (a static analysis of one built site was 107 MB, step 539-2) — the whole answer goes to
// <file>, and only its digest is printed: summary, statistics, limitations and the evidence id. Read the rest with
// `npm run rea -- inspect-analysis-view …` rather than opening the file.
// Every child process: windowsHide and an environment without the labels of a Next server or the core (node law 280-6).
import { spawn } from 'node:child_process'
import { closeSync, createWriteStream, existsSync, mkdirSync, openSync, readFileSync, readSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ELEMENT = resolve(process.env.ELEMENT_DIR || join(dirname(fileURLToPath(import.meta.url)), '..'))
const NODE = resolve(ELEMENT, '..', '..', '..') // an element lives at <node>/WEB4-ITEMS/<kind>/<id>
const REA = join(NODE, 'data', 'tools', 'rea', 'node_modules', 'rea-agents', 'scripts', 'rea.mjs')
const DIGEST_LIMIT = 50 * 1024 * 1024 // above this the digest is not parsed here: inspect-analysis-view reads big evidence

const args = process.argv.slice(2)
const at = args.indexOf('--save')
const save = at >= 0 ? resolve(args[at + 1] ?? '') : null
if (at >= 0) args.splice(at, 2)

if (!existsSync(REA)) {
  console.log('===REA_MISSING=== REA is not installed in the core of this node (data/tools/rea). The node\'s agent installs it with the core door POST /api/node/rea, then this command works.')
  process.exit(3)
}
if (!args.length) {
  console.log('usage: npm run rea -- <command> [args…] [--save <file>]   (npm run rea -- --help lists the commands)')
  process.exit(2)
}

const env = {}
for (const [k, v] of Object.entries(process.env)) if (v !== undefined && !/^(__NEXT|NEXT_|AGI_)/.test(k)) env[k] = v
const child = spawn(process.execPath, [REA, ...args], { cwd: process.cwd(), env, windowsHide: true, stdio: ['ignore', save ? 'pipe' : 'inherit', 'inherit'] })
if (save) {
  mkdirSync(dirname(save), { recursive: true })
  child.stdout.pipe(createWriteStream(save))
}
child.on('close', (code) => {
  if (save) {
    const size = existsSync(save) ? statSync(save).size : 0
    console.log(`===REA_SAVED=== ${save} (${Math.round(size / 1024)} KB, code ${code})`)
    if (size > 0 && size <= DIGEST_LIMIT) {
      try {
        const answer = JSON.parse(readFileSync(save, 'utf8'))
        const n = answer.normalized_result ?? answer.result ?? answer
        const digest = {
          ok: answer.ok ?? (code === 0),
          evidence_id: answer.evidence_id ?? answer.evidence?.id ?? n?.evidence_id,
          summary: n?.summary,
          statistics: n?.statistics,
          limitations: n?.limitations,
          error: answer.error,
        }
        console.log(JSON.stringify(digest, null, 2).slice(0, 6000))
      } catch {
        console.log(readFileSync(save, 'utf8').slice(0, 2000))
      }
    } else if (size > DIGEST_LIMIT) {
      // The evidence id opens the answer: read it from the first bytes instead of parsing ~100 MB.
      const head = Buffer.alloc(4096)
      const fd = openSync(save, 'r')
      readSync(fd, head, 0, head.length, 0)
      closeSync(fd)
      const id = head.toString('utf8').match(/"evidence_id":"(ev_[0-9a-f]+)"/)?.[1]
      console.log(`The answer is too big to digest here (evidence ${id ?? 'id not found'}): read parts of it with \`npm run rea -- inspect-analysis-view …\`.`)
    }
  }
  process.exit(code ?? 1)
})

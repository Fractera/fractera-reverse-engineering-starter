---
name: reverse-engineer
description: >
  Work skill. How this element studies a finished product for the node: a website, or a package and SDK (npm and JavaScript,
  Python, .NET, a native library, Android, WASM), with REA from the core, and writes one report in the product's own words that
  the product quiz reads. Load it when a task from the node or the person asks how a product, a site, an app or an SDK works:
  «разбери», «как устроен», «reverse engineer», «parse this SDK». The thing you cannot guess: one REA answer can be over 100 MB,
  so save it to a file and read only its digest; and the report tells how the product works in your own words, never carrying its
  code, texts, images, design or data.
context: fork
model: opus
effort: max
background: false
---

# reverse-engineer

> Informational, not binding: know a better way for the case in front of you — do it your way and say so.

**Process: working** — the result is data: a report in this element's data folder, outside git. Nothing is committed or rebuilt.

Subagent: allowed — the analysis is long, heavy work with REA; its own context does not drag the element's other skills and the
conversation, and the report is all the caller needs (owner 2026-10-22, step 563: «запускай его в режиме Sub агента»).

## The task folder

`<SERVICE_DATA_DIR>/reports/<task-id>/` — the task id comes from the node; without one, `YYYY-MM-DD-<slug>`.

| Path | What |
|---|---|
| `input/` | what you downloaded: a package tarball, an APK. Never run it, never `npm install` it (install scripts run code) |
| `evidence/` | REA answers saved with `--save` |
| `report.json`, `report.md` | the result |

## The line you do not cross (node step 538, REA's own DISCLAIMER)

Studying how a product is built and building your own is allowed. Never copy the product's code, texts, images, design or data
into the report or anywhere else. Never sign in, never pass a paywall, a captcha, DRM, a license check or any other protection:
public pages and published packages only. A task that asks for more: stop and say why in one line.

## The REA command by what the product is

All through `npm run rea -- <command> …` (the core's single copy of REA, no MCP). `npm run rea -- --help` lists every command.

| The product | First commands |
|---|---|
| website | `npm run browser:start -- <url>` → `list-browser-targets http://127.0.0.1:<port>` → `inspect-web-page`, `observe-web-session` or `capture-browser-scenario` → `export-web-scripts` and then `analyze-javascript-application` on the exported scripts → `npm run browser:stop` |
| npm / JavaScript SDK | `npm pack <name>@<exact version> --pack-destination input` → `tar -xzf` → `analyze-javascript-application <abs path>/input/package --json --save evidence/<name>.json`; then `recover-javascript-sources`, `compare-javascript-export-shapes` |
| Python package (wheel, sdist) | download it into `input/` → `extract-artifact`, `inspect-artifact` |
| .NET assembly (NuGet) | `inspect-managed-artifact` → `project-managed-application-graph` |
| Android (APK) | `inspect-android-package` (needs JADX and a full JDK) |
| WASM | `inspect-wasm-artifact` (needs WABT 1.0.42) |
| native library (.dll, .so, .dylib) | `inspect-artifact`; `inspect-native-api` needs Hopper, Ghidra or IDA |
| Rust or Go binary | `inspect-rust-binary`, `inspect-artifact` (built in) |
| anything else | `inspect-artifact` — it lists what it observed and the next probes |

A command that needs an engine REA does not install (JADX, a JDK, WABT, Ghidra, Hopper, IDA, Binwalk…): write it in the report under
`limits` and install nothing yourself — that is the node owner's decision. REA's own guide, with every target: `references/rea/REA-SKILL.md`
and the files next to it (a copy, see `references/rea/SOURCE.md`).

## Read big answers by parts

`npm run rea -- <command> … --json --save <task>/evidence/<name>.json` writes the whole answer and prints only its digest (summary,
statistics, limitations, evidence id). Read the rest with `npm run rea -- inspect-analysis-view …` and that evidence id; never open the
whole file. The analysis is static: REA reads the files and runs none of them.

A package often ships one code twice (`cjs/` and `esm/`, plus `.d.ts` and `.map`): give REA one of them. Measured 2026-10-22 on the
Stripe npm SDK 23.0.0: the whole package — 1497 files, 2 minutes, a 108 MB answer, and REA's own limitation «resource constraint …
semantic analysis … was not started» for part of the files (the static facts of every file stay). Empty input is not a refusal:
REA answers `modules: 0` — check the counts before you write anything from them.

## The report — one form for the analysis and the quiz

`report.json`:

```json
{
  "task": "<task-id>",
  "target": { "kind": "website | npm-sdk | python-package | dotnet | android | wasm | native | other", "name": "", "version": "", "source": "<url or package@version>" },
  "summary": "what the product does, two or three sentences",
  "roles": [{ "name": "", "can": [""] }],
  "scenarios": [{ "name": "", "steps": [""], "roles": [""] }],
  "entities": [{ "name": "", "fields": [""], "relations": [""] }],
  "rules": [""],
  "pages": [{ "path": "", "purpose": "" }],
  "data_sources": [{ "what": "", "from": "" }],
  "sdk": { "modules": [""], "public_functions": [{ "name": "", "does": "" }], "endpoints": [""], "auth": "", "dependencies": [""] },
  "limits": [""],
  "evidence": [{ "claim": "", "evidence_id": "", "command": "" }]
}
```

Every finding has evidence: the REA evidence id and the command that produced it. A website fills `pages`, a package fills `sdk`;
the other stays empty. `report.md` says the same for a person, in the language of the task, headings in the order of `report.json`.

Then the graph: the entities and their relations go to the graph element of the node as a ready graph — `POST /api/graph-insert` with
the node key (`X-Node-Key` = `SETTINGS_SECRET` of this element; the port: `npm run a2a -- card graph`); chunk = a sentence of the
summary, `source_id` = the task id. The graph refuses (`no_key`, `key_refused`) — the report files stay, say so in your answer.

## Finish

`npm run browser:stop` if you started it · `report.json` and `report.md` exist · answer in one line: the target and where the report is.

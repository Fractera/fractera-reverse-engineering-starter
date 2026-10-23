---
name: reverse-engineer
description: >
  Work skill. How this element studies a finished product for the node: a website, or a package and SDK (npm and JavaScript,
  Python, .NET, a native library, Android, WASM), with REA from the core, and writes one report in the product's own words that
  the product quiz reads. Load it when a task from the node or the person asks how a product, a site, an app or an SDK works:
  «разбери», «как устроен», «reverse engineer», «parse this SDK», and when the internal pages of a site are to be studied in a
  test account. The thing you cannot guess: internal pages are studied only in a test account the person confirmed — you only
  read and never see a password; one REA answer can be over 100 MB,
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
into the report or anywhere else. Never pass a paywall, a captcha, DRM, a license check or any other protection. Public pages and
published packages — always (the site's rules allowing); internal pages — only in a test account the person confirmed personally
(next section). A task that asks for more: stop and say why in one line.

## Internal pages — only in a test account the person confirmed (node step 556, owner 2026-10-22)

The owner: the agent studies internal pages itself, «он может хотя бы примерно знать как работает продукт … на какие кнопки надо нажать»,
in an account that «не должен быть реальным пользователем … не страшно потерять это пользователь должен подтвердить лично».

- **You never sign in and never see a password.** The person creates the test account and signs in himself in the node's login
  window (the core: `npm run study -- login <site>`); you get only the session in that site's own profile. No confirmed account →
  say so and stop; do not ask for a password, do not create an account.
- **The site's terms decide** (decision R1): terms that forbid automating an account, several accounts or bots — modes B and C are
  closed, only screenshots (A). Inside the person's session robots.txt does not apply: the agent is the person's assistant, not a
  crawler; public pages still follow robots.txt.
- **You only read** (decision R2): the guard of the study browser blocks every write, log-out, deletion, payment; a blocked action is a
  point of no return — record it in `pointsOfNoReturn`, never retry it another way. Crossing it is the person's own act, in mode B.

**The method is REA's own** (`references/rea/REA-SKILL.md`, «Plan broader investigations»): turn the task into questions about the
internal areas of this kind of product (dashboard, submit flow, edit, stats, notifications, settings, billing, team…) and the evidence
each needs → the smallest overview first → follow each question from its entry through the screens to its result → a ledger where every
finding is `observed`, `inferred` or `unknown` with its evidence → at the end walk the questions: answered, partly, open. Never call the
study complete while a needed question is open.

**Choose the mode per area** — breadth × reversibility, and the evidence the question needs:

| Mode | Who drives | Gives | Take it when |
|---|---|---|---|
| A — screenshots | the person takes them | how screens and states look | the terms forbid automation; the state after a point of no return; a rare event; a mobile app |
| B — a guided walk | the person, in `npm run browser:start -- <url> --site <site> --visible`; you record with `npm run rea -- observe-web-session <endpoint> <target> --observation-ms <the whole scenario>` | transitions and requests WITH their initiator stacks — which button and script sent what | how an action talks to the server; a step only a person can do (captcha, a code from mail) |
| C — your walk | you, in `npm run browser:start -- <url> --site <site>` (no window, the guard lets only reads through), with `npm run rea -- capture-browser-scenario <json>` in connect mode (`list-browser-targets` for the target) | breadth: every menu item, tab, filter, empty and error states of forms before sending | many screens and branches; a full map |

Scenario requests carry no initiator stacks — that is why B exists. Never run a passive capture and a scenario on the same tab at once.
Connect mode first opens `start_url` and can drop form state: recreate the state in the declared actions and add a wait for the page
state before capturing. Keep the guard's budget in mind: one area at a time; `npm run browser:status` shows what it blocked and why it
stopped. A challenge page, «unusual activity» or 429 stops the browser — report it and never retry with another account.

**What goes into the report — structure, never content:** screens and their purpose, elements and fields in your own words, states,
validation messages you triggered without sending, transitions, gates (an upgrade wall, a limit), points of no return, and requests as
method and path template. Never people's names, their texts, messages or any value.

**Every screen and state you study goes into the node's storage** (owner 2026-10-23: «создавать скриншоты и охранять их в наш файловое
хранилище чтобы в будущем, разрабатываем интерфейс можно было подсматривать кнопки карточки»): `npm run shot -- --task <task id> --name
<screen>` takes the page open in the study browser (the whole page; `--viewport` for the visible part) and prints its storage id and
link; a screenshot the person gave — `--file <png>`. Put `{ "id", "file" }` into `screens[].shot`. They are kept for looking at buttons
and cards later, never for copying a design (node law 538). No browser running → the command refuses, nothing is uploaded.

## Continue a study — the next part of a series (node step 556-14)

The main agent asks «Continue the study <series> …» when the person pressed the wide «Continue the study» under the decision.
- Read what is missing: the core door `GET /api/node/reverse-report?job=<series>` with the node key (`X-Node-Key` = `SETTINGS_SECRET`) —
  `verdict.pages` (what to capture) and `verdict.signIn` (the test account to use). Parts already done: the list of the same door.
- **One scenario per part** — the 1–4 connected pages that close the largest observable gap of the decision, from entry to result.
- `verdict.signIn` → `npm run browser:start -- <url> --site <site>` (the confirmed account; the guard lets only reads through). No
  confirmed account → stop and say so: the person signs in from the orange card on the page.
- Each screen and each state of the scenario → `npm run shot`. A point of no return (publish, pay, delete) → stop before it, shoot the
  screen, record it in `pointsOfNoReturn`.
- Write the part **once, at the end**: the folder `reports/<series>-<n>/` (n = the next free part number), `report.json` in the form
  below with `"series": "<series>", "part": <n>` and only what this part saw, `report.md` for a person. ✗ The first study spent 5.2
  million tokens rewriting its report — write it in one pass.

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
  "series": "<the first task of the series; only in a part 2, 3…>",
  "part": 2,
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
  "evidence": [{ "claim": "", "evidence_id": "", "command": "" }],
  "screens": [{ "id": "SC-01", "name": "", "purpose": "", "entry": "", "elements": [""], "states": [""], "forms": [{ "fields": [""], "validation": [""] }], "gates": [""], "mode": "A | B | C", "basis": "observed | inferred | unknown", "shot": { "id": "", "file": "/api/media/<id>/file" } }],
  "transitions": [{ "from": "SC-01", "action": "", "to": "SC-02", "mode": "A | B | C" }],
  "pointsOfNoReturn": [{ "screen": "SC-03", "action": "", "after": "unknown | seen in mode A or B" }],
  "coverage": { "questions": 0, "answered": 0, "partly": 0, "open": 0 },
  "activity": { "pages": 0, "blocked": 0, "stops": [""] },
  "authority": { "terms": "<what the terms allow>", "account": "test", "consentAt": "<date of the person's consent>" }
}
```

`screens` … `authority` are filled only when internal pages were studied (a test account); a study of public pages leaves them out.

Every finding has evidence: the REA evidence id and the command that produced it. A website fills `pages`, a package fills `sdk`;
the other stays empty. `report.md` says the same for a person, in the language of the task, headings in the order of `report.json`.

Then the graph: the entities and their relations go to the graph element of the node as a ready graph — `POST /api/graph-insert` with
the node key (`X-Node-Key` = `SETTINGS_SECRET` of this element; the port: `npm run a2a -- card graph`); chunk = a sentence of the
summary, `source_id` = the task id. The graph refuses (`no_key`, `key_refused`) — the report files stay, say so in your answer.

## Finish

`npm run browser:stop` if you started it · `report.json` and `report.md` exist · answer in one line: the target and where the report is.

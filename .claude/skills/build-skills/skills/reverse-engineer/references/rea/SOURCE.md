# Source of these files

- What: the skill «reverse-engineer-anything» of REA and its references, with REA's LICENSE and DISCLAIMER.
- From: the npm package `rea-agents` 6.7.0 (repository https://github.com/morluto/rea, MIT, Copyright (c) 2026 morluto), the copy the
  node keeps in `<node>/data/tools/rea` (node step 539-2).
- Why here: a reference for the subagent of the skill `reverse-engineer` (node step 563-2). It is NOT registered as a skill of this
  element: `SKILL.md` is renamed `REA-SKILL.md`, and REA runs through `npm run rea` (CLI), with no MCP server — where these files say
  «the REA MCP tools», use the CLI command of the same name.
- Process: working
- Update: copy the same files again from `<node>/data/tools/rea/node_modules/rea-agents/skills/reverse-engineer-anything/` after the node
  updates REA. Never edit them by hand.

# Anti-patterns

Dead ends already paid for. One entry per cause: symptom · cause · cure. Newest on top.

| Symptom | Cause | Cure |
|---|---|---|
| A page of blocks shows only its title and an empty `<main>` in the served HTML, while every guard passes | the page's `_data/meta.json` kept `"bare": true` from the template: a bare page draws only its widgets and skips the sequence of blocks | a page of blocks has no `bare`; after a change check the served HTML with `curl` as a visitor, the guards do not see an empty page |
| A link `#<blockKey>` to a block-flow goes nowhere | the flow prints its section heading with the id `<blockKey>-t`, not `<blockKey>` | link to `#<blockKey>-t`; find the real id in the served HTML with `grep` before you write the link |
| The build stops on the shadcn guard `no-manual-dark` after minutes of work | a status colour written from the palette with a manual `dark:` pair (`bg-emerald-500/15 text-emerald-700 dark:text-emerald-300`): a palette colour fits one theme and breaks the other | take a theme token that already knows both themes (`--primary`, `--accent`, `--destructive`, the `tone-*` tokens where the theme has them); before a long build run `npm run prebuild` alone — every guard in seconds |
| A search over the docs finds nothing, yet the record exists | the record was written in Russian: one word has six case forms, and a literal search matches one | write documents in English; the person's words only inside quotes |

---
name: use-blocks
description: >
  Builder skill. How a page of this element gets its sections — from the node's catalogue of blocks, never drawn by hand. Load it
  before you add or change a section of a page, build or rebuild a home page or a landing, when the person asks for "a hero", "a
  comparison", "three numbers", "steps", "questions", "the same page in the style of …", and before you write any JSX for a page.
  The thing you cannot guess: the catalogue already holds designed blocks with cards and cases, `npm run blocks -- find` names the
  right one in five lines whatever the catalogue's size, and `npm run blocks -- add` installs it and registers it in the three places
  a page kind lives — a block registered by hand lost its text in the machine copy of a page on this node (element graph, 2026-10-23).
---

# use-blocks

> Informational, not binding: know a better way for the case in front of you — do it your way and say so. The one thing that is
> not optional: a section of a page is a block of the catalogue, or a request for one — never a section drawn by hand.

**Process: build** — this skill changes the element as a thing: code, commit, rebuild; confirm with the three lines of `.claude/modes/build.md` («Confirm the request first»).

## Find, install, compose

1. **Find.** Say the need in plain English words, the way a reader of the page would feel it:
   `npm run blocks -- find "three numbers that prove a claim"`. Five lines at most: the block, its closest case, where it may stand
   (standalone · standalone and inside X · only inside X), its role (opener, body, closer), installed here or not. A line marked
   «⚠ its card says avoid» is not for this need. Filters: `--role opener|body|closer`, `--category <section>`,
   `--collection <project>` (the project's blocks first). A home page of a built-in element: `--collection native-element-home`.
2. **See.** `npm run blocks -- show <block>` — when to use it and when not, its limits («exactly 3», text length), the data shape and
   every case with sample data. Copy the case that is closest and put your words in it.
3. **Install.** `npm run blocks -- add <block>` — writes the block and its card, registers it in `lib/content/blocks/registry.tsx`,
   `lib/content/blocks/types.ts` and `lib/aio/blocks-to-markdown.ts`. Run it again — nothing doubles. It stops if an installed block
   was changed by hand: do not edit an installed block; ask for a variant (step 5).
4. **Compose.** The page is a sequence in `_data/<lang>.json` (skill `use-page-tree`): `block-*` and `text-*`, the same kinds and
   order in every language. The card decides the place: an opener first, a closer last, a block «only inside X» goes into the
   `children` of X (a route card into `block-hero-figure`), a block with `repeat: once` once per page. Then the page's guards.
5. **Nothing fits.** `npm run blocks -- request "<the need>" --page <path> [--project <id>]` — the Blocks element places it in its
   lifecycle (a published block, a variant of one, a new block, a new section by the owner's word). Until it is published, build the
   page from what exists; never draw the missing section by hand.

## Rules of the catalogue

- A home page is a sequence of blocks; a page of one widget (`bare`) is not a way around this.
- Words of a block come from the page data; colours and type from the theme («Design»). Never edit a block's file in
  `components/blocks/` to change its look for one page.
- The Blocks element is found through the core (`npm run blocks` asks it); `--registry <url>` points at another copy (a preview).
- What you installed and what you composed is written in the step's report: block, case you started from, why.

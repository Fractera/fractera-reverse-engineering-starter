#!/usr/bin/env node
// check:page-blocks — сторож СОСТАВА СТРАНИЦЫ ПО КАРТОЧКАМ БЛОКОВ (узел, шаг 577-5).
//
// 🔒 ЗАЧЕМ. `check:page-sequence` знает только ВИДЫ записей (block-* · text-* · widget-*) и их одинаковость в языках. Где блоку стоять,
// сколько раз и в каком соседстве, говорит его карточка `components/blocks/<блок>.card.json` — до этого сторожа её не читал никто, и
// страница из верных блоков в неверном порядке проходила сборку зелёной. ✗ 577-7: главная с `bare: true` и без единого виджета
// отдавала пустой `<main>` при всех зелёных сторожах.
//
// Что проверяется по каждой папке данных (`_data/`, `_pages/**/`), порядок — по `en.json`, длина слов — в каждом языке:
//   ОШИБКИ (код 1):
//   1. `role: opener` — только в начале страницы (несколько открывающих подряд законны: крошки, затем первый экран);
//      `role: closer` — только в конце (вопросы, затем лента языков). Поле `faq` страницы рисует фабрика ПОСЛЕ блоков — это
//      закрывающий `block-faq`.
//   2. `placement`: на странице — только `placement.page: true`; внутри контейнера (`children`) — только если контейнер назван в
//      `placement.inside`, и контейнер с `accepts` принимает только названное (`text` — типографику).
//   3. `repeat: once` — второй такой на странице; `repeat: not-adjacent` — два одинаковых подряд на одном уровне.
//   4. `slots` — число элементов списка вне `min…max` (например, ровно три шага).
//   5. Два `h1` на странице.
//   6. `meta.bare` без единого виджета — рисуются только виджеты, страница пуста.
//   7. `meta.bare` у главной публичной ветки — только поимённым исключением с причиной (ниже).
//   ПРЕДУПРЕЖДЕНИЯ (код 0, печатаются каждый прогон):
//   - `maxChars` слота превышен — длина зависит от языка; пропуск уровня заголовка — уровни зашиты в блок, решает выбор блока;
//   - два `weight: heavy` подряд, две полосы фона (`band`) подряд; `status: deprecated` — с заменой из `alternatives`;
//   - `meta.bare` вместе с block-*/text-* — их рисует виджет, если читает; блок без карточки — правила не проверены.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const ROOT = process.cwd()
const LANG = join(ROOT, 'app', '[lang]')
const HOME = join(LANG, '(publicLayer)', '_data')
const read = (p) => readFileSync(p, 'utf8')
const rel = (p) => relative(ROOT, p).split(sep).join('/')

// 🔒 ИСКЛЮЧЕНИЯ — поимённо и с причиной: папка данных → почему главная без рамки законна.
const BARE_HOME_EXCEPTIONS = {
}

const CARDS = new Map()
const cardsDir = join(ROOT, 'components', 'blocks')
if (existsSync(cardsDir)) {
  for (const f of readdirSync(cardsDir).filter((x) => x.endsWith('.card.json'))) {
    const c = JSON.parse(read(join(cardsDir, f)))
    CARDS.set(c.name, c)
  }
}

const errors = []
const warnings = []
const err = (file, msg) => errors.push(`  ${rel(file)}: ${msg}`)
const warn = (file, msg) => warnings.push(`  warning ${rel(file)}: ${msg}`)

function pageDirs(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (!statSync(p).isDirectory()) continue
    if (name === 'node_modules' || name === '_widgets' || name === '_components' || name === '_libs') continue
    if (existsSync(join(p, 'en.json'))) out.push(p)
    pageDirs(p, out)
  }
  return out
}

const isBlock = (k) => typeof k === 'string' && k.startsWith('block-')
const level = (h) => Number(String(h).replace(/^h/, '')) || 0

/** Последовательность страницы, как её рисует фабрика: блоки, затем `faq` закрывающим блоком. */
function sequenceOf(page) {
  const seq = Array.isArray(page.blocks) ? [...page.blocks] : []
  const hasFaqField = Array.isArray(page.faq) ? page.faq.length > 0 : Boolean(page.faq)
  if (hasFaqField && !seq.some((b) => b?.kind === 'block-faq')) seq.push({ kind: 'block-faq', _fromFaqField: true })
  return seq
}

/** Слоты: число элементов — ошибка, длина слов — предупреждение. */
function checkSlots(file, block, card, where) {
  for (const [slot, rule] of Object.entries(card.slots || {})) {
    const v = block[slot]
    if (v == null) continue
    if (Array.isArray(v)) {
      if (rule.min != null && v.length < rule.min) err(file, `${where}: slot «${slot}» has ${v.length} item(s), the card needs at least ${rule.min}`)
      if (rule.max != null && v.length > rule.max) err(file, `${where}: slot «${slot}» has ${v.length} item(s), the card allows at most ${rule.max}`)
      for (const [i, item] of v.entries()) {
        for (const [field, fr] of Object.entries(rule.fields || {})) {
          const s = item?.[field]
          if (typeof s === 'string' && fr.maxChars && s.length > fr.maxChars) warn(file, `${where}: «${slot}[${i}].${field}» is ${s.length} chars, the card suggests ≤ ${fr.maxChars}`)
        }
      }
    } else if (typeof v === 'string' && rule.maxChars && v.length > rule.maxChars) {
      warn(file, `${where}: «${slot}» is ${v.length} chars, the card suggests ≤ ${rule.maxChars}`)
    }
  }
}

/** Место блока и правила контейнера на каждом уровне вложенности. */
function checkLevel(file, list, parent, counts) {
  let prevKind = null
  let prev = null
  for (const [i, b] of list.entries()) {
    const kind = b?.kind
    const where = parent ? `«${kind}» inside «${parent}»` : `«${kind}» (position ${i + 1})`
    if (!isBlock(kind)) {
      if (parent) {
        const pc = CARDS.get(parent)
        if (pc && Array.isArray(pc.accepts) && typeof kind === 'string' && kind.startsWith('text-') && !pc.accepts.includes('text')) err(file, `${where}: «${parent}» does not accept typography — it accepts ${pc.accepts.join(', ')}`)
      }
      prevKind = kind
      prev = null
      continue
    }
    counts.set(kind, (counts.get(kind) || 0) + 1)
    const card = CARDS.get(kind)
    if (!card) {
      if (!b._fromFaqField) warn(file, `${where}: no card components/blocks/${kind}.card.json — its rules are not checked`)
      prevKind = kind
      prev = null
      continue
    }
    const inside = card.placement?.inside || []
    if (!parent && card.placement?.page === false) err(file, `${where}: stands on the page, but the card places it only inside ${inside.join(', ') || '(nothing)'}`)
    if (parent) {
      if (!inside.includes(parent)) err(file, `${where}: the card places it ${card.placement?.page ? 'on the page' : ''}${card.placement?.page && inside.length ? ' or ' : ''}${inside.length ? `inside ${inside.join(', ')}` : ''}, not inside «${parent}»`)
      const pc = CARDS.get(parent)
      if (pc && Array.isArray(pc.accepts) && !pc.accepts.includes(kind)) err(file, `${where}: «${parent}» accepts only ${pc.accepts.join(', ')}`)
    }
    if (card.repeat === 'not-adjacent' && prevKind === kind) err(file, `${where}: two «${kind}» in a row — its card says not-adjacent`)
    if (prev && prev.weight === 'heavy' && card.weight === 'heavy') warn(file, `${where}: two heavy blocks in a row («${prevKind}», «${kind}»)`)
    if (prev && prev.band === true && card.band === true) warn(file, `${where}: two background bands in a row («${prevKind}», «${kind}»)`)
    if (card.status === 'deprecated') warn(file, `${where}: deprecated — ${card.alternatives?.length ? `take ${card.alternatives.join(' or ')}` : 'its card names no replacement'}`)
    checkSlots(file, b, card, where)
    if (Array.isArray(b.children)) checkLevel(file, b.children, kind, counts)
    prevKind = kind
    prev = card
  }
}

let pages = 0
for (const dir of pageDirs(LANG)) {
  const enFile = join(dir, 'en.json')
  const en = JSON.parse(read(enFile))
  if (!Array.isArray(en.blocks)) continue
  pages++
  const meta = existsSync(join(dir, 'meta.json')) ? JSON.parse(read(join(dir, 'meta.json'))) : {}
  const seq = sequenceOf(en)
  const kinds = seq.map((b) => b?.kind)

  // 6–7: страница без рамки.
  if (meta.bare) {
    const widgets = kinds.filter((k) => typeof k === 'string' && k.startsWith('widget-'))
    if (!widgets.length) err(join(dir, 'meta.json'), '"bare": true draws only widgets, and this page has none — the page is empty. Remove "bare" (blocks are drawn by the page) or add the widget')
    else if (kinds.some((k) => isBlock(k) || (typeof k === 'string' && k.startsWith('text-')))) warn(join(dir, 'meta.json'), `"bare": true — its block-*/text-* entries are not drawn, only ${widgets.join(', ')}; if the widget does not read them, remove "bare"`)
    if (dir === HOME && !BARE_HOME_EXCEPTIONS[rel(dir)]) err(join(dir, 'meta.json'), 'the home of the public branch is a sequence of blocks; "bare" here needs a named exception with its reason in scripts/check-page-blocks.mjs')
    if (dir === HOME && BARE_HOME_EXCEPTIONS[rel(dir)]) warnings.push(`  exception ${rel(dir)}: ${BARE_HOME_EXCEPTIONS[rel(dir)]}`)
  }

  // 1: открывающие — в начале, закрывающие — в конце.
  const roleOf = (k) => (isBlock(k) ? CARDS.get(k)?.role : null)
  let firstNonOpener = kinds.findIndex((k) => roleOf(k) !== 'opener')
  if (firstNonOpener < 0) firstNonOpener = kinds.length
  kinds.forEach((k, i) => { if (roleOf(k) === 'opener' && i > firstNonOpener) err(enFile, `«${k}» (position ${i + 1}) opens a page — its card says role: opener, so only at the start, before «${kinds[firstNonOpener]}»`) })
  let lastNonCloser = -1
  kinds.forEach((k, i) => { if (roleOf(k) !== 'closer') lastNonCloser = i })
  kinds.forEach((k, i) => { if (roleOf(k) === 'closer' && i < lastNonCloser) err(enFile, `«${k}» (position ${i + 1}) closes a page — its card says role: closer, so only at the end, after «${kinds[lastNonCloser]}»`) })

  // 2–4: место, повтор, слоты — порядок по en, длина слов по каждому языку.
  const counts = new Map()
  checkLevel(enFile, seq, null, counts)
  for (const [kind, n] of counts) if (n > 1 && CARDS.get(kind)?.repeat === 'once') err(enFile, `«${kind}» stands ${n} times — its card says once per page`)
  for (const f of readdirSync(dir).filter((x) => /^[a-z]{2}\.json$/.test(x) && x !== 'en.json')) {
    const w = JSON.parse(read(join(dir, f)))
    if (!Array.isArray(w.blocks)) continue
    const walk = (list, parent) => list.forEach((b, i) => {
      const card = CARDS.get(b?.kind)
      if (card) checkSlots(join(dir, f), b, card, parent ? `«${b.kind}» inside «${parent}»` : `«${b.kind}» (position ${i + 1})`)
      if (Array.isArray(b?.children)) walk(b.children, b.kind)
    })
    walk(w.blocks, null)
  }

  // 5: заголовки — один h1, без пропуска уровня (уровень блока — первый в его `headings`).
  const levels = seq.filter((b) => isBlock(b?.kind)).map((b) => ({ kind: b.kind, h: level(CARDS.get(b.kind)?.headings?.[0]) })).filter((x) => x.h)
  const h1 = levels.filter((x) => x.h === 1)
  if (h1.length > 1) err(enFile, `two h1 on the page: ${h1.map((x) => x.kind).join(', ')}`)
  let current = 1
  for (const x of levels) {
    if (x.h > current + 1) warn(enFile, `«${x.kind}» starts at h${x.h} after h${current} — a heading level is skipped`)
    current = x.h
  }
}

for (const w of warnings) console.log(w)
if (errors.length) {
  console.error(`===PAGE_BLOCKS_FAILED=== errors: ${errors.length}\n${errors.join('\n')}`)
  console.error('A page follows the cards of its blocks: components/blocks/<block>.card.json — role, placement, repeat, slots. Skill use-blocks.')
  process.exit(1)
}
console.log(`===PAGE_BLOCKS_OK=== pages: ${pages}; cards: ${CARDS.size}; warnings: ${warnings.length}`)

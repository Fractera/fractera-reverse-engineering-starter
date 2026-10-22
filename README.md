# fractera-reverse-engineering — the reverse engineering tool of a Fractera node

A native element of the node, built on the Fractera native element template (v0.1.20). The node turns it on for one task and off
right after it (owner 2026-10-22: «этот тяжелый инструмент по умолчанию выключенным … агент узла мог его включить … отработать задачу
и выключить»).

**What it is for.** A person tells an element «I want a site like Product Hunt». The element's product quiz asks the node for an
analysis; the node turns this element on, its agent studies the product in a browser without a window (REA, one copy in the core)
and writes a report in the product's own words: roles, scenarios, entities, rules, pages and where the data comes from. The quiz
turns the report into stages of development, each of which works on its own. The element studies how a product works; it does not
copy the product's code, texts, images, design or data.

## Today: a body, turned off

Step 563-1 built only the body: the element folder, its passport and node contract, a record in the core registry and the install
by the node (built, never started). `npm run element:power -- reverse status` in the core prints the reason. The browser, the
analysis skill and the report come in 563-2 and later.

---

# fractera-native-item-starter

The reference starter template of a Fractera native element. Native elements are the root elements of a node: they stand on
every node, they come only from the Fractera repository, and they are never sold and never join an outside network. They serve
the person and the other elements of their own node. Custom elements are born from `fractera-custom-item-starter` by the node's
button «Create WEB4 ITEM»; native ones are added from here.

The template is the custom reference template without the network parts: no showcase or Nostr fields in the passport
(`visibility: node`, `messengers: { h2a: true, h2h: false, a2a: false }`), no messenger between people, no work for outside agents
and no order summaries. The home page shows one line, «Reference native template», and the yellow starter sign.

## In the Fractera project

The template of the node's native (built-in) elements. The core reads its address and tag from `WEB4-ITEMS-REGISTRY/native-template.json`
when a native element is born; native elements come only from Fractera repositories, are never sold and carry nothing of Lagrix. An
element already built on it keeps its copy.

You can change it in your own fork and point `native-template.json` of your core to your fork and tag. An element born from this
template starts with this README; its owner rewrites it to describe the element.

## The contract a replacement must keep

- `OWN-SERVICE-PROPS/` — the passport, the element's main door (`GET /api/own-service-props`); `NODE-CONTRACT.json` — what the node needs to install it.
- The port comes from the `PORT` environment variable.
- `GET /api/health` answers 200 without a session.
- Sign-in only through the node's auth element; stored data only through the node's data element.
- Public pages stay static.

A repository that does not keep this contract is refused; the node does not bend to it.

## Run on its own

```
npm install
npm run build
PORT=24683 node .next/standalone/server.js
```

License: MIT.

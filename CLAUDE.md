# CLAUDE.md

## Commands

```bash
npm run build    # compile TypeScript (src/ → build/)
npm run make     # generate static site (build/ → _site/)
npm run check    # validate items and print free item numbers
npm run lint     # ESLint on src/
npm run test     # lint + check (no site generation)
npm run serve    # serve _site/ at http://localhost:8000
npm run clean    # remove _site/
```

After editing TypeScript source, run `npm run build` before `npm run make` or `npm run check`.

## Architecture

This is a static site generator for a collection of mathematical items (definitions, theorems, proofs). The pipeline:

1. **Load** (`src/items/load.ts`): reads all files under `items/**/*` — `.md` files via gray-matter, `.yaml` via js-yaml
2. **Create nodes** (`src/items/create.ts`): turns raw data into typed `Node` subclasses
3. **Check** (`src/items/checks.ts`): enforces unique IDs, valid ID patterns, unique item numbers
4. **Concepts** (`src/items/concepts.ts`): synthesizes `Concept` nodes from inline `[text](=concept-name)` markup
5. **Validations** (`src/items/validations.ts`): attaches source validations to items
6. **Generate** (`src/web/generate-site.ts`): renders HTML via Nunjucks templates + markdown-it + KaTeX; outputs to `_site/`

## Node types

| Type | ID pattern | File location |
|------|-----------|---------------|
| Definition | `D<n>` | `items/definitions/` |
| Theorem | `T<n>` | `items/theorems/` |
| Proof | `P<n>` | `items/proof/` |
| Media | `M<n>` | `items/media/` |
| Source | `S<n>` | `items/sources/` |
| Validation | `V<n>` (auto) | `items/validations/` |

**All item types share a single numeric namespace.** D1, T2, P5 each occupy their number — no two items of any type can share the same number. Run `npm run check` to see which numbers are free.

## Item file format

Markdown items use YAML front matter:
```markdown
---
type: definition   # or theorem, proof, media, source
id: D42
created: 2024-01-15T10:00:00Z
creator: U1
keywords:          # optional
  - some-keyword
---
Body text with $inline math$ and $$display math$$.
```

Proofs additionally require `parent: T<n>` pointing to their theorem.

Validations use a YAML list format under `items/validations/`, linking items to source references by location.

## Markup link syntax

Within item bodies:
- `[text](=concept-name)` — defines a concept (italicizes text, creates concept node)
- `[text](D1)` — links to another item
- `[text](D1#concept-name)` — links to an item at a concept anchor
- `[text](#concept-name)` — links to a concept node
- `![alt](M1)` — embeds media

## Templates

Nunjucks templates live in `layouts/`. Item templates are in `layouts/item/` (one per type) and list templates in `layouts/list/`.

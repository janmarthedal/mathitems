# Contributing

## Finding a Free Item Number

All item types share a single numeric namespace — no two items across any type can use the same number. Run this command to see which numbers are available:

```bash
npm run check
```

Output example:
```
Free item numbers: 50, 51, 54, 58, 63, 64, 65, 105-
```

Pick any free number for your new item.

## Item Types

### Definition (`D<n>`)

**Folder:** `items/definitions/`  
**Filename:** `D<n>.md` (e.g. `D42.md`)

```markdown
---
type: definition
id: D42
created: 2024-01-15T10:00:00Z
creator: U1
keywords:         # optional
  - some-keyword
---
The [prime number](=prime-number) is a natural number greater than 1 that has no
positive divisors other than 1 and itself.
```

### Theorem (`T<n>`)

**Folder:** `items/theorems/`  
**Filename:** `T<n>.md` (e.g. `T8.md`)

```markdown
---
type: theorem
id: T8
created: 2024-01-15T10:00:00Z
creator: U1
keywords:         # optional
  - some-keyword
---
There are infinitely many [prime numbers](#prime-number).
```

### Proof (`P<n>`)

**Folder:** `items/proof/`  
**Filename:** `P<n>.md` (e.g. `P5.md`)

A proof must reference the theorem it proves via the `parent` field.

```markdown
---
type: proof
id: P5
parent: T4
created: 2024-01-15T10:00:00Z
creator: U1
---
Assume there are finitely many primes $p_1, \ldots, p_k$. Then $p_1 \cdots p_k + 1$
is divisible by none of them — a contradiction. See [T4](T4).
```

### Media (`M<n>`)

**Folder:** `items/media/`  
**Files:** a metadata file `M<n>.md` plus the actual media file (e.g. `M<n>.svg` or `M<n>.html`), both in the same folder.

The `.md` file contains only YAML front matter — no markdown body.

```markdown
---
type: media
id: M5
subtype: svg
creator: U1
created: 2024-01-15T10:00:00Z
path: M5.svg
description: "A right-angled triangle"   # optional
---
```

Supported subtypes: `svg`, `html`.

### Source (`S<n>`)

**Folder:** `items/sources/`  
**Filename:** `S<n>-<short-slug>.md` (e.g. `S4-rudin76.md`) — include a short descriptive slug after the ID.

The file contains only YAML front matter — no markdown body.

```markdown
---
type: source
id: S4
subtype: book
creator: U1
created: 2024-01-15
title: "Principles of Mathematical Analysis, 3rd Edition"
extra:
    author: Rudin, Walter
    publisher: McGraw-Hill
    year: 1976
    isbn: 978-0070542358
---
```

### User (`U<n>`)

**Folder:** `items/users/`  
**Filename:** `U<n>.yaml` (e.g. `U2.yaml`) — pure YAML, not markdown.

Users have their own `U<n>` ID namespace, separate from the shared numeric namespace used by D/T/P/M/S items.

```yaml
type: user
id: U2
created: 2024-01-15T10:00:00Z
name: Jane Doe
email: jane@example.com
```

**LLM contributors:** If you are an LLM creating or editing items, use a user whose `name` reflects your model name and version (e.g. `Claude Sonnet 4.6`). Check `items/users/` for an existing entry that matches; if none exists, create one with the next free `U<n>` ID and use the same email address used for git commits (e.g. `noreply@anthropic.com` for Claude).

### Validation

Validations link items to their locations in a source. They do not get an explicit `id` — one is assigned automatically.

**Folder:** `items/validations/`  
**Filename:** `S<n>-<short-slug>.yaml` — use the same slug as the corresponding source file (e.g. `S4-rudin76.yaml`).

These files are pure YAML (not markdown):

```yaml
type: validation
subtype: source
source: S4
list:
  - item: D1
    location: Page 1, Definition 1.1
    creator: U1
    created: 2024-01-15
  - item: T2
    location: Page 3, Theorem 1.11
    creator: U1
    created: 2024-01-15
```

## Markup Link Syntax

Within definition, theorem, and proof bodies:

| Syntax | Effect |
|--------|--------|
| `[text](=concept-name)` | Define a concept (italicizes text, creates a concept node) |
| `[text](D1)` | Link to item D1 |
| `[text](D1#concept-name)` | Link to item D1 at a concept anchor |
| `[text](#concept-name)` | Link to a concept node |
| `![alt](M1)` | Embed media item M1 |

Math is written in LaTeX: `$inline$` and `$$display$$`.

## Workflow

1. Run `npm run check` to find a free item number.
2. Create the file(s) in the correct folder with the correct name.
3. Fill in the required YAML front matter (see tables above).
4. Write the body for definitions, theorems, and proofs.
5. Run `npm run check` again — it should pass without errors.
6. Run `npm run make:full` to build the site and verify the item renders correctly.

## Required Fields Summary

| Type | Required fields | Notes |
|------|----------------|-------|
| definition | `type`, `id`, `creator`, `created` | `keywords` optional |
| theorem | `type`, `id`, `creator`, `created` | `keywords` optional |
| proof | `type`, `id`, `creator`, `created`, `parent` | `parent` is the theorem ID |
| media | `type`, `id`, `subtype`, `creator`, `created`, `path` | `description` optional |
| source | `type`, `id`, `subtype`, `creator`, `created`, `title`, `extra` | |
| validation | `type`, `subtype`, `source`, `list` | No `id` field |
| user | `type`, `id`, `created`, `name`, `email` | Own `U<n>` namespace |

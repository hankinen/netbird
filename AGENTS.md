# Working on this dashboard fork

Guidance for anyone, human or AI agent, changing this codebase.

This repository is a fork of
[netbirdio/dashboard](https://github.com/netbirdio/dashboard): the Next.js
static export, served by nginx, that manages a self-hosted NetBird network.
On top of upstream it carries four layers of our own:

| Layer | What it adds | Lives in |
| --- | --- | --- |
| Translations | zh-CN as a first-class language next to en | `src/i18n/`, `scripts/i18n/` |
| Ant Design theme | AntD-style light theme, phone and tablet layout, AntD pagination, tables as cards | `src/theme/`, `scripts/theme/` |
| Runtime config | deployment values served from `/runtime-config.json` instead of baked into the build; immutable, precompressed assets | `src/config/runtime/`, `scripts/runtime-config/`, `scripts/build/` |
| Container and release | nginx cache and CSP policy, config generated at container start, SSH release flow with rollback | `docker/`, `deploy/server/`, `.github/workflows/deploy.yml` |

One design goal sits behind all four: **`dev` must keep rebasing cleanly onto
upstream.** Add files next to upstream code rather than editing inside it;
when an upstream file has to change, keep the edit small, marked and
registered (see "Keep upstream merges clean").

## Scope

This file applies to the whole repository; the root `CLAUDE.md` only imports
it. Folder guides are more specific: they add rules for their own subtree and
take precedence there.

| Guide | Read it before |
| --- | --- |
| `src/i18n/I18N.md` | adding or changing any user-visible text |
| `src/theme/README.md` | touching styles, the phone layout, pagination or tables; syncing upstream |
| `src/modules/control-center/CLAUDE.md` | working in the Control Center canvas |
| `e2e/CLAUDE.md` | writing or running Playwright specs |
| `.storybook/visual-regression/CLAUDE.md` | judging and fixing visual differences |
| `docker/README.md` | changing the image, nginx config or runtime-config generation |
| `deploy/server/README.md` | changing the release script or the server layout |

## Branches, CI and what a push does

- `dev` is the only long-lived branch. Everything of ours lives on it; the
  old `i18n-zh-cn` and `feature/theme-antd` branches are gone.
- Upstream is `netbirdio/dashboard` `main`. Every script refers to it as
  `origin/main`. In a clone whose `origin` is this fork (it only has `dev`),
  add upstream as a remote or pass the override each script offers
  (`--remote` for `sync-upstream.sh`, `--base <ref>` for the theme guards,
  `BASE_REF=<ref>` for `npm run test:visual`).
- **A push to `dev` deploys to production.** `deploy.yml` builds the static
  export and streams it to the server on every push that touches anything
  but docs, stories, `.storybook/` or `e2e/`. Its only checks are
  `i18n:check`, the build with its postbuild guards and the config generator
  tests: no unit tests, no lint, no visual check. So: work on a branch, open
  a pull request to `dev`, let CI run, then merge. Never push straight to
  `dev` without the full "Before you hand it over" list.
- What runs where:

  | Event | Workflows |
  | --- | --- |
  | pull request to `dev` | Unit tests; Visual regression (reports, never fails); Theme AntD guard (selectors, dark must be identical, light fails on any change so a reviewer looks at the shots, phone overflow); Docs acknowledgement (tick "Documentation is **not needed**" in the PR body); cloud-deploy config check when the config generator changes |
  | push to `dev` | Deploy to server; Theme AntD guard (after the fact, it does not block the deploy) |
  | `main`, tags | nothing here: `build_and_push`, `sync-deploy-templates`, `bump-netbird` and the e2e workflows are upstream's. Leave them as they are; they return with every sync. The e2e workflows pull upstream's backend images and one needs a registry token secret; run e2e locally instead |

- Syncing upstream: `scripts/theme/sync-upstream.sh` replays `dev` onto
  `origin/main` in a throw-away worktree and runs the theme checks there.
  Run the dry run first, `--apply` only when asked. It never pushes. Expected
  conflict hotspots are listed under "Upstream touch points" in the theme
  README.

## Keep upstream merges clean

Pick the first option that works, in this order:

1. **A new file in a fork layer** (`src/i18n/`, `src/theme/`,
   `src/config/runtime/`, `scripts/`, `docker/`, `deploy/`).
2. **Theme CSS** in `src/theme/`, scoped to
   `:root.theme-antd:not(.dark)`, keyed on one component's class names with an
   `@depends` annotation, within the specificity policy the theme README
   sets. `npm run theme:check-selectors` fails when upstream renames the class.
3. **A component replacement** through an exact `paths` alias in
   `tsconfig.json`, with a `.contract.ts` and an `@replaces … sha256:` hash,
   the way `DataTablePagination` and `Table` are done. Outside the AntD light
   theme the wrapper must render upstream's component with the same props.
4. **An in-place edit of an upstream file**: the smallest possible diff, an
   `@theme` comment at the spot, and a line in `scripts/theme/touch-points.txt`
   so a sync that silently drops it fails. `t()` calls in upstream components
   are the accepted cost of the translations; don't reformat around them.

Whatever the option:

- The dark theme and `NEXT_PUBLIC_DEFAULT_THEME=light|dark` builds stay
  pixel-identical to upstream. The dark guard in CI fails on a single changed
  story; only an upstream sync may change dark, and only where upstream did.
- Do not reformat, reorder or "tidy" upstream code you don't need to touch.
- Below 1280px the responsive layer owns layout; above it desktop must not
  move. New UI has to work in AntD light, upstream light and dark, and on a
  phone (the mobile guard checks every page story at 375, 390 and 768px).
- Generated files are regenerated, never edited:
  `src/i18n/*.generated.*` by `npm run i18n:types`.

## Runtime config, not build-time config

- Everything that differs per deployment (IdP, API origin, feature flags,
  announcement) is read from `/runtime-config.json`. Call `loadConfig()` from
  `@utils/config` while rendering, in hooks, effects or handlers, **never at
  module top level**: it throws before `RuntimeConfigProvider` has loaded.
- `NEXT_PUBLIC_*` variables are build-time and the same for every deployment
  of a build; today only `NEXT_PUBLIC_DEFAULT_LANG` and
  `NEXT_PUBLIC_DEFAULT_THEME`. The postbuild `verify-immutable` check fails the
  build when a hashed asset contains a deployment placeholder.
- Adding a field touches, in this order: `src/config/runtime/schema.ts` (type
  and field list), `parse.ts` with its tests, `docker/gen_runtime_config.sh`
  with a fixture in `docker/tests/fixtures/`, `scripts/runtime-config/write-dev-config.mjs`,
  and `.storybook/mocks/config.ts` when stories need it. New fields are
  optional so older files stay valid; never a secret (the client secret is
  deliberately not part of the contract); `schemaVersion` changes only for a
  real incompatibility.
- Locally, `npm run dev` writes `public/runtime-config.json` from your
  `.local-config.json`; the e2e environment writes `.test-config.json`. All
  three are gitignored and stay that way.
- The built html directory is read-only in the container. Anything generated
  at start goes to `/run/netbird-dashboard`; a broken environment must fail
  the container, not serve a half-configured app.

## Translations (i18n)

All user-visible text goes through `t()` from `src/i18n/index.ts`, with `en`
and `zh-CN` kept in step. Read `src/i18n/I18N.md` before adding or changing
text. The three rules broken most often:

- add the key to `en` and `zh-CN` in the same change, never one language only;
- call `t()` only while rendering or in handlers, never in a module-level
  constant (the language is not known yet);
- never translate strings that are compared, sent to the API, used as ids or
  sent to analytics.

`npm run i18n:check` is part of the deploy workflow: a key missing in one
language fails the release.

## Reuse before you build

Every new component is one more place to update when the design or behaviour
changes, and one more place for the two copies to drift apart. Before writing
UI code:

1. **Search first.** Look in `src/components/` (shared building blocks),
   `src/components/ui/` (small composed pieces) and the `src/modules/` of
   pages that do something similar. Tables, filters, selectors, badges,
   modals and empty states all exist already.
2. **Copy the pattern, not the code.** If the peers page and the groups page
   both filter a table, a third table filters the same way, with the same
   components.
3. **Prefer, in this order:** use an existing component as it is; extend it
   with an optional prop or a `cva` variant; extract a shared component from
   the places that already repeat it; only then write a new one.
4. **Extend without breaking callers.** A new prop is optional and its default
   keeps today's behaviour and look, so every existing caller renders exactly
   as before. The visual regression check proves that.
5. **Don't restyle shared components at the call site.** Colour, border or
   background classes passed through `className` create a one-off the next
   design change misses. A different look is a variant; an AntD-only look is
   a rule in `src/theme/`.
6. **Keep logic out of components.** Data shaping, validation and permission
   rules go in plain functions or hooks next to the module, where unit tests
   can reach them.

## Keep the tests in step

A change is done when the tests describe the new behaviour, not when the old
ones still pass. Update the suites as part of the same change.

| Suite | Lives in | Covers | Run |
| --- | --- | --- | --- |
| Unit (Vitest) | `*.test.ts(x)` next to the code | Pure logic, hooks, small components, the runtime-config contract | `npm run test:unit` |
| Stories + visual regression | `*.stories.tsx` next to the component or page | How every component and page looks, including open menus and modals | `npm run test:visual` |
| Theme guards | `scripts/theme/` | Selectors and touch points still match upstream; dark unchanged; light changes reviewed; no phone overflow | `npm run theme:check-selectors`, `theme:visual-guard`, `theme:mobile-guard` |
| i18n checks | `scripts/i18n/` | Key parity, size caps, interpolation, untranslated values | `npm run i18n:check` |
| Container and release | `docker/tests/`, `deploy/server/test-deploy-script.sh` | Config generator, nginx header policy, image smoke test, release script against a fake docker | `bash docker/tests/gen_runtime_config.test.sh`, see `docker/README.md` |
| End-to-end (Playwright) | `e2e/tests/*.spec.ts` | User flows against a real backend | `npm run test`, see `e2e/CLAUDE.md` |

When you:

- **change logic** (helpers, hooks, validation, permission checks): add or
  update the unit tests next to it;
- **add a component, a variant or a prop**: add it to the component's stories
  (`src/components/Button.stories.tsx` is an example);
- **add a page, tab, modal or state**: add a page story next to the route's
  `page.tsx`, with a `play` function for anything that has to be opened;
- **call a new API endpoint**: add a fixture in `.storybook/mocks/fixtures/`,
  otherwise stories render it as empty;
- **change anything visible**: run `npm run test:visual` and follow
  `.storybook/visual-regression/CLAUDE.md`; every remaining difference must
  be intended;
- **touch the theme or anything under 1280px**: run the three theme guards;
  a light-theme change is reviewed from the screenshots, a dark change is a
  bug;
- **add or change text**: `npm run i18n:types` when keys changed, then
  `npm run i18n:check`;
- **change the config contract, the image or the release script**: run the
  shell tests in the table above, and `docker/tests/smoke.sh <image>` when a
  Docker daemon is available;
- **add or change a user flow** (create, edit, delete, navigation): add or
  update the e2e spec for that feature.

Add the story in the same PR as the component or page it covers. The check
builds every story against the baseline as well; a story that can't build
there (it imports something your branch adds) is listed under "New stories"
in the report, so reviewers see the new UI.

## Before you hand it over

Node 24 and `npm ci` first (older Node warns but runs). Then:

- Lint the changed files (`npx eslint src/modules/peers`). The full
  `npm run lint` reports errors inherited from upstream; the bar is no new
  ones in the files you touched.
- Type check: `npx tsc --noEmit` (or `npm run build`, which also runs the
  precompress and immutability guards).
- Unit tests for the folders you touched (`npx vitest run src/modules/peers`),
  the full `npm run test:unit` before a PR.
- `npm run i18n:check` whenever text changed; `npm run i18n:types` first if
  keys were added or removed.
- `npm run theme:check-selectors` whenever styles, `tsconfig.json` paths or a
  file with an `@theme` marker changed; the visual and mobile guards for
  anything under 1280px or in the theme.
- `npm run test:visual` for UI changes, with every difference intended.
- E2E specs for the flows you touched, or say plainly that you couldn't run
  them (they need the Docker environment from `npm run test:setup`).
- Folder guides (`CLAUDE.md`, `README.md`, `I18N.md`) updated when the
  architecture or rules they describe changed. Larger pieces of work keep
  their plan and evidence under `docs/plans/`.

## Safety

- A push to `dev` is a production release. Branch, PR, CI, merge.
- Do not run destructive commands (`git push --force`, `git reset --hard`,
  `rm -rf` outside build output) unless asked. `sync-upstream.sh --apply`
  rewrites `dev`; run it only when asked, after a clean dry run.
- Never commit secrets, tokens, `.env` files, `.local-config.json`,
  `.test-config.json` or `public/runtime-config.json`, and never print
  credentials. Nothing secret ever enters the runtime config contract.
- `npm run test:setup` starts Docker containers; run it only when you need
  e2e. The deployed-dashboard e2e mode resets the account it logs into: only
  point it at a disposable instance.
- Do not edit stories, fixtures, mocks, thresholds or allowlists
  (`scripts/theme/mobile-allow.json`) to make a check pass; fix the source.

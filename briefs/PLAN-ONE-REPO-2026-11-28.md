# Plan · Johansson World in one repository · 28 November 2026

The owner: "Can you make a plan to consolidate all these locations? I want them to live in one repo, not on my website; the
link could be on the website."

This is a plan, not yet started. Section 1 lists the decisions the owner makes first. Whoever carries it out (Codex, Gemini or
Claude) needs access to the private repositories; this cloud session could read only `johansson-town` and the Office site.

## Where the World lives today

| Where | What | Size | Visibility |
|---|---|---|---|
| `nj22az/johansson-town` | the three.js web game, its tests, tools, Blender scripts, handovers; live at nj22az.github.io/johansson-town/ | ~141 MB served (runtime 10 MB, assets 131 MB) | public |
| `nj22az/johansson-world` | the World's site: the World page, credits, Sakura's pages, Sakura's browser demo (a GitHub Release) | small | public |
| `nj22az/jojo` (branch `pixar`) | the Blender Pixar-standard models ("Claude takes them to Pixar standard in Blender") | not read | private |
| `nj22az/Animation`, `nj22az/Konbini`, `nj22az/johansson-studio` | earlier animation work, the konbini, the studio | not read | private, private, public |
| the Sakura Godot project | location unknown: find `project.godot` in the repositories above | ? | ? |
| Office site `nj22az.github.io`, World folders | `avatar-creator/` (Studio, 9.9 MB), `camera/` (Pocket Camera, 75 MB), `ferry/` (the Chisum, 43 MB), `maintenance-demo/` (2.6 MB), `the-front-row-seat/` (43 MB), `form-3d-studio/`, `animation-studio/`, `linux-port/`, `steam-deck/` (the offline Linux edition), `ferry-deck-fighters/`, `sakura/`, `world/` (redirects), `mizuhama-1988/`, `thuans-storage/`, `temp/workshop/` (Tetsuo's workshop) | ~180 MB | public |

**How they are tied together today** (each tie must be cut or kept, phase 4):
- The game's runtime build follows into the site's `avatar-creator/`.
- The avatar creator imports the town through `../johansson-town/src/...`: at least 15 files.
- Studio, the Camera and the local audit tools serve the Office site's root and expect the town at `/johansson-town/`.
- That is why the town must be cloned inside a checkout of the site, as `johansson-town/`.

## 1. The owner decides first

1. **Which repository is the home.** Recommended: `nj22az/johansson-town`. It is the most active, its history and tests are
   there, and its Pages address is the live game. Renaming it to `johansson-world` would change the game's address, and
   that name is taken by the World's site repository. A rename can come later, once the old site repository is archived.
2. **Public or private.** Today the home is public, and jojo, Animation and Konbini are private. One repository is one or
   the other:
   - **Public:** every file and every commit in its history is open. Bring in only what is scanned clean: the owner's and
     family's photographs, secrets, and licensed assets that may not be redistributed. Keep the rest private elsewhere.
   - **Private:** the game can still be published with GitHub Pages from a private repository on a paid plan (GitHub Pro).
     Nothing private is exposed.
3. **What counts as the World.** Proposed to move: every folder in the table above. Proposed to stay on the Office site: the
   blog, hotels, Sjöskolan, the electrical-engineering pages, CAD, the motor and the other non-World projects.

   Confirm each of these, which may not be World work: `the-front-row-seat/`, `mizuhama-1988/`, `polivoks/`, `sc-90/`,
   `motor-90l/`, `ellab/`, `shop/`.
4. **The Godot Sakura project:** archived inside the home as read-only history (recommended), or left where it is and
   archived there. Either way it is superseded by the Swift remaster, never deleted.

## 2. Layout of the home

```
johansson-town/                  (repository root)
  index.html, src/, runtime/,    the web game, where it is now: nothing moves, so no path, test or address breaks
  assets/, tests/, tools/ …
  apps/studio/                   from the site's avatar-creator/ (and form-3d-studio/, animation-studio/ if confirmed)
  apps/camera/                   from the site's camera/ (Pocket Camera)
  apps/chisum/                   from the site's ferry/ and maintenance-demo/ (the ship and her maintenance program)
  apps/linux/                    from the site's linux-port/ and steam-deck/ (the offline Linux edition)
  apps/swift/                    the native Swift remaster (the Gemini plan: one repository, not many)
  site/                          from johansson-world: the World page, credits, Sakura's pages
  art/blender/                   from jojo (pixar), Animation; .blend files in Git LFS
  archive/godot-sakura/          the Godot project, read-only, with a README saying it is superseded and by what
  archive/konbini/, …            other earlier work kept for its history
  briefs/, docs/                 the handovers and the standards, as now
```

The web game stays at the root. Moving it under `apps/web/` would touch every tool, test and address for no gain to the
player.

## 3. How to bring each one in, keeping its history

- **A whole repository** (johansson-world, jojo, Animation, Konbini, johansson-studio, the Godot project):
  `git subtree add --prefix=<folder> <repo-url> <branch>`, or `git filter-repo --to-subdirectory-filter <folder>` and then a
  merge with `--allow-unrelated-histories`. Every commit stays readable under its new folder.
- **A folder of the Office site:** `git filter-repo --path <folder>/ --path-rename <folder>/:apps/<name>/` on a scratch clone
  of the site, then merge that into the home. Only that folder's own history comes across.
- **Before each import:**
  - scan it for secrets (`gitleaks detect`);
  - check for the owner's and family's photographs (a list of every image, looked at by a person, not guessed);
  - check for files over 100 MB, and for licences.
- **One import per branch, with the guard run after each:** `node tools/ci-guard.mjs --test-concurrency=2`, plus each app's own
  checks (the Chisum has `ferry/checks/*.cjs`; the Camera and Studio have theirs).
- **Large binaries** (Blender files, renders): Git LFS, or Releases for the largest. Mind LFS storage and bandwidth quotas.

## 4. Cut the ties to the Office site

1. Point the avatar creator's imports at the town inside the same repository. Make the game's runtime build read Studio
   from `apps/studio/`, not from `../avatar-creator`.
2. Make every tool that "serves the Office site's root" serve the home's root instead. Today the town sits at
   `/johansson-town/` under that root.
3. Delete the "clone the town inside the site" instruction, and the `/johansson-town` line in the site's `.gitignore`, only
   when nothing needs them any more.
4. Run the full guard and every app's checks green before anything is published.

## 5. Publish from the home

- Build the Pages site with a workflow, from a build artifact, so the repository can hold more than Pages publishes (the
  limit is 1 GB per published site). The artifact holds:
  - `/` (the game, as now)
  - `/world/` (the site)
  - `/studio/`, `/camera/`, `/chisum/`
  - the Sakura demo
  - the Swift remaster's page once it exists
- Keep every old address working:
  - **The Office site:** each moved folder becomes a small redirect page (as `world/` already is). The homepage and blog
    cards link to the new addresses.
  - **johansson-world's Pages:** redirect pages to the new addresses, then archive that repository.
- Check every link after publishing with a link checker; the live game, Studio, the Camera and the Chisum each open and
  pass their own checks.

## 6. Archive, never delete

johansson-world, jojo, Animation, Konbini, johansson-studio and the Godot project each get GitHub's "Archive" (read-only). Each
README says where the work lives now. Nothing is deleted.

## 7. Update the instructions

- The home's `AGENTS.md`, `CLAUDE.md` and handover say where everything is.
- The Office site's `CLAUDE.md` keeps one line: "Johansson World lives in nj22az/johansson-town."
- The Gemini prompt for the Swift remaster becomes: clone one repository, work in `apps/swift/`.

## 8. Order and size of the work

1. The owner's decisions (section 1).
2. The inventory with scans, written into this file.
3. johansson-world's site, then the Office site's folders (Studio and the runtime build tie first), then the private
   repositories, then the Godot project into the archive.
4. Publishing and redirects.
5. Archiving the old repositories.

About one to three working days for an agent with access to everything, most of it in the scans and in cutting the
Studio tie. Each step is a branch the owner approves before it reaches `main`.

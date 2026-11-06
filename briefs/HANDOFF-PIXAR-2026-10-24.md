# Handover: the Pixar world, from 24 October 2026 (for any coding agent)

> **26 October 2026:** Pixar Thuận is in World and on the live site, replacing the cartoon Thuan (the owner's word):
> [HANDOFF-PIXAR-THUAN-2026-10-26.md](HANDOFF-PIXAR-THUAN-2026-10-26.md). How to bring Pixar Johansson: jojo `3d/cast/GAME.md`.

> **Branches, 24 October evening (the owner's choice: "main , and the Pixar branch , and a development branch").**
> Done in both repos: `main`, `development`, `pixar`, and `archive-2026-10-24`, whose single commit has every older
> branch's last commit as a parent (each name and commit listed in its message: `git checkout -b <name> <commit>`
> restores one). Site: `development` starts as Codex's single-storey Sakura prototype; `pixar` is `main` with these notes.
> Studio: all three equal `main`, which now holds the cast, the poster and the konbini plan.
> **Not done:** deleting the old branches. The cloud session's git proxy refuses deletions and tags. On the owner's Mac, in
> each repo: `git fetch origin --prune && git for-each-ref --format='%(refname:lstrip=3)' refs/remotes/origin | grep -v -E
> '^(HEAD|main|development|pixar|archive-2026-10-24)$' | xargs -n 50 git push origin --delete`. Their open pull requests
> close; the work stays in the archive. Unmerged work to review in the studio's archive: `claude/catalogue-roles`,
> `claude/mario-artist-study`, `codex/finish-haunted-vending-machine`.

## In one minute

- **Next week's priority** (the owner, 24 October 2026): "the Pixar style Konbini with Thuan and Johansson and Fujita
  interactions". That means Sakura Shōten built in Blender at film quality, with the three of them acting in it.
- **The workflow** (the owner, 24 October 2026, recorded in `AGENTS.md`):
  - **Codex** prototypes detailed three.js rooms and characters, on `prototype/` branches.
  - **Claude** takes a prototype to Pixar standard in Blender, in the studio repo, on `pixar/` branches.
  - **`main`** keeps the simplified, cute and relatable cartoon World until the Pixar world is complete.
- **The CAD rule** (the owner, 23 October 2026, `AGENTS.md`): "for any remodel draw a cad first and audit yourself and
  fix what needs fixing before implement construction".
- **The owner's computer** is a Mac with an M1 Pro. Finals render there on its GPU through Metal. Cloud sessions have
  no GPU.

## Two repositories

| Repository | What it holds | Pixar work in it |
|---|---|---|
| `nj22az/nj22az.github.io` | World (`johansson-town/`) and the website | Codex's prototypes (`codex/sakura-*` branches, section "Branches") |
| `nj22az/jojo` | Studio: comics, films, Blender | `3d/cast/` (the rigged cast, the poster), `3d/sakura/` (the konbini) |

Both repos have this week's work on branch `claude/lucid-sagan-ztc2th`. Its proposed name is
`pixar/cast-and-sakura-konbini`.

## Read in this order

1. This note, then `AGENTS.md` (the workflow, the CAD rule, the handover rules).
2. `jojo/3d/sakura/PLAN.md`: the konbini design (Codex's single-storey Sakura), the method, zones A to H, the checks,
   the owner's open decisions, and the cast in the shop (section 9).
3. `jojo/3d/sakura/progress.md`: state, lessons, Monday's first steps.
4. `jojo/3d/cast/README.md`, `progress.md`, `checks.md`: how Thuan, Johansson and Fujita are built and rigged, and
   what failed before.
5. `jojo/3d/cast/PLAN-PIXAR.md`: what keeps the characters short of Pixar (eyes, hair, clothes, grip), and how the
   poster reaches the game (Sakura's `tea` wall spot).
6. `jojo/3d/cast/RENDER-ON-PC.md`: rendering on the owner's Mac.
7. `docs/BRANCHES-2026-10-24.md`: every branch, tested against `main`.

## Where it stands

**Done** (pushed, not merged):
- The rigged cast in Blender. All three have five-digit hands and rolling feet.
  - Thuan is a generated body.
  - Johansson is a free CPU sculpt painted in Blender.
  - Fujita is a re-dyed heavy model.
- Clothes as fitted layers (`wardrobe.py`).
- The NAGI poster (`jojo/3d/cast/renders/poster-sakura-tea.jpg`), shot in World's *current* Sakura
  (`set_sakura.py`). Its stock carries World's labels and flavours.
- Skin that scatters light, and specks painted out of the texture (`airig.skin_light`, `airig.clean_specks`).
- A GPU switch (`CAST_DEVICE=GPU`) and 2× supersampling (`--scale 2`).
- The konbini plan.

**Not started:**
- The konbini itself (zones A to H in `PLAN.md`).
- The characters' eyes, groomed hair and cloth.
- The interactions.

**Waiting on the owner:**
- Their Mac render of the poster (24 October), and whether `RENDER-ON-PC.md` worked as written.
- `PLAN.md` section 7: reshoot the poster in the new cold room (recommended); what the freezer holds; payphone or
  rain-frog at the frontage; follow Codex's later revisions (recommended).
- `PLAN-PIXAR.md`, the easiest choices, proposed but not confirmed: keep World's labels; replace Golden Milk Tea on the
  `tea` wall spot; keep the tube light.
- The branch recommendation below.

## The first week, step by step

1. **Set up.** Clone both repos and check out the branch. For Blender you need Python 3.11, then
   `pip install bpy==5.0.1 scipy scikit-image pillow`. Run scripts with `python -u`, so their output is not buffered.
2. **Pin the prototype.** Fetch `codex/sakura-counter-operations` (or `prototype/sakura-single-storey` if it has been
   renamed). Note its commit; this week's plan pinned `719f1435`. If the PR stack (#378, #384, #385) has merged, read
   from `main` instead.
3. **Zones A and B** (`PLAN.md`):
   - Write `cad.py`, which reads Codex's JSON into one frame: x = X/1000 − 6.95, y = depth/1000 − 3.91, in metres.
   - Write `audit.py`: the plan drawing and its checks.
   - Build the shell and light, and the walk-in cold room with its eight hinged doors.
   - Render it in clay (plain grey), compared with the game from Codex's review cameras
     (`tools/sakura-rebuild-review.mjs`), and show the owner.
4. **Storyboard the interactions with the owner** before staging anything (the studio's quality gate). Take the scenes
   from World's own stories, lines and roles (`johansson-town/src/feed/`, `src/dialogue/`); never invent them.
5. **Bring Johansson and Fujita up to Thuan:** `skin_light`, `clean_specks`, then poses in the shop's real spaces.
   Contacts must be exact: hands on the counter, a bottle, a door; nobody through a fixture.
6. **The poster** is reshot at the new cold room, then laid out at 2:3 for the `tea` wall spot (`PLAN-PIXAR.md`
   stage 4).

## Commands (from `jojo/3d/cast`)

```bash
python -u shots_poster.py models/thuan-tripo.glb shoptest     # quick look, 600 x 660
python -u shots_poster.py models/thuan-tripo.glb shopproof    # proof, 800 x 880 (about 12 minutes on the cloud CPU)
CAST_DEVICE=GPU python -u shots_poster.py models/thuan-tripo.glb shop --samples 256 --scale 2   # final, on the Mac
python3 ../../art/poster/sakura_tea.py renders/poster-shop.png renders/poster-sakura-tea.png    # the poster layout
python -u shots_pair.py models/thuan-tripo.glb <johansson.glb> trio --fujita models/fujita-tripo.glb   # the three together
```

`CAST_OUT` sets where renders go, and `CAST_CACHE` holds the rigs' cached weights. Renders for review go in the
scratchpad; only finished images are committed, as JPEG.

## Branches: the recommendation

The survey (`docs/BRANCHES-2026-10-24.md`) found that `main` restarted on 22 October with a fresh history. Of 411
branches:
- 204 are already in `main`;
- 33 merge cleanly, or with only the handover table or a rebuild to resolve;
- 173 conflict in source.

1. **Merge into `main` now: documentation only, no change to the game.**
   - `claude/lucid-sagan-ztc2th` (here: the workflow, this handover, the survey);
   - `claude/quirky-dirac-79zhne`;
   - `claude/colorfigures-skill`;
   - the five Codex planning branches (suite materials, hand redesign, quality handover, character identity audit,
     third-island plan).

   Resolve `HANDOVER.md` by keeping both rows.
2. **Keep the Sakura prototype as one branch.** Rename `codex/sakura-counter-operations` to
   `prototype/sakura-single-storey`; it contains `sakura-atmosphere-pass` and `sakura-retain-detail`. Rename
   `codex/sakura-exterior-led-cad` to `prototype/sakura-cad-rev-e`. Neither merges into `main` (the workflow).
3. **Close as superseded** by the single-storey decision: `codex/sakura-audit-cad` (#366) and
   `codex/sakura-stair-entrance`.
4. **Delete the 204 branches already in `main`.** The list is in the survey.
5. **Leave the 173 conflicting branches** until one is needed; almost all predate the 22 October restart.
6. **In `jojo`:** once the owner has confirmed the Mac render, rename the session branch to
   `pixar/cast-and-sakura-konbini` and merge it into `jojo`'s `main`. Studio is not the game.

Rename on GitHub's Branches page with the pencil: it keeps open pull requests and redirects the old name. Pushing a
new name and deleting the old one closes a branch's pull request. From now on, name new branches `prototype/`,
`pixar/`, `fix/`, `docs/` or `release/` plus the topic, never a random session name.

## Rules that bit this week

- **Never overlap boxes.** With bounce light, faces shut inside an overlap render as black bands. Butt walls and
  fixtures against each other. Three cases on 24 October; World's own geometry overlaps too, so watch for it.
- **Keep lights clear of glass.** A light near glass shows through its reflection even when hidden from the camera.
  Keep lights out of the frame and out of the glass's view. Ceiling tubes are hidden from glossy rays.
- **Mask skin effects.** A generated model is one texture: skin, hair and clothes together. Effects meant for skin go
  through a skin mask.
- **Keep the speck cleaner strict.** A looser one also erases eye highlights.
- **Check every agent's report against the source.** One this week got a fixture's purpose wrong.
- **Ignore the start-up ImportError.** "numpy.core.multiarray failed to import" is harmless. Do not wait on a grep for
  "Error:".
- **The quality gate applies.** Nothing goes to the owner unchecked: every region at 1:1, a separate reviewer, and the
  owner's approval in their own words.

## World canon to respect

- **Thuan** (1.49 m) owns and runs Sakura.
- **Johansson** (1.80 m) is the ship's chief engineer, at home with Thuan on Kitano-jima.
- **Fujita** (1.60 m) is the ferry master, sober on watch; his shed and beer come after he signs off.
- **Sakura** is open 9:00 to 20:30, cash only, and shut on Saturdays. It sells all the alcohol since Higa Liquor
  closed.
- **Words:** everything shown or spoken is plain English; Japanese only on signs and labels.
- **Nothing random:** every prop has a purpose.
- **No glitches:** nothing that clips, floats or flickers.

## Slips found in World, left for the owner

- **Shelf notes vs shelf rule.** The cold-cabinet products' `purpose.placed` notes say coffee is "under the tea" and
  milk is at the "top of the last column". They contradict `shelf.levels`, which counts from the bottom.
  **Fixed 24 October** on the owner's go-ahead (branch `claude/peaceful-johnson-103tja`): the numbers were wrong, not the
  notes. Every cold-cabinet line's `shelf.levels` is mirrored (0↔4, 1↔3) in `data/studio/products.json`: tea, water and
  cola at eye level (2–4), coffee, orange and soda low (0–1), milk on top (3–4), beer low by the till (0–2). For the
  Blender set (`jojo`, `set_sakura.py` / `props.py`): re-take the cabinet from World, since NAGI tea now stands at eye level.
- **"Acer".** The Eisa poster's print reads "Acer" where it means Eisa (`sakura-dressing.js`, `eisaPoster`).
  **Fixed 24 October** (branch `claude/peaceful-johnson-103tja`): the poster prints "Eisa", its inspect title reads
  "Sakura · Eisa poster", and the cause, `"エイサー": "Acer"` in `docs/ENGLISH-LOCALISATION.json`, now reads "Eisa".
  Runtime rebuilt. For the Blender poster set, re-take the label from World if it copied "Acer".

# Sakura Konbini interest — backbar + RE-PS1 examine

**Status:** Design brief (approved direction). Branch/PR only — never merge without TownQC.
**Owner:** KonbiniLab · reports to Johansson Town
**Canon:** Thuan is the only lead clerk at Sakura. Yuri does not exist (NameClean).

## Purpose

Trade beat at Sakura: make the konbini feel worth lingering in.

Two focus areas:

1. **Behind Thuan at the till** — backbar / counter wall / shelves she stands in front of: composition, props, readability from the player’s approach.
2. **Pick up goods and rotate them** like Resident Evil on PS1: focused examine view, orbit the object, read a short flavour line, then buy or put back. Not a full RE inventory — konbini goods examine only.

## Survey (existing systems)

Measured against current `main` under `johansson-town/`.

| Area | Where | What it does today |
|------|--------|--------------------|
| Layout | `src/world/interiors/sakura-layout.js` | Measured interior; staff `[5.5, 0, .85]`, checkout `[3.9, 0, .85]`, register `[4.78, 1.1, .85]`; three `SHELF_ISLANDS`; `SAKURA_SHELVES` + cold cabinet + bun warmer; `SAKURA_DRESSING` (magazines, delivery shelf, curry end-cap). |
| Interior build | `src/world/interiors/sakura-interior.js` | Instanced shelf goods; Examine → `action('store-item', …)`; counter anchors: sales ledger, service bell, mail-order catalogue. Sparse behind Thuan. |
| Shop runtime | `src/people/sakura-shop.js`, `shop-retail.js` | Persistent shop; Thuan clerk loop; NPC browse → pickup → queue → pay; stock depletes / restocks after closing. |
| 3D inspect | `inspect-3d.js` | Field book / Form 3 printed-model orbit: drag rotate, IJKL, zoom, caption chrome. **Shelf goods never enter this path.** |
| Buy UX | `activities.js` (`store-item`) | Dialogue panel with “Into the basket · ¥…”, then till pay — text UI, not lift-and-orbit. |
| NameClean debt | `README.md`, `docs/WORKSHOP-PRINTING.md` | Still say Yuri sells Form 3 prints at Sakura; runtime already routes to Thuan. |

**Gap vs brief:** the shop is shoppable and Thuan works the till, but the counter wall does not invite a linger look, and Examine does not hand you the good.

## Backbar set dressing (v1 — props only)

Composition on the **register wall / shelf behind Thuan**, readable when the player approaches the till. Props stay behind her apron line so they never block her work yaw toward checkout. **Keep** the existing sales ledger and service bell.

### Props (7) and why

| # | Prop | Why |
|---|------|-----|
| 1 | Ferry punch / ticket cards | Harbour trade beat; clear silhouette at eye level on approach. |
| 2 | Phone cards | Late-Showa konbini impulse staple; colour strip on the wall. |
| 3 | Sakura postage stamps | Quiet town flavour; small, readable colour. |
| 4 | Chewing gum / cough drops | Cheap till-side impulse; fills empty wall without new SKUs. |
| 5 | Matches + disposable lighter | Classic counter clutter; reads as “lived-in till”. |
| 6 | Harbour postcard stand (face-out) | Ties to existing postcard stock; linger bait while waiting for Thuan. |
| 7 | Small radio + spare batteries face-out | Batteries already in `SHOP_STOCK`; radio is dressing only. |

### Layout bands

- **Eye level:** ferry cards, phone cards, stamps, gum/cough drops, matches/lighter.
- **Mid:** postcard stand + hand-lettered `本日のおすすめ` card (dressing).
- **Low / side:** batteries face-out; ledger + bell remain where they are.

**Constraint:** no new economy SKUs in the first implementation cut unless the item is already in `SHOP_STOCK`.

## RE-PS1 examine loop

### Flow

1. **Enter** — face shelf → Examine prompt → lift `shopProductTemplate` mesh into the existing inspect overlay (reuse `inspect-3d.js` / Field book path).
2. **During** — orbit the object; short flavour caption on lift.
3. **Exit** — Buy · Put back · Talk to Thuan (if in range).

### Controls (reuse learned Field book habits)

| Input | Action |
|-------|--------|
| Drag / touch drag | Orbit |
| I J K L | Orbit |
| E / Shift+Q | Zoom in / out |
| R | Reset pose |
| Q / Esc | Put back |

### Exit choices

- **Buy** — wire into the existing basket / pay path (`store-item` economy), not a parallel wallet.
- **Put back** — close inspect; return any provisional stock claim.
- **Talk to Thuan** — only if she is in range; opens resident talk; does **not** auto-buy.

### UI chrome (TownUI)

Caption: brand · JP name · ¥price.

Buttons: primary **Buy**, secondary **Put back**, tertiary **Talk to Thuan** when in range.

Match AsagaoUI / dual-controls / existing inspect caption — no new HUD language.

### Copy (TalkFun)

One short lift line per examined good in v1 (product- or Thuan-flavoured, not menu-speak). Defer rich multi-page examine text.

### What can be examined

**v1 (clear silhouettes):** steamed pork bun, canned coffee, plum rice ball, Ramune, makunouchi bento, harbour postcard, pocket notebook, radio batteries.

**Later:** full aisle, fridge open-then-lift, magazine rack as read-only linger (not buy).

## Ranked build order

1. **This PR — design doc only** — `docs/KONBINI-INTEREST.md`.
2. **First implementation PR (separate, later):**
   - Wire shelf Examine → existing `inspect-3d` orbit with **Buy · Put back · Talk to Thuan** if in range.
   - Thin impulse backbar behind Thuan (props list above).
   - No new SKUs; one lift caption string (TalkFun can polish later).
3. **Defer:** full endcap rebuild, magazine polish, deep TalkFun line set, new economy items.

## Coordination

| Specialist | Ask |
|------------|-----|
| TownUI | Caption chrome, button labels, focus order |
| TalkFun | One-liner on lift |
| ThuanLead | Till presence; backbar feels like hers |
| NameClean | Yuri leftovers in `README.md` + `WORKSHOP-PRINTING.md` |
| TownQC | Gates any merge to main |

## Success criteria

- [x] Design brief checked in under `johansson-town/docs/KONBINI-INTEREST.md`.
- [x] First implementation lands on its own branch/PR; TownQC before main.
- [x] Examine of a v1 good orbits in 3D, then Buy or Put back works against existing sakura stock.
- [x] Backbar reads from the till approach without blocking Thuan’s checkout work.

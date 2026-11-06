# Sakura diorama reference — first pass

18 October 2026. Applies the owner's supplied convenience-store diorama to the existing shop. The room, occupied offices, merchandise layout, product designs and stock/economy remain authoritative.

## Implemented

- Bilingual shelf cards describe staff picks, everyday goods, daily goods and pantry stock. They replace unsupported “NEW”, “Limited” and “¥10 off” claims. Existing flavour blocks and category bays remain intact.
- Generated aisle/corner signs, equipment labels, shelf cards and catalogue-backed price tags use the game's existing LINE Seed JP font stack. Prints appear immediately with system fallbacks and repaint their existing canvases once the required web-font glyphs load. Failed font loading does not block entry. Approved painted product packaging is retained.
- Three nested red baskets on a low return stand match the carried shopping basket's colours. Their measured footprint is in the same layout data as their collider, between existing entrance props and clear of the sliding doorway.
- The cash drawer opens briefly into the staff side after a committed sale, accompanied by a quiet two-note sound using the existing audio system and sound preference. Animation uses elapsed seconds. Saved sales and outside sales never replay; leaving closes the drawer before the window stand-in is captured. Tracking journal entries also works when the cumulative sales counter reaches its ceiling.

The additions cost two mesh draws: one merged basket stack and one moving drawer. No extra lights, shadow maps, renderer, audio context or animation loop.

## Verification

The focused Sakura/shop suite covers shelf support and clearance, full stock facings, customer paths and restocking, transactions/save recovery, draw/triangle budgets, the new fitting's collider, drawer bounds and frame-rate independence, duplicate receipt suppression, capped-till sales and late font refresh/disposal. The runtime is rebuilt and its package/source-hash checks are run before publishing.

Visual and physical-iPhone acceptance remain outstanding. This environment had no installed Chromium; the Playwright browser download failed with an invalid/truncated archive. No screenshot or real-device result is claimed.

## Deferred

No bargain bin, loose produce stand, roaming trolley, hanging yen cube or separate camera controls were added. These need a specific purpose and available floor space before they can justify additional fittings. The working basket state continues to control what the player actually carries; no decorative unpaid grocery basket is left at the checkout.

# Exploration UI and scenery audit — 2 October 2026

The requested quality bar is a clear, consistent console-game interface. This is an internal review, not Nintendo certification.

## Problems corrected

- Harbour warehouse: two competing fascia signs overlapped the shutter canopy. One sign now sits above it; the secondary sign is removed. Fishing floats have no billboard backing and hang clear of the fisheries plate.
- Japanese environmental typography had been replaced with long English words in vertical Japanese layouts. Physical kanban, posters, shaved-ice flags and catch flags now carry Japanese lettering; English subtitles provide clarification. Font size is measured against available panel width. Ramen plaques have Japanese vertical names, small English names and prices.
- Exit control competed with the location caption and navigation rail. It now appears only when standing near the active room's doorway, disappears during menus, inspection, seating and conversations, and uses the same icon family as the town book. Interior furniture and walls still collide normally.
- Resident profiles reused short card biographies. The visitor guide now provides searchable existing residents, current game wardrobe renders, three face angles, occupations and distinct fictional histories. Open profiles use the full row on desktop and stack on phones.
- Rainflower's placeholder building was solid. The open shop now has a clear central entrance, furniture collisions and an existing clerk, Mrs Kinjō. Shop hours govern purchasing.

## Verification

Collision navigation checks cover both shared kitchen entrances and every customer seat. The futon test uses the real resident walking service to visit the cupboard and fold bedding before breakfast. Ship schedules cover arrival, berth, departure and the next day's vessel. Headless browser checks exercise real room entry/exit, profile rendering, mobile brochure widths and menu controls; screenshots are inspected individually. JavaScript errors are collected during the checks.

Physical iPhone/iPad frame rate, touch feel and display brightness require device testing. The existing software-rendered CPU boot benchmark is excluded from this suite; it already times out on unchanged main. Five disabled gateball checks remain intentional skips. Performance budgets and the runtime source fingerprint are checked by the normal test suite.

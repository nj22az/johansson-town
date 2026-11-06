# Session purpose — Johansson Town v1

> **Superseded in part (October 2026).** The town is set in **1997**, not 1988, and the look, building kit and avatar rules are now set by `AMPLIFY-AUDIT.md`. Where this note disagrees, the audit wins.

Approved design lock for code bots. Branch/PR only — never push main.

## Why a visitor stays

First-person visitor on **14 September 1988** in a compact harbour shopping district. Fantasy: a working neighbourhood with a real day clock — shops open and close, harbour notices point you, **Thuan** at Sakura buys a finished Form 3 piece, and the quay stays reachable for an evening or harbour beat. One short session should feel complete without growing the map.

## Glossary

- **Thuan** — only lead and Form 3D / sell-finished-piece contact at Sakura (hard code: `canSellAtSakura` + `thuanAvailable`, workshop UI, tests). There is no separate Sakura shopkeeper character.
- **Yuri** — retired / legacy naming only. User canon: Yuri does not exist. **NameClean** owns scrubbing remaining Yuri strings in docs and code; purpose design does not treat Yuri as a live identity.

## Locked session spine

1. Arrive seated on the east-sidewalk cedar bench, facing Sakura.
2. Stand (`E` / touch ACTION).
3. Walk the shopping street past Sakura.
4. Harbour notice or paper → talk to Thuan at Sakura → print → sell one Form 3 finished piece (09:00–20:00 while she is available).
5. One evening or harbour beat (quay before evening press, or dusk / harbour errand).

**Phase D walkability (do not redesign away):** shrine → arcade → ramen → quay → outer pier must remain walkable.

## Session done

Bench → stand → one print→sell with Thuan → one notice/paper → one evening/harbour beat.

## Three concrete loops (inside the spine only)

1. **Orient** — bench → stand → first walk past Sakura.
2. **Trade** — notice → Thuan → Form 3 print / sell.
3. **Clock** — day minutes matter; evening/harbour beat before the press soft-closes the session feel.

**Soft-quest dayKey (TownAudit):** meta `YYYY-MM-DD` in Europe/Stockholm rolls soft nudges only (notice / Form 3 Thuan / quay-before-press); diegetic clock and 14 Sep 1988 fiction stay unchanged — no real-world dates in player-facing copy.

**TownWhy (PR #76 / 6046b7ad):** calendar dayKey for soft quests supersedes prior diegetic-as-primary for soft quests only; diegetic `floor(townMinutes/1440)` remains for talks_today, schedules, and sold_form_day silence.

## Out of scope for v1

- New districts
- Sentō / player room
- Shopify live orders
- Performance certification
- Blender body art (Shenmue pipeline)
- Redesigning the Phase D route
- New quest chains beyond the Thuan / notice hook
- Reviving Yuri as a character (NameClean scrub only)

## Hand-off notes

- **NpcPulse / ThuanLead / TalkFun:** Thuan present for Form 3 / sell; hours + notice hook only.
- **TownUI:** soft prompts for stand, Thuan, quay-before-press — no clutter.
- **WalkFix:** spine walkability only; no locomotion redesign in this brief.
- **NameClean:** scrub legacy Yuri naming; do not invent a second Sakura lead.
- **TownAudit:** soft quests from the three-loop pool only; calendar dayKey as above.

No further purpose revisions unless the director or user changes the spine.

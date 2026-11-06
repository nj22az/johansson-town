# Umi-no-yu doorway

The bathhouse model faces local +Z. Its front wall is at Z=4.2, with a door between X=-2.3 and X=-0.5. The previous solid footprint blocked the advertised player doorway at Z=4.5. Residents targeted the porch at Z=5.4 and the generic 0.85m arrival radius hid them before reaching the facade.

`onsen-layout.js` now separates the porch approach/exit at Z=5.4 from the shared player/resident threshold at Z=4.0. The bathhouse collider retains its outer footprint and solid room body, with only a shallow 1.8m entrance corridor. Outdoor movement and indoor borrowing share a 0.15m onsen arrival radius, requiring a resident to cross the facade before changing scenes. Other venues retain their existing arrival rules.

Schedules, invitation dates, save keys and record formats are unchanged. Named indoor saves resolve to the current threshold, including old saves recorded on the porch. The change adds two static collision rectangles and no geometry, draw calls, assets or per-frame path searches. Both current avatars and `?classic` use the same pathing.

Validation:

- The new `tests/onsen-pathing.test.mjs` failed before the fix: the advertised doorway was blocked and Thuan disappeared before crossing the facade.
- Four focused regressions pass: real town collision/navigation through the portal, Thuan's approach/entry/exit at 60 Hz and 30 Hz, and restoration/exit from an old indoor save. They exercise the actual schedule AI and indoor hand-off, with swept collision checks on each walking step.
- 22 onsen, doorway and commute checks pass; avatar, physical rendering and published runtime checks also pass.
- Production build passes. Full suite: 106 passing files and the same 21 failing files recorded before this change (105 passing files before the new regression file).
- Local headless WebGL checks cover desktop, phone viewport and `?classic`, including player entry/exit and the startup doorway diagnostic. These are compatibility smoke checks, not physical-device frame-rate measurements.

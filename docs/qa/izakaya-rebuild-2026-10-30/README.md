# Minato surface rebuild - 30 October 2026

- `geometry-before.json`: original source and original scanner (45 reported pairs; includes an angular-projection false alarm).
- `geometry.json`: rebuilt complete game room, strict 2 mm / 0.0005 m2 scan, cold-store door shut and open; zero conflicts, zero invalid transforms.
- `artlist-provenance.json`: original Sango Quay print, generation and texture hash.
- `browser-limits.json`: actual browser failures before gameplay. They do not reproduce the owner's crash.

The refreshed architectural images and CAD are in `art/izakaya/compact/`. The Blender frames are not game screenshots.

Reproduce the geometry check from `johansson-town`:

```sh
node --max-old-space-size=6144 tools/audit-izakaya-room.mjs docs/qa/izakaya-rebuild-2026-10-30/geometry.json
node --test tests/izakaya-backbar.test.mjs tests/shared-dining-entry.test.mjs tests/izakaya-devices.test.mjs
```

See the dated handover for checks, exact implementation and review state, and outstanding physical-device validation.

Final source/model commit: `5faffbe831a7224a154fb6b2241ed4b645268708`, [draft PR #410](https://github.com/nj22az/nj22az.github.io/pull/410). The geometry result counts 108,355 triangles, including instance repetitions. The focused repair checks pass 24/24, including food supported on the real topping-pan bottoms; package/language checks pass 5/5. The service/food/drink/layout selection passes 70/70, and the isolated town-wide surface suite passes 13/13. The combined local guard was interrupted by the memory limit, so it is not claimed as a successful invocation. The complete hosted guard passed on both the initial implementation and final model update; the dated handover links the CI runs.

No fresh browser walkthrough or physical-device pass is claimed. The owner's exact reported crash remains unreproduced, and the draft has not changed the live game.

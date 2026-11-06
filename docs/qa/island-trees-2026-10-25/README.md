# Island trees - CAD and source audit, Rev A

Owner request, 25 October 2026: audit and CAD the island trees; only the cherry looks reasonably good; seek the readable, rounded tree art direction of a proper Tomodachi Life game.

## Status

**Audit and original CAD design delivered. No live game source, mesh, material, planting, collision or runtime change.** This documentation commit is on `main`; it does not promote a prototype or alter the Pixar branch. The next implementation belongs on `development`, following the three-branch workflow.

Source audit: `f6ae9c119e5ce540537466ed1c91a8a24bad77cd`. Newer main `5a720c12f6b22dcb78372cdad761740ca7873968` changes the hotel section and shared theme files; the audited World tree source files are unchanged. Production was constructed in Node with the repository DOM fixture, full Kitano plants and hamlet, and an in-memory audit loader capturing calls to the existing broadleaf builder. This is source measurement, not a new live-browser or physical-device inspection.

Read alongside the older unresolved crown finding in `briefs/HANDOFF-2026-10-21.md` and the shared-tree history in `docs/AMPLIFY-AUDIT.md`. The old archived screenshots are not presented as proof of today's rendering.

## Register and findings

- **265 specimens: 200 woody trees plus 65 tree-like plants.** Minato: 24 fukugi, three spreading / banyan trees and one cherry (28). Kitano: fourteen hamlet fukugi, one hamlet banyan, 75 palms, 82 rainforest trees, 31 pandanus and 34 bananas (237).
- Minato's shared broadleaf uses the same 611-triangle sample rescaled into column and spreading forms. The round template exists but was not deployed in the audited production town. Keep the species distinct instead of stretching one mass into every identity.
- The near coconut sample is **7.304 m wide / 10.136 m tall**; its distant substitute is **3.743 m wide / 8.999 m tall** and loses the bowed trunk and frond silhouette. The existing near/far boundary is 240/260 m. Future replacements must match the same tree's centre and envelope before testing that transition.
- The cherry's `scale=6.2` is not its height: its green crown measures **8.097 W x 6.884 H x 7.214 D m**. Retain its connected limbs and seasonal dresses. Compare the 0.48 x 0.48 m ground collider with the visible flare during the later in-game collision audit.
- The generic 226 `Island tree trunk` colliders include 222 tropical plants and four rocks, so that label is not an inventory count.
- Canopy and trunk structures need readable supporting branches, deliberate crown silhouettes, quiet surface detail and grounded roots. Preserve the original authored planting centres until a measured site fit justifies any move. No new pine placements or island expansion is authorised by this design package.

## Deliverables

- [13-sheet A3 CAD audit PDF](https://chatgpt.com/library?file_id=libfile_4a88bfd82e4481919914e18cb6da7bd6&account_id=personal)
- [Native CAD DXF](https://chatgpt.com/library?file_id=libfile_52e271ffadb48191b140bf7278bab4ed&account_id=personal)
- [Complete CAD package](https://chatgpt.com/library?file_id=libfile_8833bfdecd808191a2518bfba2c2e3d8&account_id=personal): PDF, DXF, seven-mesh GLB catalogue, 265-position CSV, design JSON, measured current source geometry, source scripts, previews, validation and hashes.

The seven original studies are round broadleaf, fukugi, gajumaru, optional Ryukyu pine, coconut palm, pandanus and banana. The existing cherry has its own retention / measurement sheet. Proposed rounded branches and foliage are Johansson geometry; no Nintendo mesh, texture or code was used. Official visual reference: Nintendo UK's Tomodachi Life: Living the Dream page and its IslandDesign2 screenshot.

DXF units are millimetres; GLB units are metres, with seven labelled models arranged 13 m apart. The GLB is an editable design catalogue, not an optimised runtime export. Material submeshes must be merged / instanced for the game. The source-based before/after images use CPU orthographic CAD shading, not the World Look pipeline; thumbnails are independently framed and dimensions govern scale.

## Checks performed

- All **seven target width / height / depth envelopes** match the generated meshes within 0.000001 m; finite positions.
- Closed, consistently oriented manifold components checked during mesh construction. The 94 GLB primitives have valid indices and unit, finite normals; seven labelled meshes.
- **21 native DXF dimension values** match the design register exactly. Reopened DXF audit: **zero errors / zero fixes**.
- **13 PDF pages**, rendered and inspected; no extracted text lies outside the page. The final palm requirement says distant crowns **must** retain the same bow and frond direction; it is a requirement, not a claim that a new far model has shipped.
- ZIP CRC verification and per-file SHA256 manifest passed. All three deliverables saved successfully.
- Python syntax check passed. The full game guard was not rerun for this document-only task; no game change was made. No new live-browser, iPhone/iPad, Steam Deck, World Look, LOD switching or frame-rate result is claimed.

## Next concrete action

Prototype TR-02 and TR-03 at existing Minato sites, plus TR-05 on Kitano, on `development`. Verify branch/foliage contact and under-canopy views, all existing Looks in day and dim conditions, collision and camera envelopes, near/mid/far silhouette agreement (a proposed 5% envelope tolerance), and the existing 60 fps desktop / 30 fps iPad budgets. Keep the accepted cherry and the existing island layout intact during that comparison. Do not merge replacement game art into main as part of this audit.

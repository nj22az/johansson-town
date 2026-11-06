# Sakura lucky cat display

`maneki-neko-display.glb` is a faithful 26,000-triangle static packing of `Maneki_neko_Colorful.glb`, used for Sakura's 0.23 m counter ornament. The original file remains unchanged. Every source triangle, UV corner, embedded paint image and PBR parameter is retained. A 1,500-triangle collapse and rebaked atlas were rejected after unlit comparisons showed fragmented paint. The accepted asset has no animation or skeleton and uses the normal town cel shading.

Reproduce with `node tools/optimize-owned-displays.mjs cat`. This preserves source geometry and compacts unused vertices; it does not simplify or rebake paint. `maneki-neko-display-provenance.json` records source/output/paint hashes and bounds. Fully loaded Sakura, including both faithful displays, measures 435,172 triangles under a 450,000 ceiling and retains its 813 draw-call cap. The original supplied asset's existing rights/provenance continue to apply; this derived display adds no licence claim.

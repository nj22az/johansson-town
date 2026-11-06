# IKEA furniture variants

LACK (30449908) and IVAR (70033766) models downloaded from IKEA's published 3D product metadata. Discovery follows https://github.com/apinanaivot/IKEA-3D-Model-Download-Button (observing the GLB used by the product viewer). Exact download URLs are retained in SOURCES.json.

Products: https://www.ikea.com/se/en/p/lack-side-table-white-30449908/ and https://www.ikea.com/se/en/p/ivar-cabinet-pine-70033766/ . Original model/design credits: IKEA / Inter IKEA Systems. The downloader repository does not grant a license to IKEA's models.

`town-*.glb` are Blender variants: removed photographic textures, warm matte colours, capped dense meshes, and standard GLB for the existing cel renderer. `tools/furniture/prepare-ikea.py` rebuilds them from the original downloads. Homes stream these small variants after entry; measured fallback furniture and collision stay in place during loading.

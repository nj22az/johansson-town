# Realistic Thuan figurine source

Preserved at the user’s explicit request. This is the supplied Meshy Thuan model, retained byte-for-byte with its embedded textures and provenance. It is reserved for a static figurine or display item; no NPC loader or avatar recipe imports it.

Every living resident, including Thuan, uses the avatar creator in `src/avatars/`. Do not restore Nao VRM, MakeHuman residents, Quaternius residents, or the former GLB cast. This asset is not represented as CC0; the original user/source rights remain applicable.

`thuan-display.glb` is the faithful static mesh used for the 0.85 m back-room display in Sakura. It bakes the original default neutral pose and retains every one of the 98,972 source triangles, each original UV corner, and both embedded images byte-for-byte. Unused skin, animation and tangent payload is removed, reducing the file from 10,059,548 to 5,171,572 bytes. The original physical material is retained because toon conversion washed out the photographed dress and face. A lossy 7,785-triangle candidate was rejected after identical-light unlit comparisons showed fractured UV paint. Rebuild with `node tools/optimize-owned-displays.mjs thuan`; `display-provenance.json` records source/output hashes and the method. The original `thuan-realistic.glb` remains untouched.

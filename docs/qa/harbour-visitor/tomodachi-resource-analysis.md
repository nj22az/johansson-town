# Tomodachi Collection resource study

The user-supplied English-patched NDS file was examined locally, using its actual
Nintendo DS file tables rather than searching an unrelated version online.

Verified observations:

- ROM header identifies `TOMODACHI`, game code `CCUJ`.
- The named filesystem contains 1,969 files.
- The ARM9 program begins at ROM offset `0x4000`, loads at `0x02000000`, and has
  entry address `0x02000800`. Its compressed 741,060 bytes decompress to 1,136,664.
- Ghidra 10.4, ARM little-endian v5t, analysed the decompressed ARM9 program and
  identified 3,575 functions. This is a heuristic analysis, not recovered source.
- The startup function at `0x02000bf0` references the resource archive path
  `Cmn/Nfl/NFL_Res_LZ.bin` through the literal pool at `0x020010d4`, then its internal
  `NFL:/NFL_Res.dat` member through the pool at `0x020010d8`. The returned member
  pointer is passed to the initializer at `0x02072a58`.
- `NFL_Res_LZ.bin` is LZ10-compressed. It decompresses to a 199,156-byte NARC
  archive containing one member, `NFL_Res.dat`. That member has an offset directory
  with 20 resource regions; the specific hair region has not been assigned a verified
  semantic label in this bounded study.
- `Scn/Scene/SceneMiiEdit2_LZ.bin` decompresses to a 346,876-byte NARC archive
  containing 47 files. It contains separate Hair, Eye, Eyebrow, Face, Mouth and Nose
  resources alongside palettes and layout data.
- Hair is represented in the creator UI by `Hair.NCGR` (tile pixels), `Hair.NCER`
  (216 sprite cells) and `Hair.NANR` (144 animation sequences, 216 frames), with a
  separate `Fw_parts.NCLR` palette. These counts are UI records, not verified counts
  of unique 3D hairstyles.

Practical conclusion
--------------------
The creator's hair-selection artwork is separate from the shared face-library
resource. Indexed parts and independently selected colour are a suitable pattern
for our own creator. Johansson World already stores hairstyle and colour in its
recipe; this change supplies a distinct authored hair mesh behind a selectable style
ID, rather than changing that recipe format or importing Nintendo's graphics.

This study extracted the creator scene's resources and examined the resource loader.
It did not recover a standalone runnable Mii creator, fully reverse-engineer all
hairstyle bit fields, or copy the face library into Johansson World. No extracted
Nintendo artwork or decompiled implementation is included in the game.

Reproduction
------------
The original Ghidra inspection scripts are in `tools/analysis/InspectFaceLibrary.java`
and `tools/analysis/DumpFaceResource.java`. Import the locally decompressed ARM9 as
raw binary with language `ARM:LE:32:v5t` and base address `0x02000000`, run normal
analysis, then run the scripts. They report archive-string references and inspect
the face-resource initializer. Extracted ROM data is required locally; it is not
bundled with these scripts.

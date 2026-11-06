# Resource sources

The authoritative ledger of shipped files is `assets/ATTRIBUTION.md`. All runtime paths stay inside the town directory.

The owner's [GameDev Free Resources catalogue](https://github.com/teamgravitydev/gamedev-free-resources) led to OpenGameArt's concrete, stone paving and bamboo surfaces. The owner's [OS3A Gallery](https://github.com/ToxSam/os3a-gallery), backed by the [Open Source 3D Assets index](https://github.com/ToxSam/open-source-3D-assets), led to Polygonal Mind's Banana Plant. The shipped files have exact creator/source links, CC0 licences and before/after hashes in `assets/materials/oga-manifest.json` and `assets/models/street/manifest.json`. These repositories are discovery catalogues; their application code is not imported into the game.

The active cast consists of 21 individually fitted MakeHuman CC0 residents and the owner's supplied Yuri. The town also uses local Three.js r170 (MIT), Poly Haven PBR maps and HDR lighting (CC0), the credited Don Carson vending machine (CC BY 3.0), an OSM extract/adapted road dataset (ODbL), the owner's supplied harbour shops and original project geometry/audio. Existing rights notices for each asset remain in the ledger.

The Look setting (`src/render/looks.js`) takes its set of looks from Super Mario Odyssey's Snapshot Mode as recreated by Daniel Ilett in [smo-shaders](https://github.com/daniel-ilett/smo-shaders) (MIT). The shaders are written new for three.js; no code or asset from that project is shipped.

`resource-catalog.js` retains the existing prop-source catalogue. Its approved/future entries are intake candidates, not a statement that a file is included. The retired procedural and VRoid character prototypes were removed in the 2026 cleanup; see docs/EXPANSION-NOTES.md for where to recover them. ambientCG and GSI imagery are not included.

Accept a new asset only with exact-file provenance and permission to redistribute. Keep required notices on screen and in the ledger. Preserve collision/interaction anchors when a visual model fails. Do not add remote asset URLs or franchise scans to the runtime.

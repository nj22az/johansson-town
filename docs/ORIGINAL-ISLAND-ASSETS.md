# Original island assets

The food PNGs in `assets/food` were generated specifically for Johansson Town with OpenAI image generation. They have transparent backgrounds and are original artwork, rather than downloaded Nintendo images. The design brief asked for appetising, softly rounded three-dimensional food cutouts: an ube/vanilla cone, island ramen, plum rice balls, vegetable curry and browned dumplings. The bag and prepared ramen/dumpling serving props share these assets; the other cutouts are available for matching menu items and shop displays.

The Sakura flyer is generated from the game's real catalogue and current prices by `scripts/build-sakura-flyer.mjs`; it is an original English design with a schematic local map and an original potato mascot. Players can read it on the harbour board, collect one free copy at the shop, reread it from the bag and follow its filed copy in the Community Hall archive.

Wardrobe sets and costumes are procedural, skinned 3D geometry in `src/avatars/build.js`, with original named selections in `src/avatars/outfits.js`. They retain each resident's face, proportions, hair and separately selected hat. The catalogue links supplied by the user are design references, not source assets.

App icons are generated from the original vector artwork in `assets/icons/town.svg`.

The Home Screen app checks for updates online. It caches visited content for connection interruptions and offers a save-and-reopen button when a new app version arrives. Progress stays in the app's browser storage; Safari and an installed Home Screen app may have separate saves. Unvisited content needs a connection. iOS installation is verified against Apple's Safari Add to Home Screen guidance; physical-device checks remain useful for performance and storage behavior.

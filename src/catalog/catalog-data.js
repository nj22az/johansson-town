// Generated from assets/catalog by tools/catalog/build-catalog.mjs: do not edit. Change the asset in Johansson Studio,
// publish it (python3 -m townstudio.assets publish <id> --site <this repo>), then run node tools/catalog/build-catalog.mjs.
const freeze=o=>{if(o&&typeof o==='object'){for(const v of Object.values(o))freeze(v);Object.freeze(o);}return o;};
/** Johansson World's asset catalogue, by id (src/catalog/catalog.js places them). */
export const CATALOG=freeze({
 "halloween-paper-bat": {
  "id": "halloween-paper-bat",
  "name": "Paper bat",
  "kind": "prop",
  "version": 1,
  "purpose": {
   "for": "The children on Sakura Street's Halloween walk and the shopkeepers who decorate for it",
   "why": "Sakura Shōten has supplied the town's decorations since Mrs Kinjō retired; black-card bats hung between the lanterns make the walk's string read as Halloween from down the street, lit or dark",
   "where": "Hung on cotton threads from the lantern string along Sakura Shōten's awning, between the paper pumpkin lanterns, from 24 to 31 October"
  },
  "size": [0.2382,0.0985,0.0306],
  "colours": {
   "card": "#24222a",
   "paper": "#f8f5ee"
  },
  "tags": ["Halloween","decoration","bat","black card","paper","lantern string","awning","Sakura Shōten","October","1997","children's walk"],
  "checked": "2026-11-02T21:54:52.817Z",
  "colliders": [
   {
    "name": "body",
    "x": 0,
    "z": 0.015,
    "w": 0.238,
    "d": 0.031,
    "yaw": 0,
    "minY": 0,
    "height": 0.098
   }
  ],
  "seats": [],
  "spots": [],
  "action": {
   "kind": "none",
   "label": ""
  },
  "anchors": {
   "hang": [0,0.068,0],
   "balance": [0,0.0455,0.0123],
   "eyes": [0,0.045,0.0013],
   "wing-tip-left": [0.1191,0.06,0.0297],
   "wing-tip-right": [-0.1191,0.06,0.0297]
  },
  "parts": [],
  "model": "halloween-paper-bat/model.glb",
  "modelSha": "5cf3cb65ff1f",
  "hero": "halloween-paper-bat/hero.png",
  "measured": {
   "size": [0.2382,0.0985,0.0306],
   "body": {
    "min": [-0.1191,0,0],
    "max": [0.1191,0.0985,0.0306]
   },
   "all": {
    "min": [-0.1191,0,0],
    "max": [0.1191,0.0985,0.0306]
   },
   "triangles": 752,
   "materials": 2,
   "meshes": 3
  },
  "budget": {
   "triangles": 1000,
   "materials": 2
  },
  "published": "2026-11-02"
 },
 "halloween-sweets": {
  "id": "halloween-sweets",
  "name": "Wrapped sweets",
  "kind": "prop",
  "version": 1,
  "purpose": {
   "for": "The children in costume on the Halloween walk",
   "why": "The walk is for collecting sweets; Sakura sells these twist-wrapped boiled sweets by the bag and heaps them out on the crates for the children to take",
   "where": "Heaped on the lid of the middle stack of drinks crates by Sakura's machine, between the two jack-o'-lantern pails, at a child's reach (58 cm), where the walk passes"
  },
  "size": [0.2501,0.057,0.2564],
  "colours": {
   "orange": "#f28a1e",
   "purple": "#8a55b8",
   "green": "#8fcf3a",
   "white": "#f4f1ea"
  },
  "tags": ["Halloween","sweets","boiled sweets","fruit sweets","wrapped","cellophane","drinks crates","Sakura Shōten","October","1997","children's walk"],
  "checked": "2026-11-02T22:16:26.369Z",
  "colliders": [
   {
    "name": "body",
    "x": 0,
    "z": 0,
    "w": 0.25,
    "d": 0.256,
    "yaw": 0,
    "minY": 0,
    "height": 0.057
   }
  ],
  "seats": [],
  "spots": [],
  "action": {
   "kind": "none",
   "label": ""
  },
  "anchors": {
   "top": [0,0.057,0],
   "rest": [0,0,0]
  },
  "parts": [],
  "model": "halloween-sweets/model.glb",
  "modelSha": "c3fed5830048",
  "hero": "halloween-sweets/hero.png",
  "measured": {
   "size": [0.2501,0.057,0.2564],
   "body": {
    "min": [-0.125,0,-0.1282],
    "max": [0.125,0.057,0.1282]
   },
   "all": {
    "min": [-0.125,0,-0.1282],
    "max": [0.125,0.057,0.1282]
   },
   "triangles": 2952,
   "materials": 1,
   "meshes": 1
  },
  "budget": {
   "triangles": 3000,
   "materials": 1
  },
  "published": "2026-11-02"
 },
 "johansson-trucker": {
  "id": "johansson-trucker",
  "name": "Johansson trucker cap",
  "kind": "prop",
  "version": 1,
  "purpose": {
   "for": "Islanders who work bare-headed under the Okinawan sun on the quay and the boats and want a good cap, not a giveaway: Kōji at the catch tables first, Riku on the cargo quay, Mr Fujita at the bow bollards.",
   "why": "A peak against the glare off the water, a mesh back that lets the sea wind through, a strap that fits anyone; made as well as an imported cap, by the town's own maker, with Johansson's J raised on the front.",
   "where": "On the cap tree at Sakura Shōten by the east window, beside the till and in the window, a stack on each cap form; and on the heads of whoever bought one (src/avatars/hat-assets.js fits it to any head)."
  },
  "size": [0.4811,0.3206,0.6652],
  "colours": {
   "front": "#27304d",
   "mesh": "#f4f1ea",
   "accent": "#f4f1ea",
   "sweatband": "#cfc8b8",
   "strap": "#1f1f22",
   "gold": "#c9a54a",
   "label": "#efe9d8",
   "label-ink": "#27304d"
  },
  "tags": ["cap","trucker cap","mesh cap","snapback","Johansson","J","premium","sun","quay","1990s","wearable","Sakura Shōten"],
  "checked": "2026-10-14T06:16:19.795Z",
  "colliders": [
   {
    "name": "body",
    "x": 0,
    "z": 0.075,
    "w": 0.481,
    "d": 0.665,
    "yaw": 0,
    "minY": 0,
    "height": 0.321
   }
  ],
  "seats": [],
  "spots": [],
  "action": {
   "kind": "buy",
   "label": "Buy a Johansson trucker cap (¥3,800)",
   "price": 3800
  },
  "anchors": {
   "head-centre": [0,-0.0088,0],
   "head-top": [0,0.251,0],
   "head-left": [0.2261,-0.0088,0],
   "head-front": [0,-0.0088,0.2357],
   "peg": [0,0.0613,-0.2465],
   "crown-top": [0,0.3159,0],
   "bill-tip": [0,0.076,0.4028],
   "band-front": [0,0.0951,0.239],
   "logo": [0,0.203,0.2235]
  },
  "parts": [],
  "model": "johansson-trucker/model.glb",
  "modelSha": "358bf73a1f56",
  "hero": "johansson-trucker/hero.png",
  "measured": {
   "size": [0.4811,0.3206,0.6652],
   "body": {
    "min": [-0.2406,0,-0.2571],
    "max": [0.2406,0.3206,0.4081]
   },
   "all": {
    "min": [-0.2406,0,-0.2571],
    "max": [0.2406,0.3206,0.4081]
   },
   "triangles": 2968,
   "materials": 4,
   "meshes": 7
  },
  "budget": {
   "triangles": 3000,
   "materials": 4
  },
  "published": "2026-10-14"
 },
 "johansson-trucker-display": {
  "id": "johansson-trucker-display",
  "name": "Johansson trucker cap (shop display)",
  "kind": "prop",
  "version": 1,
  "purpose": {
   "for": "Customers at Sakura Shōten looking at Johansson's trucker caps on the cap tree by the east window, before they ask Thuan for one: the boats' crews, the catch sorters and the cargo quay.",
   "why": "Six caps stand on the stand at once; at the worn cap's detail they took Sakura over its phone budget, so the stand shows the same cap built for being looked at from the shop floor, under half the triangles.",
   "where": "On the two cap forms of Sakura's cap tree (src/world/interiors/sakura-cap-stand.js), stacked three to a form; never on a head, where the worn cap (johansson-trucker) goes."
  },
  "size": [0.476,0.3182,0.663],
  "colours": {
   "front": "#27304d",
   "mesh": "#f4f1ea",
   "accent": "#f4f1ea",
   "sweatband": "#cfc8b8",
   "strap": "#1f1f22",
   "gold": "#c9a54a",
   "label": "#efe9d8",
   "label-ink": "#27304d"
  },
  "tags": ["cap","trucker cap","display","level of detail","Johansson","Sakura Shōten"],
  "checked": "2026-10-14T08:48:31.724Z",
  "colliders": [
   {
    "name": "body",
    "x": 0,
    "z": 0.077,
    "w": 0.476,
    "d": 0.663,
    "yaw": 0,
    "minY": 0,
    "height": 0.318
   }
  ],
  "seats": [],
  "spots": [],
  "action": {
   "kind": "look",
   "label": "Look at the Johansson caps"
  },
  "anchors": {
   "head-centre": [0,-0.0088,0],
   "head-top": [0,0.251,0],
   "head-left": [0.2261,-0.0088,0],
   "head-front": [0,-0.0088,0.2357],
   "peg": [0,0.0613,-0.2465],
   "crown-top": [0,0.3159,0],
   "bill-tip": [0,0.076,0.4028],
   "band-front": [0,0.0951,0.239],
   "logo": [0,0.203,0.2235]
  },
  "parts": [],
  "model": "johansson-trucker-display/model.glb",
  "modelSha": "f3ff0cfad64b",
  "hero": "johansson-trucker-display/hero.png",
  "measured": {
   "size": [0.476,0.3182,0.663],
   "body": {
    "min": [-0.238,0,-0.2549],
    "max": [0.238,0.3182,0.4081]
   },
   "all": {
    "min": [-0.238,0,-0.2549],
    "max": [0.238,0.3182,0.4081]
   },
   "triangles": 1298,
   "materials": 4,
   "meshes": 6
  },
  "budget": {
   "triangles": 1500,
   "materials": 4
  },
  "published": "2026-10-14"
 },
 "massage-chair": {
  "id": "massage-chair",
  "name": "Coin massage chair",
  "kind": "furniture",
  "version": 1,
  "purpose": {
   "for": "Bathers resting after the bath in Umi-no-yu's lobby: the regulars cooling down in their after-bath clothes, and Mr Fujita, whose back is always stiff from the boat.",
   "why": "Ten minutes of kneading for a ¥100 coin after a 42-degree soak; a sentō's lobby kept one so the regulars stayed for a coffee milk and the night game.",
   "where": "In the Umi-no-yu lobby by the milk cooler, its back to the east wall on the men's side, facing the room: where the onsen's chair stands now (onsen.js)."
  },
  "size": [0.9,1.14,0.73],
  "colours": {
   "upholstery": "#3fa0c8",
   "piping": "#2f5f9e",
   "shell": "#f4f1ea",
   "base": "#6d7478",
   "steel": "#6d7478",
   "plate": "#9aa3a8",
   "slot": "#2b2b2b",
   "start": "#2a8a5a",
   "stop": "#d8342c",
   "lamp": "#ff4a2a",
   "sticker": "#f4d23c",
   "screen": "#27304d",
   "cord": "#2b2b2b",
   "plug": "#f4f1ea"
  },
  "tags": ["onsen","lobby","1990s","coin-operated","seat","massage","Fujita's Back"],
  "checked": "2026-10-10T20:55:37.389Z",
  "colliders": [
   {
    "name": "body",
    "x": 0,
    "z": 0,
    "w": 0.9,
    "d": 0.61,
    "yaw": 0,
    "minY": 0,
    "height": 1.14
   },
   {
    "name": "leg rest",
    "x": 0,
    "z": 0.365,
    "w": 0.43,
    "d": 0.12,
    "yaw": 0,
    "minY": 0,
    "height": 0.33
   }
  ],
  "seats": [
   {
    "id": "seat",
    "label": "Sit in the massage chair (¥100)",
    "position": [0,0,0.255],
    "stand": [0,0,1.105],
    "yaw": 3.1416,
    "surfaceY": 0.5,
    "eyeY": 1.12,
    "front": 0.05
   }
  ],
  "spots": [
   {
    "id": "coin",
    "kind": "stand",
    "position": [-0.25,0,0.785],
    "yaw": 0.2908,
    "label": "Put a ¥100 coin in",
    "note": "Where Fujita stands bent double to feed the coin box (the film's panel 4b, room x 3.72, z 3.3)."
   }
  ],
  "action": {
   "kind": "seat",
   "label": "Sit in the massage chair (¥100)",
   "price": 100,
   "minutes": 10
  },
  "anchors": {
   "coin-slot": [-0.384,0.655,0.305],
   "timer-display": [-0.411,0.616,0.3005],
   "running-lamp": [-0.428,0.655,0.304],
   "cord": [-0.36,0.03,-0.288],
   "remote": [0.405,0.74,0.155],
   "right-arm-top": [-0.405,0.71,0.05],
   "roller-track": [0,0.76,-0.125]
  },
  "parts": [
   {
    "name": "Coin massage chair",
    "loose": false,
    "note": ""
   },
   {
    "name": "Massage chair seat",
    "loose": false,
    "note": ""
   },
   {
    "name": "Massage chair back",
    "loose": false,
    "note": ""
   },
   {
    "name": "Massage chair rollers",
    "loose": false,
    "note": ""
   },
   {
    "name": "Massage chair coin box",
    "loose": false,
    "note": ""
   },
   {
    "name": "Massage chair lamp",
    "loose": false,
    "note": ""
   },
   {
    "name": "Massage chair remote",
    "loose": false,
    "note": ""
   },
   {
    "name": "Massage chair cord",
    "loose": true,
    "note": "Lies on the floor beside the chair. A room that wires the chair itself (Umi-no-yu draws its own cord to the 1994 socket) hides this part and starts its cord at the cord anchor."
   }
  ],
  "model": "massage-chair/model.glb",
  "modelSha": "b998a9186734",
  "hero": "massage-chair/hero.png",
  "measured": {
   "size": [0.9,1.14,0.73],
   "body": {
    "min": [-0.45,0,-0.305],
    "max": [0.45,1.14,0.425]
   },
   "all": {
    "min": [-0.7307,-0.0004,-0.3706],
    "max": [0.45,1.14,0.425]
   },
   "triangles": 6574,
   "materials": 6,
   "meshes": 13
  },
  "budget": {
   "triangles": 7000,
   "materials": 6
  },
  "published": "2026-10-11"
 }
});

# Thuan's Konbini labels

Photorealistic 1986 house-brand packaging for Sakura Shōten.

Load in town with:

```js
import {assetURL} from '../../src/assets.js';
assetURL('graphics/konbini/thuan-labels/night-shift.webp')
```

`labels.json` maps each shot to an existing Sakura SKU (`coffee`, `soda`, `noodles`, …). `sku` is `null` where there is no matching item yet (Neon Ice).

These are catalog stills (3:4, cream seamless). They are not the 256×128 atlas tiles in `packaging-atlas.webp` / `packaging-groceries.webp` — crop before dropping them onto a shelf wrapper.

Suggested first uses:

| Wall poster / SKU | File |
| --- | --- |
| tea | `golden-tea.webp` |
| coffee | `night-shift.webp` |
| biscuit | `stick-bites.webp` |
| soda | `marble-pop.webp` |
| chips | `starlight-chips.webp` |
| noodles | `midnight-cup.webp` |
| rice | `umami-musubi.webp` |

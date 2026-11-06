# Sakura shop advertising

Original fictional advertisements inspired by late-Showa Japanese grocery print: cream stock, limited ink palettes, Japanese lettering and simple product illustrations. These are new designs, not historical reproductions.

Adobe Express initialisation returned HTTP 403, so the three poster illustrations were created with OpenAI image generation. Runtime copies are 512 × 768 WebP files in `assets/graphics/konbini/` (285,828 bytes combined). Product wrappers and price cards are drawn by `src/world/interiors/store-advertising.js` into one 1024 × 1024 canvas atlas and rendered in one combined mesh. Three cached poster materials add three draws and no lights. English wordmarks remain legible when a device lacks Japanese fonts; Japanese copy uses the device serif/sans-serif fonts.

## Prompt briefs

- NAGI: portrait Japanese green-tea advertisement, circa 1985; cream paper, forest-green print, tea bottle, cup and leaves; invented NAGI / なぎ branding, 緑茶 and お茶のひととき; flat finished artwork, no room mockup, no real company marks.
- PORT 88: portrait Japanese canned-coffee advertisement, circa 1988; cream, brown and orange palette, harbour sunrise and gull, illustrated coffee can; invented PORT 88 / ポート88 branding, 缶コーヒー and 港の朝に、一杯。; flat finished artwork, no real company marks.
- KOMOREBI: portrait Japanese butter-biscuit advertisement, circa 1985; warm cream and golden paper, red biscuit packet and biscuits, simple sun emblem; invented KOMOREBI / こもれび branding, バタービスケット and 午後のおともに。; flat finished artwork, no real company marks.

The brand definitions in `src/commerce/brands.js` also cover rice balls, soap, stationery, batteries, cola, water, beer, noodles, milk and stock cartons. The eight purchasable goods retain their existing IDs, prices and saved inventory names. Wall posters can be inspected; shelf prices are sourced from the same catalogue as purchases.

Validation: shop purchase and navigation tests, boot/room transition test, advertisement asset/UV/cache checks and production build. A local WebGL browser preview was blocked by the environment, so device-level visual and frame-rate verification remains outstanding.

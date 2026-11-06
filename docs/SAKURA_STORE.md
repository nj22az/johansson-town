# Sakura Shōten and Thuan

Thuan is an original adult Japanese clerk, age 26, 1.62 m tall. Her dusty-pink outfit, cream collar, glasses and ribboned hat take their art direction from the supplied references. Those photographs are not included in the repository, used as game textures, or represented as a scanned likeness.

The existing market doorway now leads to Sakura Shōten, open 09:00–20:00. Thuan has five bilingual dialogue topics. The dedicated clerk is instantiated once and reused across visits; the outside population remains unchanged. She becomes unavailable when the till closes.

Eight individually selectable goods support inspection and purchase with town yen: tea, coffee, rice balls, biscuits, soap, notebooks, postcards and batteries. Drinks can use the existing held-can flow. Shelf purchases update the existing saved inventory and wallet. The cooler door pivots in-world; the till, radio, service bell and mail-order book are also interactive. These are modular in-engine shop props; they are not claimed to be detailed Blender hero assets.

## Eventual Shopify connection

`src/commerce/shopify-config.js` is disabled by default. No Shopify request runs during game startup or normal town purchases. No real store content, pricing, inventory or order was changed during implementation.

To enable the connection after choosing products:

1. Set the verified `your-shop.myshopify.com` domain and a supported API version.
2. Supply only a **public Storefront access token** from the Headless channel if required. Never place Admin credentials or a private Storefront token in this public repository.
3. Map each approved shelf ID to its product handle and exact `gid://shopify/ProductVariant/...` ID under `products`.
4. Confirm those products are available to the Storefront sales channel. Switch `enabled` to `true` in a reviewed change.
5. Verify actual availability, currency and variant selection. Test the Shopify checkout destination and a cancelled checkout. This implementation accepts HTTPS checkout on the configured myshopify domain; a verified custom checkout domain needs an explicit allowlist change.

A mapped item first displays the current real-world product price. A separate action prepares a Shopify cart, followed by a link the player explicitly clicks to continue to Shopify checkout. Town yen never pays for a real order. Merely creating a cart does not grant an in-game item or mark an order paid. Fulfilment, payment confirmation and any future game rewards require a separate trusted server/webhook implementation.

The adapter handles unavailable variants, API errors, request timeouts and invalid checkout destinations. Closing a modal or changing topics prevents delayed responses from replacing the active conversation.

Official references used and schema validation:
- https://shopify.dev/docs/api/storefront/latest/queries/product
- https://shopify.dev/docs/api/storefront/latest/mutations/cartCreate
- https://shopify.dev/docs/storefronts/mobile/about-mobile-storefronts

The supplied Shopify Storefront validator accepted the combined product and cart operations. Validation evidence is in `shopify-storefront-validation.txt`. This validates GraphQL structure, not credentials or a live purchase.

## Remaining review

The Blender source, preview renders and reduced animated GLB are included. Native Blender renders and CPU geometry/animation/interaction checks are available; the environment's browser WebGL remains unavailable. Review in-game lighting, cloth movement, aisle navigation and touch interactions on a real device before merging. The clerk's motions remain a first scripted pass.

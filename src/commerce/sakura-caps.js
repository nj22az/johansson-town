/**
 * Johansson's trucker cap at Sakura Shōten: the shop's one line that is worn, not eaten, drunk or used up (the creator,
 * 2026-10-14: "you should be able to buy a nice hat in the Konbini and wear it"; and the same day: "I want the hat look
 * like a premium product, for now make it a trucker Cap with the J logo on it").
 *
 * It is not in Sakura's products file (data/studio/products.json): that file is the packed goods on the shelves, each
 * with a pack shape and a cell in the label atlas, and a cap is neither. Its record is here, in the same terms
 * (who buys it, why, where it stands and why there, the supplier), with what a garment has besides: its maker and model,
 * its colourways and the model in World's asset catalogue that is both the cap on the stand and the cap on a head.
 * Selling it at the till and wearing what you bought are open (briefs/NEXT.md): the till sells PRODUCTS only, and the
 * player's look is changed in Johansson Studio, not by a purchase.
 *
 *   hat       the recipe's `outfit.hat` (src/avatars/hat-assets.js ASSET_HATS)
 *   asset     World's asset catalogue id (assets/catalog/johansson-trucker); displayAsset, the stand's lighter copy
 *   price     yen, 1997, tax included (Sakura prices as a shop pricing tax-inclusive did: commerce/konbini.js)
 *   stock     the caps on the stand, by colourway: the front and bill (hatColour) and the mesh, rope and J (accent)
 *   purpose   who buys it (residents by name, guide/residents.json), why, and why it stands where it does
 *   stand     the free-standing cap tree on the floor (world/interiors/sakura-cap-stand.js)
 */
export const JOHANSSON_TRUCKER=Object.freeze({
 id:'johansson-trucker',hat:'trucker',asset:'johansson-trucker',
 // What stands on the stand: the same cap at the shop display's level of detail (build-johansson-trucker.py --display),
 // so six of them stay within Sakura's phone budget (tests/owned-display-lod.test.mjs); a head wears `asset`.
 displayAsset:'johansson-trucker-display',
 name:'Johansson trucker cap',
 // On the price card (Japanese on signs): the maker, the line, one size with the strap, the price with tax.
 jp:Object.freeze({brand:'ヨハンソン帽子',line:'メッシュキャップ',size:'フリーサイズ（アジャスター付）',price:'¥3,800',tax:'税込'}),
 price:3800,
 priceWhy:'In 1997 a promotional mesh cap was given away with a case of feed or fuel, a plain one was ¥980 at a supermarket, a professional team’s official cap ¥3,500 to ¥4,000, and an imported American trucker at a select shop in Naha ¥4,500 to ¥6,000. Johansson Headwear’s JH-712 is made as well as the imported ones (a foam front, raised embroidery, a woven label, piping, a rope), in Naha, without the import: ¥3,800 puts it with the official caps, a cap you buy once and keep, two days’ lunches for a catch sorter.',
 maker:Object.freeze({name:'Johansson Headwear',jp:'ヨハンソン帽子',works:'Naha',model:'JH-712',
  what:'A six-panel trucker: two foam front panels with Johansson’s J in raised embroidery, outlined in gold satin stitch, inside the seal’s rings; four polyester mesh panels with contrast piping on the front seams; a cloth button, a cotton sweatband, a pre-curved board bill with four rows of stitching and a contrast undervisor; a braided rope across the front; two plastic snap straps; a woven label over the back seam.'}),
 supplier:'sakura',
 supply:'Sakura Trading orders them from Johansson Headwear in Naha by the half dozen in each colourway; they come over on the Minato Maru in the depot’s Tuesday freight with the stationery and the batteries.',
 colourways:Object.freeze([
  Object.freeze({name:'Navy & white',hatColour:'#27304d',accent:'#f4f1ea'}),
  Object.freeze({name:'Charcoal & grey',hatColour:'#2b2b2b',accent:'#6d7478'}),
  Object.freeze({name:'White & navy',hatColour:'#f4f1ea',accent:'#27304d'}),
 ]),
 // On the stand, a stack on each cap form, the bottom one first: navy and white on top, the other two below.
 stock:Object.freeze([
  Object.freeze({form:'top',caps:Object.freeze(['Navy & white','Navy & white','Navy & white'])}),
  Object.freeze({form:'low',caps:Object.freeze(['Charcoal & grey','White & navy','White & navy'])}),
 ]),
 purpose:Object.freeze({
  zone:'stand',
  for:Object.freeze(['Kōji','Riku','Mr Fujita']),
  why:'The quay and the boats work bare-headed under the sun and the glare off the water from first light: a peak, a mesh that lets the sea wind through, a strap that fits anyone. It is the good cap: the one you buy with your first season’s money or for the ferry to Naha, not the one the feed merchant gives away, and Johansson’s J is the town’s own maker.',
  placed:'On its own stand by the east window, between the copy machine and the end of the counter: in the window, where the street sees it; beside the till, where a ¥3,800 thing is watched and a cap can be tried on in the window’s reflection; and out of the walk from the door to the till and of the queue along the counter.',
 }),
 // A cap tree, as a 1990s shop stood one: a chromed pole on a weighted base, two arms to the north (the shop side), each
 // ending in a cap form, a dome the size of a head, that a stack of caps sits on, crown up and bill out, as they are worn.
 // `forms` are the heights of the caps' lowest points; `reach` how far out the form's centre is from the pole; `nest`
 // how much higher and further forward each cap of a stack sits on the one under it: a trucker's foam front stands
 // upright, so a cap nested only higher would have the one inside it come through its front. The collider is the base and the caps, the box the walkers keep out of.
 stand:Object.freeze({x:3.28,z:3.62,yaw:Math.PI,forms:Object.freeze({top:1.5,low:.92}),reach:.3,nest:Object.freeze({up:.02,out:.018}),height:2.0,
  collider:Object.freeze({x:3.28,z:3.35,w:.52,d:1.0,height:2.25})}),
});
/** The lines Sakura stocks that are worn (one so far), by id. */
export const WORN_LINES=Object.freeze({[JOHANSSON_TRUCKER.id]:JOHANSSON_TRUCKER});

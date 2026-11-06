export const PRODUCT_QUERY=`query TownProduct($handle: String!) { product(handle: $handle) { title variants(first: 20) { nodes { id title availableForSale price { amount currencyCode } } pageInfo { hasNextPage endCursor } } } }`;
export const CART_MUTATION=`mutation TownCart($input: CartInput!) { cartCreate(input: $input) { cart { checkoutUrl } userErrors { field message } } }`;
export function createShopify(config,{fetchImpl=globalThis.fetch}={}){
 const validDomain=/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i;
 const enabled=config.enabled===true&&validDomain.test(config.domain)&&/^20\d\d-(01|04|07|10)$/.test(config.apiVersion);
 async function request(query,variables){
  if(!enabled)throw Error('The mail-order catalogue is not open yet.');
  if(/^(shpat_|shpca_|shpss_)/.test(config.publicToken||''))throw Error('Use a public Storefront token.');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
  try{const response=await fetchImpl(`https://${config.domain}/api/${config.apiVersion}/graphql.json`,{method:'POST',headers:{'Content-Type':'application/json',...(config.publicToken?{'X-Shopify-Storefront-Access-Token':config.publicToken}:{})},body:JSON.stringify({query,variables}),signal:controller.signal});
   if(!response.ok)throw Error('The shop cannot be reached. Please try later.');const result=await response.json();if(result.errors?.length)throw Error('The shop could not complete this request.');return result.data;
  }finally{clearTimeout(timer);}
 }
 return {enabled,async product(itemId){const mapping=config.products?.[itemId];if(!mapping?.handle||!mapping.variantId)return null;const data=await request(PRODUCT_QUERY,{handle:mapping.handle});const product=data?.product,variant=product?.variants.nodes.find(v=>v.id===mapping.variantId);if(!variant)return null;return {title:product.title,...variant};},async checkout(variantId){if(!/^gid:\/\/shopify\/ProductVariant\/\d+$/.test(variantId))throw Error('Invalid product selection.');const data=await request(CART_MUTATION,{input:{lines:[{merchandiseId:variantId,quantity:1}]}});if(data?.cartCreate?.userErrors?.length)throw Error(data.cartCreate.userErrors.map(e=>e.message).join(' '));const url=new URL(data?.cartCreate?.cart?.checkoutUrl);if(url.protocol!=='https:'||url.hostname!==config.domain)throw Error('Unexpected checkout destination.');return url.href;}};
}

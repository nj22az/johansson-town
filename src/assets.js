// Resolve against the page so raw GitHub Pages modules and Vite's bundled chunks
// use the same local asset tree. No runtime asset is requested from another site.
export const assetURL=path=>new URL('assets/'+path,document.baseURI||location.href).href;

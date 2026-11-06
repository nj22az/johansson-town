// Curated resource catalogue for Johansson Town.
// Discovery starts with Fasani/three-js-resources (MIT), but runtime dependencies
// are local-only. Every production asset must have an explicit licence and fallback.

export const RESOURCE_CATALOG=Object.freeze({
  catalogue:{
    name:'Fasani/three-js-resources',
    url:'https://github.com/Fasani/three-js-resources',
    licence:'MIT',
    role:'Discovery catalogue for models, textures, tooling and optimisation references.'
  },
  textures:{
    asphalt:{name:'Poly Haven asphalt_02',path:'./assets/asphalt.jpg',licence:'CC0 1.0',source:'https://polyhaven.com/a/asphalt_02'},
    timber:{name:'Poly Haven weathered_planks',path:'./assets/timber.jpg',licence:'CC0 1.0',source:'https://polyhaven.com/a/weathered_planks'},
    roof:{name:'Poly Haven roof_tiles_14',path:'./assets/roof.jpg',licence:'CC0 1.0',source:'https://polyhaven.com/a/roof_tiles_14'},
    plaster:{name:'Poly Haven plastered_stone_wall',path:'./assets/plaster.jpg',licence:'CC0 1.0',source:'https://polyhaven.com/a/plastered_stone_wall'}
  },
  approvedModelSources:{
    kenney:{
      name:'Kenney game assets',
      source:'https://kenney.nl/assets',
      licence:'CC0 1.0',
      status:'approved-for-curated-intake',
      use:'Street furniture, interior clutter and neutral environment props when period/style fit is good.'
    },
    sushiKit:{
      name:'Quaternius Sushi Restaurant Kit',
      source:'https://quaternius.com/packs/sushirestaurantkit.html',
      mirror:'https://github.com/agentkaerf/FreeModels/tree/main/Sushi%20Restaurant%20Kit%20-%20May%202023',
      licence:'CC0 1.0',
      status:'approved-for-curated-intake',
      use:'Period-compatible Japanese interior props after scale/style validation.'
    },
    universalCharacters:{
      name:'Quaternius Universal Base Characters',
      source:'https://quaternius.com/packs/universalbasecharacters.html',
      licence:'CC0 1.0',
      status:'reference-until-character-pipeline-ready',
      use:'Future bespoke residents only; never replace stable characters without validation.'
    },
    universalAnimations:{
      name:'Quaternius Universal Animation Library 2',
      source:'https://quaternius.com/packs/universalanimationlibrary2.html',
      licence:'CC0 1.0',
      status:'reference-until-retargeting-pipeline-ready',
      use:'Curated locomotion and contextual animation clips.'
    }
  },
  runtimePolicy:Object.freeze({
    localOnly:true,
    fallbackRequired:true,
    mobileTextureTarget:'1K',
    preferredModelFormat:'glTF/GLB',
    remoteHotlinking:false
  })
});

export function getTextureResource(name){return RESOURCE_CATALOG.textures[name]||null;}
export function resourceSummary(){
  return {
    catalogue:RESOURCE_CATALOG.catalogue.name,
    localTextures:Object.keys(RESOURCE_CATALOG.textures),
    approvedModelSources:Object.keys(RESOURCE_CATALOG.approvedModelSources),
    policy:RESOURCE_CATALOG.runtimePolicy
  };
}

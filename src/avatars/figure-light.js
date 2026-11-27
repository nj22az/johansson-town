/**
 * One light for the whole figure (the owner, 27 November 2026, on a screenshot at Kitano-jima airport at 19:00 in rain:
 * "Johansson's face and body needs to have same color").
 *
 * The face, its eyes, brows and mouth had a floor on their light, half their own colour, so a painted face stays readable
 * in a dim scene. The body had none, so wherever the light was low (after dark, in rain, indoors) the face stood paler and
 * lighter than the neck, the arms and the legs under the same light: at 19:00 in rain the cheek read #af8f7a and the
 * forearm #a17067, at 21:00 the cheek #705e63 and the forearm #2d2b3e. Now every material of the figure, the face's and
 * the body's, its clothes, its hair and what it wears, takes the same floor: skin is one colour from the crown to the toes
 * in every light, and the whole figure, not only its face, still reads at night. In daylight nothing changes: the lit
 * colour is above the floor.
 */
export const FIGURE_LIGHT_FLOOR=.5;
const LINE=`outgoingLight = max( outgoingLight, diffuseColor.rgb * ${FIGURE_LIGHT_FLOOR.toFixed(2)} );\n#include <opaque_fragment>`;

/** The floor in a fragment shader's source (for a material that writes its own onBeforeCompile). */
export function figureLightShader(fragmentShader){return fragmentShader.replace('#include <opaque_fragment>',LINE);}

/**
 * The floor on one material, once (a material shared between figures is patched once). It runs after whatever the
 * material already does to its shader. A material marked `userData.figureLight` already carries it in its own shader.
 */
export function figureLight(material){
 if(!material||material.userData.figureLight)return material;
 const compile=material.onBeforeCompile,key=material.customProgramCacheKey.bind(material);
 material.onBeforeCompile=(shader,renderer)=>{compile.call(material,shader,renderer);shader.fragmentShader=figureLightShader(shader.fragmentShader);};
 material.customProgramCacheKey=()=>key()+':figure-light-v1';
 material.userData.figureLight=true;
 return material;
}

/** Every material under a figure's root (its body, head, hair, clothes, and what it wears), except its ink. */
export function lightFigure(root){
 root.traverse(o=>{if(!o.isMesh||o.userData.outline)return;for(const m of Array.isArray(o.material)?o.material:[o.material])if(m&&!m.userData.outline)figureLight(m);});
 return root;
}

/**
 * A Pixar clone's face from the avatar creator (the owner, 28 October 2026: "Can you combine them with the old avatar
 * creator? To make the faces more interesting"). A clone (clone_recipe.py in the studio: the card says `face:'recipe'`)
 * wears its donor's face; the resident's own recipe (recipe.js: eyes, brows, mouth, each a style and its sliders) reshapes
 * it here: the eye's size, its lids and corners, the brows' arch, slope, thickness, length and hair, the mouth's width and
 * how it rests. The same recipe the creator edits, so a change there is a change to the Pixar face. The hand-made faces
 * (Johansson, Thuận, Thao, Tetsuo, Mr Fujita) carry no such card and keep their own. Pure, for tests.
 */

// Each of the creator's eyes (recipe.js PARTS.eyes) as a modelled eye: scales of its width (rx), height (ry) and iris,
// the upper lid's line (cut, of the eye's height), its slant (+ the outer corner down), the outer corner lifted (corner),
// the almond's points, and lashes. Kept inside the eye's disc (the studio's decal: 21 units below the middle, 24 above).
const EYES=Object.freeze({
 round:{ry:1.08,iris:1.02},dot:{rx:.84,ry:.84,iris:.86},almond:{shape:'almond',corner:1.5},sleepy:{cut:.34},
 lashes:{lashes:1,lash:4.2,flick:4.5},narrow:{ry:.74,cut:.12},sparkle:{iris:1.05},gentle:{ry:.94,cut:.1,slant:-.12},
 doe:{rx:1.04,ry:1.1,iris:1.08},cat:{shape:'almond',corner:3,flick:6},droopy:{cut:.21,slant:-.43},heavy:{cut:.41,lash:4},
 bright:{iris:1.04},tired:{cut:.28,slant:-.2},squint:{ry:.7,cut:.22},starry:{iris:1.06},inkoval:{rx:.9,ry:1.1},
});
// The creator's brows (PARTS.brows) as changes to the modelled brow: thick (its half-thickness), arch (units up in its
// middle), slope (+ the inner end up and the outer down, worried; - stern), flat (how much of its own curve it keeps),
// span (the share of its length kept, from the inner end), taper (its tail) and bushy (hair at its edge).
const BROWS=Object.freeze({
 straight:{flat:.35},arched:{arch:3.4},thick:{thick:1.45},thin:{thick:.62},worried:{slope:2.2,arch:.6},
 bushy:{thick:1.3,bushy:1},angled:{slope:-2,flat:.5},short:{span:.7},rounded:{arch:2.4,thick:1.12},tapered:{taper:.6},
 feathered:{thick:1.08,bushy:.5},maro:{span:.45,thick:1.55,arch:.4},
});
// The creator's mouths (PARTS.mouth) as how the modelled mouth rests, under every feeling (face-features.js featuresOf
// `base`): a quieter cut of the painter's mouth of the same name (face-features.js MOUTHS), never open past a sliver.
const MOUTHS=Object.freeze({
 smile:{smile:1.4},flat:{smile:-.7,thin:.3},grin:{smile:2.2,width:1.06},small:{smile:.2,width:.8},wide:{smile:.6,width:1.1},
 smirk:{smile:.4,asym:2.2},pout:{pout:.6,width:.9},cat:{smile:1.1,width:.9},teeth:{open:.8,upper:.5,teeth:.6},
 open:{open:1.2,upper:.4},lopsided:{asym:1.2},tongue:{smile:.8},buck:{open:.6,upper:.8,teeth:.8},soft:{smile:.8},
});

const num=(v,d=.5)=>Number.isFinite(+v)?+v:d;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));

/** The eye's `own` (pixar.js rigEyes) reshaped by the recipe's eyes: style, size, width and tilt. */
export function recipeEye(own,eyes={}){
 const st=EYES[eyes.style]||{},size=.88+.24*num(eyes.size),width=.94+.12*num(eyes.width);
 const out={...own,rx:own.rx*(st.rx||1)*size*width,ry:own.ry*(st.ry||1)*size,iris:own.iris*(st.iris||1)*size};
 // (the eye stays inside its decal's disc: never more than a tenth wider or taller than the donor's own)
 out.rx=clamp(out.rx,own.rx*.7,own.rx*1.1);out.ry=clamp(out.ry,own.ry*.66,own.ry*1.12);out.iris=Math.min(out.iris,out.rx*.78,out.ry*.95);
 for(const k of ['cut','slant','lash','flick','lashes','shape'])if(st[k]!==undefined)out[k]=st[k];
 // (tilt: the outer corner up above the middle of the slider, down below it)
 const corner=(st.corner||0)+(num(eyes.tilt)-.5)*4;
 if(Math.abs(corner)>.05)out.corner=corner;
 return out;
}

/** One side's brow ({x0, x1, line, half}: polynomials in x, the inner end x0) reshaped. */
function reshapeBrow(b,st,brows){
 const x0=b.x0,x1=b.x0+(b.x1-b.x0)*(st.span||1),h=(x1-x0)/2,xm=(x0+x1)/2;
 let [a2,a1,a0]=b.line;
 // (flat: its own curve eased toward the straight line through its ends)
 if(st.flat){const y0=a2*x0*x0+a1*x0+a0,y1=a2*x1*x1+a1*x1+a0,m=(y1-y0)/(x1-x0),k=st.flat;
  a2*=1-k;a1=a1*(1-k)+k*m;a0=a0*(1-k)+k*(y0-m*x0);}
 // arch: up in the middle by `arch`, its ends where they were; slope: the inner end up by `slope`, the outer down by it
 const arch=st.arch||0,slope=(st.slope||0)+(.5-num(brows.tilt))*3,lift=(num(brows.height)-.5)*5;
 a2-=arch/(h*h);a1+=2*arch*xm/(h*h);a0+=arch-arch*xm*xm/(h*h);
 a1-=slope/h;a0+=slope*xm/h+lift;
 const thick=(st.thick||1)*(.76+.48*num(brows.size));
 return {x0,x1,line:[a2,a1,a0],half:b.half.map(c=>c*thick)};
}

/**
 * A clone's face from its recipe: the eye's `own`, the brows' card (null: none), their taper and bushy hair, the mouth's
 * card and the mouth it rests in. `card` the Pixar card (its eyes, brows, mouth as the studio measured the donor's).
 */
export function recipeFace(card,recipe){
 const r=recipe||{},E=card.eyes;
 const own={rx:E.rx,ry:E.ry,iris:E.iris,lash:E.lash,flick:E.flick,lashes:E.lashes,shape:E.shape,corner:E.corner};
 const B=r.brows||{},st=BROWS[B.style]||{};
 const brows=B.style==='none'||!card.brows?null
  :{...card.brows,colour:B.colour||card.brows.colour,left:reshapeBrow(card.brows.left,st,B),right:reshapeBrow(card.brows.right,st,B)};
 const M=r.mouth||{},rest=MOUTHS[M.style]||{};
 const mouth=card.mouth?{...card.mouth,half:card.mouth.half*clamp((.88+.24*num(M.size))*(.92+.16*num(M.width)),.75,1.15)}:null;
 return {eyes:recipeEye(own,r.eyes),brows,taper:st.taper||0,bushy:st.bushy||0,mouth,mouthBase:{...rest}};
}

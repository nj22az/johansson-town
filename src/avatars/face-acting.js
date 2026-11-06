/**
 * How a modelled face acts its feelings (the creator, 26 October 2026, of Pixar Thuan: "she needs more personality when
 * she is shocked and the different expressions, now she comes off as Generic"). World's painter has one face for every
 * resident's feeling (face.js MOOD); a Pixar body plays each feeling its own way, in its own measures:
 *
 *  brows   {left, right}: [lift, tilt (+ the inner end down: a frown; -: up, a worry), arch, pinch], in the brow's units
 *          (the eye's: 1 = a 25th of the eye's width); each side its own, never a mirror.
 *  mouth   the mouth's shape (face-features.js MOUTH_KEYS) in place of the painter's.
 *  eyes    over the eye's drawn shape (eyes3d.js): ry, rx, iris (scales of her own), pupil, cut (the upper lid down),
 *          slant (+ down to the nose: a glare; -: sad), smile (the lower lid up), look [x, y] (where she looks: x to the
 *          side, y down; past 1 to roll the eyes), tremble (the irises shiver: fright), tear, squeeze (the creases of an
 *          eye squeezed shut), as (another drawn eye: 'closed', 'open').
 *  cheeks  [left, right] (0..1, up and out), scrunch (the nose, 0..1), jaw (0..1, at least; talking opens it more).
 *  spring  {f (Hz), z (damping)}: how the face gets there. Under 1 it overshoots: shock pops wide and settles, a laugh
 *          bounces; at 1 or over it sinks in, as sadness does.
 *
 * Feelings a body does not list fall back to the painter's (face-features.js featuresOf).
 */

const SPRING=Object.freeze({f:4,z:.8});

/**
 * Pixar Thuận: the baby of three sisters (profiles.js: "Thuan is the baby, so naturally I'm always right", says Nhung),
 * the shopkeeper who names her plants. Big, quick, open reactions: when she is shocked the whole face goes (brows to the
 * hairline, pupils to pinpricks, the jaw on the floor) and springs back; she is shy sideways and down with a blush, cross
 * with a pout rather than a scowl, and her sadness is a wobbling lower lip under brows gone up in the middle.
 */
const THUAN=Object.freeze({
 neutral:{brows:{left:[0,0,0,0],right:[0,0,0,0]}},
 smile:{brows:{left:[1.8,-.6,.8,0],right:[1.2,-.4,.6,0]},mouth:{smile:2.2,width:1.06,asym:.3},eyes:{smile:.32},cheeks:[.8,.65]},
 content:{brows:{left:[1.4,-.8,.5,0],right:[1.8,-1,.5,0]},mouth:{smile:1.6,width:1.02},cheeks:[.6,.55],spring:{f:2,z:.9}},
 calm:{brows:{left:[.8,-.3,.3,0],right:[.5,-.2,.2,0]},mouth:{smile:.9},eyes:{cut:.1}},
 happy:{brows:{left:[4,-1.2,1.4,0],right:[3.4,-1,1.2,0]},mouth:{smile:3,width:1.14,open:5,upper:.2,teeth:1,tongue:.35,asym:.3},
  cheeks:[1,.9],spring:{f:3,z:.5}},
 excited:{brows:{left:[6.5,-1,1.8,0],right:[5.6,-.8,1.6,0]},mouth:{smile:3.2,width:1.12,open:7,upper:.22,teeth:1,tongue:.5},
  eyes:{ry:1.28,iris:1.08,pupil:.62},cheeks:[1,1],spring:{f:3.4,z:.42}},
 laugh:{brows:{left:[5.5,-1.6,1.6,0],right:[4.6,-1.3,1.4,0]},mouth:{smile:3.2,width:1.18,open:11,upper:.16,teeth:1,tongue:.8,box:.1,shift:.5},
  cheeks:[1,1],scrunch:.5,spring:{f:2.6,z:.45}},
 sad:{brows:{left:[2,-8.5,-.8,1.6],right:[1.4,-7.6,-.7,1.4]},mouth:{smile:-6.5,width:.8,pout:.9,wobble:.45,shift:-.5},
  eyes:{cut:.3,slant:-.6,iris:1.12,pupil:.62,look:[.1,.45],tear:1},cheeks:[0,0],scrunch:0,spring:{f:1.3,z:.95}},
 worried:{brows:{left:[3.8,-7,-.4,2],right:[3,-6.2,-.3,1.8]},mouth:{smile:-1.2,width:.9,wobble:.6,shift:-.8},
  eyes:{ry:1.12,slant:-.25,iris:.94,look:[-.25,.1]},spring:{f:2.2,z:.7}},
 // cross, the baby sister's way: a glare, the nose wrinkled, the lips pressed and drawn back on one side over her teeth
 angry:{brows:{left:[-2.2,9.5,-1.2,2.8],right:[-3,10.4,-1.3,3]},mouth:{smile:-3,width:.86,open:1.6,upper:.75,teeth:1,thin:.6,pout:.3,asym:-1.2,shift:-.5,box:.4},
  eyes:{cut:.3,slant:.62,smile:.3,iris:.9,pupil:.42},cheeks:[.35,.45],scrunch:.9,spring:{f:4.2,z:.55}},
 grumpy:{brows:{left:[-1.4,4,-.8,1.4],right:[-2.6,5.2,-.9,1.8]},mouth:{smile:-3,width:.78,pout:1,asym:.6,shift:1.4,thin:.3},
  eyes:{cut:.42,slant:.08,look:[.45,.05]},cheeks:[.2,.1],spring:{f:2.5,z:.9}},
 // shy: down and away, a tucked little smile to one side
 shy:{brows:{left:[2.6,-3.6,.3,.8],right:[2,-3,.3,.6]},mouth:{smile:1.6,width:.74,shift:1.6,asym:.6,thin:.4},
  eyes:{cut:.38,look:[.7,.6],smile:.38},cheeks:[.7,.8],spring:{f:2,z:.85}},
 embarrassed:{brows:{left:[3.4,-5.4,.2,1.4],right:[2.6,-4.6,.2,1.2]},mouth:{smile:-.6,width:.86,wobble:.9,open:1.2,teeth:.6,upper:.6,shift:-1},
  eyes:{cut:.3,look:[-.6,.5],smile:.3},cheeks:[.5,.4],spring:{f:2.8,z:.6}},
 // surprise (a nice one): wide and bright, the pupils big, brows up, a little round "oh"
 surprised:{brows:{left:[8,-1.6,2.2,0],right:[7,-1.2,2,0]},mouth:{open:6.5,round:.85,width:.66,upper:.38,teeth:.4},
  eyes:{ry:1.36,rx:1.05,iris:1.06,pupil:.6},cheeks:[0,0],spring:{f:3.6,z:.5}},
 // shock: everything at once, too far, then back: brows at the hairline, the eyes as wide as they open with pinprick
 // pupils shivering, the jaw dropped into a tall gasp showing both rows of teeth
 shock:{brows:{left:[10.5,-2,2.6,0],right:[9.2,-1.6,2.4,0]},mouth:{open:13,round:.7,width:.82,upper:.38,teeth:.5,tongue:.3,box:.1,shift:.4},
  eyes:{ry:1.42,rx:1.06,iris:.48,pupil:.3,tremble:.07},cheeks:[0,0],scrunch:0,jaw:1,spring:{f:3.2,z:.38}},
 gobsmacked:{brows:{left:[10.5,-1.6,2.6,0],right:[9.6,-2,2.4,0]},mouth:{open:14,round:.55,width:.88,upper:.3,teeth:.7,lowTeeth:.3,tongue:.4,box:.25},
  eyes:{ry:1.5,rx:1.1,iris:.45,pupil:.3,tremble:.03},cheeks:[0,0],scrunch:0,jaw:1,spring:{f:2.6,z:.35}},
 // fright: brows up and knotted, eyes wide with small pupils, the mouth stretched into an "eek" with both rows of teeth
 scared:{brows:{left:[5.5,-7,.4,2.4],right:[4.6,-6.4,.4,2.2]},mouth:{smile:-2.6,width:1.2,open:6,box:.8,upper:.5,teeth:1,lowTeeth:1,thin:.2,shift:-.5},
  eyes:{ry:1.36,iris:.62,pupil:.3,slant:-.2,tremble:.05},cheeks:[.2,.25],spring:{f:3.6,z:.45}},
 thinking:{brows:{left:[7,-1,1.6,0],right:[-1.6,3.2,-.4,.8]},mouth:{smile:-.4,width:.78,asym:1.4,shift:2.2,pucker:.25},
  eyes:{look:[.65,-.7],cut:.12},spring:{f:2,z:.8}},
 sleep:{brows:{left:[-.8,-.8,0,0],right:[-.6,-.6,0,0]},mouth:{smile:.4,width:.82,open:.8,round:.5},jaw:.1,spring:{f:1.2,z:1}},
 dizzy:{brows:{left:[4,-5,0,0],right:[-1.5,3.5,0,0]},mouth:{wobble:1,smile:-.6,open:2,round:.4,shift:.8}},
 pain:{brows:{left:[-2.4,9,-1.2,3],right:[-2,8.4,-1.1,2.8]},mouth:{smile:-1.2,width:1.16,open:2.8,box:.9,upper:.5,teeth:1,lowTeeth:1,asym:-.6},
  eyes:{as:'closed',squeeze:1},cheeks:[1,1],scrunch:1,spring:{f:4.5,z:.6}},
 bliss:{brows:{left:[3.2,-3,.5,0],right:[2.6,-2.6,.5,0]},mouth:{smile:2.4,width:1.06,open:1.6,upper:.25,teeth:.3},
  cheeks:[.9,.9],spring:{f:1.4,z:1}},
 dismay:{brows:{left:[3,-6.4,-.3,1.6],right:[2.2,-5.6,-.3,1.4]},mouth:{smile:-1.6,width:1.06,thin:.6,shift:-.8},eyes:{cut:.22,slant:-.3,look:[0,.25]},
  spring:{f:2,z:.85}},
 daze:{brows:{left:[2.5,-3.5,0,0],right:[0,-1,0,0]},mouth:{wobble:.8,smile:-.4,open:1.4,round:.4,shift:.6},
  eyes:{as:'open',cut:.36,slant:-.15,look:[.4,.3],iris:.82,pupil:.35}},
 dry:{brows:{left:[-.8,1,-.6,0],right:[2.4,-.4,.4,0]},mouth:{smile:-.9,width:.9,thin:.6,shift:1},eyes:{as:'open',cut:.5,look:[0,.05]}},
 hope:{brows:{left:[4.6,-5.4,.8,1],right:[4,-4.8,.8,.8]},mouth:{smile:1.2,width:.8,thin:.3},eyes:{ry:1.12,iris:1.1,pupil:.62,look:[0,-.35]},
  spring:{f:2.4,z:.7}},
 focus:{brows:{left:[-1,4,-.6,1.6],right:[-2,5,-.7,2]},mouth:{smile:-.6,width:.86,thin:.6,asym:-.4,shift:-.8},eyes:{cut:.22,slant:.3,iris:.94}},
 relieved:{brows:{left:[2.6,-3.4,.4,0],right:[2,-3,.4,0]},mouth:{smile:1.8,width:1.04,open:1.4,upper:.3},spring:{f:1.5,z:.95}},
 smug:{brows:{left:[8,-1.2,2,0],right:[-1.6,2.6,-.4,.6]},mouth:{smile:.6,width:.94,asym:2.8,shift:1.4,thin:.3},eyes:{cut:.44,slant:-.05,look:[.75,.05]},
  cheeks:[.6,.15],spring:{f:2.4,z:.75}},
 bawling:{brows:{left:[3,-9,-.5,2],right:[2.4,-8.4,-.5,1.8]},mouth:{smile:-2.4,width:1.04,open:10,box:.6,upper:.4,teeth:.8,tongue:.5,wobble:.6},
  scrunch:.4,cheeks:[.3,.3],spring:{f:3,z:.5}},
 starstruck:{brows:{left:[7,-1.6,2,0],right:[6.2,-1.2,1.8,0]},mouth:{smile:3,width:1.1,open:6,upper:.2,teeth:1,tongue:.3},cheeks:[1,1]},
 sweatdrop:{brows:{left:[3,-4.6,0,1],right:[2.2,-3.8,0,.8]},mouth:{smile:.8,width:1.08,wobble:.8,thin:.3},eyes:{smile:.3,cut:.1}},
 blank:{brows:{left:[5,-.4,1,0],right:[4.4,0,.9,0]},mouth:{smile:-.8,width:.7},eyes:{ry:1.2,iris:.3,pupil:1}},
 pouting:{brows:{left:[-1.6,6,-.8,2],right:[-.8,5,-.6,1.6]},mouth:{pucker:.7,round:.9,width:.82,open:.7,pout:.5,smile:-.8,shift:-.6},
  eyes:{cut:.18,look:[-.5,0]},cheeks:[.9,.9],spring:{f:3,z:.6}},
 bleh:{brows:{left:[3,-1.6,.8,0],right:[4.2,-2,1,0]},mouth:{smile:1.2,open:3.2,tongue:1,upper:.5,width:.9,shift:.8},cheeks:[.7,.5]},
 drowsy:{brows:{left:[-1.4,-1.4,0,0],right:[-1,-1,0,0]},mouth:{open:9,round:.8,width:.7,upper:.4,tongue:.4},eyes:{cut:.48,look:[0,.5]},
  spring:{f:1.2,z:1}},
 lovestruck:{brows:{left:[3.6,-4.2,.8,0],right:[3,-3.6,.8,0]},mouth:{smile:2.4,width:1.02},cheeks:[.9,.9],spring:{f:2,z:.7}},
 fuming:{brows:{left:[-2.8,10.4,-1.4,3],right:[-3,10,-1.4,2.8]},mouth:{smile:-1.8,width:1.18,open:2.6,box:1,upper:.5,teeth:1,lowTeeth:1,thin:.4},
  eyes:{cut:.32,slant:.7,smile:.3},scrunch:1,cheeks:[.4,.4],spring:{f:4.5,z:.45}},
 drooling:{brows:{left:[3,-3.6,.6,0],right:[2.4,-3,.6,0]},mouth:{smile:1.2,open:1.6,asym:.6,shift:1,tongue:.2,upper:.4}},
 wink:{brows:{left:[-1.6,1.2,0,0],right:[4.6,-1.2,1.4,0]},mouth:{smile:2.8,width:1.12,open:3.2,upper:.2,teeth:1,asym:.8},cheeks:[1,.6],
  spring:{f:3.2,z:.5}},
 raging:{brows:{left:[-3,10.4,-1.5,3],right:[-2.6,10,-1.4,2.8]},mouth:{smile:-2,width:1.2,open:12,box:.9,upper:.45,teeth:1,lowTeeth:1,tongue:.4},
  eyes:{cut:.28,slant:.75,iris:.6,pupil:.35},jaw:.9,scrunch:1,cheeks:[.5,.5],spring:{f:4,z:.4}},
 seething:{brows:{left:[-2,8,-.8,2.8],right:[-2.4,8.8,-.9,3]},mouth:{smile:2.2,width:1.14,open:2.2,upper:.5,teeth:1,lowTeeth:1,box:.6,thin:.2},
  scrunch:.7,cheeks:[.7,.7]},
 eyeroll:{brows:{left:[4,-.4,1.2,0],right:[3,-.2,.9,0]},mouth:{smile:-1,width:.9,asym:-.8,shift:-1.2,thin:.5},eyes:{look:[.2,-1.75],cut:.28}},
 scheme:{brows:{left:[3.6,4.6,.2,1.8],right:[-2.2,7,-.8,2.6]},mouth:{smile:2.4,width:1.16,open:2.6,upper:.25,teeth:1,asym:1.2,box:.2},
  eyes:{cut:.36,slant:.45,look:[.5,0]}},
 kiss:{brows:{left:[2.6,-3,.5,0],right:[2,-2.6,.5,0]},mouth:{pucker:.65,round:.95,width:.8,open:.6,pout:.2},cheeks:[.5,.5]},
 flustered:{brows:{left:[6,-6.4,.6,1.8],right:[5,-5.8,.6,1.6]},mouth:{wobble:1.2,smile:-.6,width:.86,open:1.6,upper:.5,teeth:.6},
  eyes:{ry:1.3,iris:.85,pupil:.45,tremble:.04},spring:{f:3.4,z:.45}},
});

/**
 * Pixar Johansson: the ship's chief engineer, at home with Thuan on Kitano-jima (AGENTS.md); her husband, not grandpa (the
 * creator, 23 October 2026). Dry and steady: his reactions are smaller than hers and later, one brow does a great deal
 * of the talking, his smile goes up into his eyes and cheeks (and their crow's feet), and his shock is a double take, a
 * beat slower, the jaw dropping. Cross, he is stern, not sulky: brows down, mouth pressed flat. Clean-shaven (the
 * creator, 26 October 2026: "Remove the goatee"; "Remove moustache give him a mouth back").
 */
const JOHANSSON=Object.freeze({
 neutral:{brows:{left:[0,0,0,0],right:[0,0,0,0]}},
 smile:{brows:{left:[1.2,-.5,.4,0],right:[1.6,-.6,.5,0]},mouth:{smile:2.2,width:1.05},eyes:{smile:.35},cheeks:[.8,.8],spring:{f:3,z:.8}},
 content:{brows:{left:[1,-.6,.3,0],right:[1.3,-.8,.3,0]},mouth:{smile:1.6},cheeks:[.6,.6],spring:{f:1.8,z:.95}},
 calm:{brows:{left:[.4,-.2,.2,0],right:[.6,-.3,.2,0]},mouth:{smile:.8},eyes:{cut:.12}},
 relieved:{brows:{left:[2,-2.6,.3,0],right:[1.6,-2.2,.3,0]},mouth:{smile:1.8,open:1.2,upper:.22},spring:{f:1.4,z:1}},
 bliss:{brows:{left:[2.4,-2.4,.4,0],right:[2,-2,.4,0]},mouth:{smile:2.2,open:1.2,upper:.22},cheeks:[.9,.9],spring:{f:1.3,z:1}},
 happy:{brows:{left:[3,-1.4,1,0],right:[3.4,-1.6,1.1,0]},mouth:{smile:3,width:1.12,open:4.5,upper:.22,teeth:1,asym:.4},cheeks:[1,1],
  spring:{f:2.6,z:.6}},
 laugh:{brows:{left:[4.2,-2,1.2,0],right:[3.6,-1.6,1,0]},mouth:{smile:3,width:1.15,open:9,upper:.22,teeth:1,tongue:.6,box:.1,shift:-.6},
  cheeks:[1,1],scrunch:.4,spring:{f:2.2,z:.5}},
 sad:{brows:{left:[2.4,-6.5,-.6,1.4],right:[1.8,-5.8,-.5,1.2]},mouth:{smile:-3.5,width:.9,pout:.4},eyes:{cut:.32,slant:-.5,look:[.15,.45]},
  cheeks:[0,0],spring:{f:1.2,z:1}},
 worried:{brows:{left:[3,-5.5,-.3,1.8],right:[2.4,-4.8,-.2,1.6]},mouth:{smile:-1.4,width:.9,wobble:.4,shift:-.6},
  eyes:{ry:1.08,slant:-.2,look:[-.3,.1]},spring:{f:2,z:.8}},
 // His anger in the brows (the creator, 26 October 2026: "Eyebrows need rigging , he should be able to do "evil " angry
 // eyebrows"): his brows slope down to the outside at rest, so the inner ends come a long way down and in, the outer ends
 // go up, the line between them straight (a V), the inner hair bunched.
 angry:{brows:{left:[-2.4,20,-1.2,3,7,1,.35],right:[-2,19,-1.1,2.8,6.4,.95,.3]},
  mouth:{smile:-2.6,width:.92,thin:.8,open:1.2,upper:.6,teeth:.8,box:.6},
  eyes:{cut:.34,slant:.5,smile:.25,iris:.92},scrunch:.7,cheeks:[.3,.3],spring:{f:3.4,z:.7}},
 grumpy:{brows:{left:[-1.6,11,-.8,1.8,3,.6,.15],right:[-.8,9.6,-.6,1.5,2.4,.5,.1]},mouth:{smile:-2.2,width:.9,thin:.6,shift:-1},
  eyes:{cut:.44,look:[-.4,.05]},spring:{f:2.2,z:.95}},
 fuming:{brows:{left:[-2.8,21,-1.4,3.2,7.5,1,.4],right:[-2.6,20.4,-1.3,3,7,1,.35]},
  mouth:{smile:-2,width:1.12,open:2.2,box:1,upper:.5,teeth:1,lowTeeth:1,thin:.4},eyes:{cut:.3,slant:.55,iris:.9},scrunch:.9,
  cheeks:[.4,.4],spring:{f:3.6,z:.6}},
 raging:{brows:{left:[-3,22,-1.5,3.4,8,1,.45],right:[-2.8,21.6,-1.4,3.2,7.6,1,.4]},
  mouth:{smile:-2,width:1.18,open:11,box:.9,upper:.45,teeth:1,lowTeeth:1,tongue:.3},eyes:{cut:.18,slant:.6,iris:.86},scrunch:1,
  cheeks:[.5,.5],jaw:.9,spring:{f:3.8,z:.55}},
 // (a slow boil: clenched teeth in a tight grin under the V)
 seething:{brows:{left:[-2.2,18,-1,2.8,6,1,.3],right:[-2.4,18.6,-1,3,6.4,1,.3]},
  mouth:{smile:1.6,width:1.12,open:2,upper:.5,teeth:1,lowTeeth:1,box:.7,thin:.2},eyes:{as:'angry',cut:.4,slant:.5},scrunch:.6,
  spring:{f:1.6,z:.95}},
 // The evil grin: the V with the outer ends high (his left the higher), a sly look aside, the grin wide and lopsided.
 scheme:{brows:{left:[-1,19,-.6,2.6,9.5,1,.25],right:[-1.4,18,-.8,2.4,8,1,.2]},
  mouth:{smile:2.6,width:1.16,open:2.2,upper:.25,teeth:1,asym:1.4,box:.2},eyes:{cut:.36,slant:.55,look:[.5,0]},cheeks:[.7,.5],
  spring:{f:2.4,z:.8}},
 focus:{brows:{left:[-1.2,8,-.6,1.8,2,.5,.1],right:[-1.6,8.6,-.7,2,2.2,.5,.1]},mouth:{smile:-.6,width:.86,thin:.6,asym:-.4,shift:-.8},
  eyes:{cut:.22,slant:.3,iris:.94}},
 shy:{brows:{left:[2,-2.4,.3,.6],right:[1.6,-2,.3,.5]},mouth:{smile:1.6,width:.86,shift:1.4,asym:.6},eyes:{cut:.3,look:[.6,.5],smile:.3},
  cheeks:[.6,.6],spring:{f:2,z:.85}},
 embarrassed:{brows:{left:[2.6,-3.6,.2,1],right:[2,-3,.2,.8]},mouth:{smile:.6,width:.92,wobble:.6,shift:-1},eyes:{cut:.3,look:[-.6,.45],smile:.3},
  cheeks:[.5,.5]},
 surprised:{brows:{left:[7,-1.2,1.6,0],right:[6.2,-1,1.5,0]},mouth:{open:6,round:.8,width:.7,upper:.22},eyes:{ry:1.28},spring:{f:3,z:.55}},
 shock:{brows:{left:[9.5,-1.8,2.2,0],right:[8.6,-1.4,2,0]},mouth:{open:12,round:.85,width:.8,upper:.36,teeth:.8,lowTeeth:.3,tongue:.3},
  eyes:{ry:1.4,rx:1.06,iris:.55,pupil:.32,tremble:.04},cheeks:[0,0],scrunch:0,jaw:1,spring:{f:2.4,z:.42}},
 gobsmacked:{brows:{left:[10,-1.4,2.4,0],right:[9.4,-1.8,2.2,0]},mouth:{open:13,round:.8,width:.84,upper:.32,teeth:.9,lowTeeth:.5,tongue:.4},
  eyes:{ry:1.42,rx:1.06,iris:.5,pupil:.3},cheeks:[0,0],scrunch:0,jaw:1,spring:{f:2.2,z:.4}},
 scared:{brows:{left:[5,-6,.2,2.2],right:[4.2,-5.4,.2,2]},mouth:{smile:-2.2,width:1.16,open:5,box:.8,upper:.22,teeth:.4,lowTeeth:1},
  eyes:{ry:1.3,iris:.62,pupil:.3,tremble:.04},spring:{f:3.2,z:.5}},
 thinking:{brows:{left:[6,-.8,1.2,0],right:[-1.4,2.6,-.4,.8]},mouth:{smile:-.6,width:.86,asym:1.2,shift:1.6},eyes:{look:[.6,-.65],cut:.1},
  spring:{f:1.8,z:.9}},
 smug:{brows:{left:[7,-1,1.6,0],right:[-1.2,2,-.3,.4]},mouth:{smile:.8,asym:2.6,shift:1.2},eyes:{cut:.42,look:[.7,.05]},cheeks:[.6,.1],
  spring:{f:2.2,z:.8}},
 dry:{brows:{left:[-.6,.8,-.4,0],right:[2.6,-.4,.6,0]},mouth:{smile:-.8,width:.9,thin:.6,shift:.8},eyes:{as:'open',cut:.48}},
 pain:{brows:{left:[-2,7.5,-1,2.6],right:[-1.6,7,-.9,2.4]},mouth:{smile:-1,width:1.12,open:2.4,box:.9,upper:.22,teeth:1,lowTeeth:1},
  eyes:{as:'closed',squeeze:1},cheeks:[1,1],scrunch:1,spring:{f:4,z:.6}},
 wink:{brows:{left:[-1.4,1,0,0],right:[3.4,-.8,1,0]},mouth:{smile:2.6,width:1.1,open:2.6,upper:.22,teeth:1,asym:.8},cheeks:[1,.6],
  spring:{f:3,z:.55}},
 kiss:{brows:{left:[1.8,-1.6,.3,0],right:[1.4,-1.2,.3,0]},mouth:{pucker:.6,round:.9,width:.8,open:.5},cheeks:[.4,.4]},
 eyeroll:{brows:{left:[3.4,-.2,1,0],right:[2.6,0,.8,0]},mouth:{smile:-1,width:.9,asym:-.8,shift:-1.2,thin:.5},eyes:{look:[.2,-1.75],cut:.28}},
});

/**
 * Pixar Tetsuo: the island's electrician, a deadpan music lover (profiles.js: "Turn it gently. Radios have feelings"),
 * awkward with people (the owner, 28 October 2026: "can you make Tetsuo look more awkward"). At rest he is never quite
 * at ease: the inner ends of his brows a little up, the mouth a tight line pulled to one side, the eyes slightly wide
 * and off to the side rather than on yours. His smile is the awkward one, too wide and all teeth with the brows still
 * worried; his laugh a snort he swallows; when he is shy or caught out he looks down and away with a sweaty grin.
 */
const TETSUO=Object.freeze({
 neutral:{brows:{left:[1.4,-2.4,.2,.5],right:[.7,-1.6,.1,.3]},mouth:{smile:.2,width:.88,asym:1,shift:1,thin:.55},
  eyes:{ry:1.06,look:[.2,.06]}},
 calm:{brows:{left:[1,-1.8,.2,.3],right:[.5,-1.2,.1,.2]},mouth:{smile:.5,width:.9,asym:.8,shift:.8,thin:.5},eyes:{ry:1.04,look:[.15,.05]}},
 smile:{brows:{left:[3.4,-4.2,.4,1],right:[2.8,-3.6,.4,.8]},mouth:{smile:2.6,width:1.28,open:3.4,upper:.42,teeth:1,thin:.5,asym:.5,wobble:.25},
  eyes:{smile:.2,ry:1.05,look:[.1,0]},cheeks:[.5,.4],spring:{f:3.4,z:.6}},
 content:{brows:{left:[2,-3,.3,.6],right:[1.6,-2.6,.3,.5]},mouth:{smile:1.6,width:1.1,open:1,upper:.6,teeth:.8,thin:.5,asym:.4},
  eyes:{smile:.15},cheeks:[.4,.3]},
 happy:{brows:{left:[4.4,-4.6,.6,1],right:[3.8,-4,.6,.8]},mouth:{smile:3,width:1.26,open:4,upper:.5,teeth:1,thin:.4,asym:.5,wobble:.3},
  eyes:{smile:.25,ry:1.08},cheeks:[.7,.6],spring:{f:3.2,z:.55}},
 laugh:{brows:{left:[4,-4,.6,.8],right:[3.2,-3.4,.5,.6]},mouth:{smile:2.6,width:1.16,open:3,upper:.6,teeth:1,thin:.5,asym:.8,shift:.8},
  eyes:{smile:.4,cut:.2,look:[.3,.2]},cheeks:[.6,.5],scrunch:.5,spring:{f:4,z:.5}},
 shy:{brows:{left:[3,-4.4,.2,1],right:[2.4,-3.8,.2,.8]},mouth:{smile:1.4,width:1.08,open:1,upper:.6,teeth:.8,thin:.5,shift:1.4,asym:.7,wobble:.4},
  eyes:{cut:.3,look:[.65,.55],smile:.2},cheeks:[.4,.5],spring:{f:2.2,z:.8}},
 embarrassed:{brows:{left:[4,-6,.2,1.6],right:[3.2,-5.2,.2,1.4]},mouth:{smile:1,width:1.18,open:1.6,upper:.6,teeth:1,thin:.5,wobble:.8,shift:-1},
  eyes:{cut:.24,look:[-.6,.5],smile:.2},cheeks:[.5,.4],spring:{f:2.8,z:.6}},
 sweatdrop:{brows:{left:[3.6,-5,.2,1.2],right:[2.8,-4.2,.2,1]},mouth:{smile:1.2,width:1.2,open:1.2,upper:.6,teeth:1,thin:.5,wobble:.9},
  eyes:{ry:1.08,look:[.4,.1]}},
 thinking:{brows:{left:[5,-1.4,1,.2],right:[-1,2.4,-.3,.6]},mouth:{smile:-.4,width:.8,asym:1.4,shift:1.8,thin:.6},eyes:{look:[.6,-.6],cut:.1},
  spring:{f:1.8,z:.9}},
});

/** Each Pixar body's acting (a body not listed plays the painter's feelings). talkBrows: how much the brows rise and fall
 *  with what is said; lines: an older face's lines; mouth: the body's own mouth under every feeling's (none so far). */
export const ACTING=Object.freeze({
 Thuan:Object.freeze({feelings:THUAN,talkBrows:1.3}),
 // (lines: an older face's forehead lines, frown creases and crow's feet, face-features.js and eyes3d.js)
 // (browTaper: his brows thin to a tail at the outer end; browRange: where his brows may go, pixar.js BROW_RANGE's order,
 // wider than hers for the evil V: his brow decal was made wider to hold it, jojo game_johansson.py face_decals)
 Johansson:Object.freeze({feelings:JOHANSSON,talkBrows:.7,lines:1,browTaper:.4,
  browRange:Object.freeze([[-3.2,11],[-9.5,24],[-1.6,3],[0,3.6],[-4,10],[0,1],[0,.8]])}),
 // (talkBrows: his brows hop up and down with every word he says, the nervous talker's tell)
 // (browBushy: his brows' edge in tufts, an old man's bushy brows: the owner, 28 October 2026, "Make his eyebrows bushier")
 Tetsuo:Object.freeze({feelings:TETSUO,talkBrows:1.7,lines:1,browBushy:1,browTaper:.3}),
});

/** A body's acting, or null. */
export function actingOf(name){return ACTING[name]||null;}

/** How the face gets to this feeling: {f, z}. */
export function springOf(acting,expression){return acting?.feelings?.[expression]?.spring||SPRING;}

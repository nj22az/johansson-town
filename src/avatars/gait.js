import {personalityOf} from './personality.js';

/**
 * How somebody walks, so you can tell who it is from across the street. animate.js builds
 * every step from the same joints; the gait decides how:
 *
 *   stride  length of step        bounce  how much the body rises on each step
 *   lift    how high the knees    arms    how far the arms swing
 *   elbow   extra bend at the elbow
 *   sway    hips rolling side to side       swagger  shoulders and hips twisting
 *   lean    leaning forward (+) or back (-) headBob  the head nodding with the step
 *   toe     feet turned out
 *   carry   what the arms do: swing, behind (hands clasped at the back), pockets,
 *           stiff (a march), hips (hands on hips)
 *   tics    small things done while walking: glance (a look to the side), sky (a look up),
 *           skip (a little skip), watch (a look at the wrist), hum (the head bobbing to a
 *           tune), hair (a hand to the hair), nod (a nod to oneself), kick (a kick at a pebble)
 *   ticEvery  seconds between tics
 *
 * Three layers: the personality type's walk, the life stage (children skip, elders
 * stoop), and a few residents whose walk is part of who they are.
 */
const BASE=Object.freeze({stride:1,bounce:1,lift:1,arms:1,elbow:0,sway:0,swagger:1,lean:0,headBob:0,toe:0,carry:'swing',tics:['glance'],ticEvery:[10,22]});

const BY_TYPE=Object.freeze({
 'Lighthouse keeper':{stride:1.05,bounce:.7,arms:.7,lean:.02,carry:'behind',tics:['sky','glance'],ticEvery:[9,18]},
 'Porch sitter':     {stride:.85,bounce:.6,lift:.7,arms:.6,lean:-.02,sway:.03,carry:'pockets',tics:['sky','hum'],ticEvery:[12,24]},
 'Old storyteller':  {stride:.9,bounce:.7,arms:.8,lean:.04,carry:'behind',tics:['nod','glance'],ticEvery:[8,16]},
 'Cloud watcher':    {stride:.95,bounce:1.1,arms:.8,headBob:.03,sway:.03,tics:['sky','sky','hum'],ticEvery:[7,14]},
 'Quiet craftsman':  {stride:1,bounce:.7,arms:.65,lean:.05,elbow:-.1,tics:['watch','glance'],ticEvery:[14,26]},
 'Easy neighbour':   {stride:.95,bounce:1,arms:.9,sway:.03,carry:'pockets',tics:['hum','glance'],ticEvery:[10,20]},
 'Big heart':        {stride:.95,bounce:1.3,arms:1.1,sway:.04,headBob:.03,tics:['hum','glance','skip'],ticEvery:[8,16]},
 'Wanderer':         {stride:1.1,bounce:1,arms:.9,swagger:1.3,toe:.08,carry:'pockets',tics:['sky','glance','kick'],ticEvery:[8,16]},
 'Timekeeper':       {stride:1.05,bounce:.6,lift:.9,arms:1.2,elbow:.15,swagger:.6,lean:.03,carry:'stiff',tics:['watch','watch','nod'],ticEvery:[7,14]},
 'Helping hand':     {stride:1,bounce:1.1,arms:1.1,lean:.04,tics:['glance','hair'],ticEvery:[9,18]},
 'Rising star':      {stride:.95,bounce:1.2,arms:.9,sway:.07,swagger:1.4,headBob:.02,tics:['hair','hum'],ticEvery:[7,14]},
 'Festival friend':  {stride:.95,bounce:1.5,lift:1.3,arms:1.3,sway:.04,headBob:.04,tics:['skip','hum','skip'],ticEvery:[6,12]},
 'Straight shooter': {stride:1.12,bounce:.8,arms:1.15,lean:.06,swagger:.8,tics:['watch','glance'],ticEvery:[11,22]},
 'Joker':            {stride:.95,bounce:1.3,lift:1.2,arms:1,swagger:1.5,headBob:.03,tics:['kick','hum','skip'],ticEvery:[6,12]},
 'Firecracker':      {stride:1.15,bounce:1.1,arms:1.3,lean:.08,elbow:-.2,swagger:1.2,tics:['glance','nod'],ticEvery:[8,15]},
 'Typhoon':          {stride:1.1,bounce:1.6,lift:1.4,arms:1.4,swagger:1.4,headBob:.05,tics:['skip','skip','kick','sky'],ticEvery:[4,9]},
});

const BY_AGE=Object.freeze({
 child:{bounce:1.5,lift:1.3,stride:.9,arms:1.2,tics:['skip','kick','skip']},
 teen:{bounce:1.2,arms:1.05},
 adult:{},
 elder:{stride:.78,bounce:.5,lift:.6,arms:.5,lean:.12,carry:'behind',headBob:.02},
});

/** Residents whose walk is part of who they are. */
export const PERSONAL_GAITS=Object.freeze({
 'Grandmother Higa':{stride:.72,bounce:.45,lift:.55,lean:.16,carry:'behind',tics:['nod','sky'],ticEvery:[10,20]},
 'Officer Mori':{stride:1.15,bounce:.6,arms:1.2,elbow:.2,swagger:.5,lean:-.02,carry:'stiff',tics:['glance','glance','watch'],ticEvery:[6,12]},
 Vy:{bounce:1.5,lift:1.3,arms:1.1,headBob:.04,tics:['skip','hum','hair'],ticEvery:[5,10]},
 Thuan:{stride:1.05,bounce:1.1,arms:1,lean:.03,tics:['glance','hum','hair'],ticEvery:[8,15]},
 Thao:{stride:1.08,bounce:.9,swagger:1.4,sway:.05,carry:'pockets',tics:['glance','hum'],ticEvery:[9,16]},
 Nhung:{stride:.9,bounce:.9,arms:.7,headBob:.02,tics:['sky','hair'],ticEvery:[9,18]},
 Johansson:{stride:1.12,bounce:.85,arms:.9,lean:.03,tics:['sky','watch','glance'],ticEvery:[10,20]},
 'Harbour master':{stride:1.05,bounce:.7,arms:.8,toe:.12,carry:'behind',tics:['sky','watch']},
 // (awkward, the owner, 28 October 2026: "can you make Tetsuo look more awkward": a stooped, head-first, bouncy walk, the
 // arms held stiff and close, no swagger, the feet a little turned in, and nervous glances and a rub of his bald head)
 Tetsuo:{stride:.88,bounce:1.25,lift:1.2,arms:.42,elbow:.22,swagger:.25,lean:.08,headBob:.04,toe:-.06,carry:'swing',
  tics:['glance','glance','hair','nod','watch'],ticEvery:[5,10]},
});
/**
 * The walks of the retired (people/roster.js RETIRED): kept so a history story or Studio still walks them as themselves,
 * out of PERSONAL_GAITS so no live list names them (tests/avatar-gait.test.mjs holds that list to the town).
 */
export const RETIRED_GAITS=Object.freeze({
 'Mr Ōshiro':{stride:.82,bounce:.55,lean:.09,carry:'behind',tics:['sky','nod']},
 Barfly:{stride:.75,bounce:.4,lift:.45,arms:.4,lean:.1,sway:.05,carry:'pockets',tics:['hum','glance'],ticEvery:[8,14]},
 Reiko:{stride:1,bounce:.8,arms:.8,lean:.05,tics:['nod','glance']},
});

/** The gait for a recipe, with a little of the person's own (rand, 0..1) in every number. */
export function gaitOf(recipe={},rand=Math.random){
 const type=personalityOf(recipe.profile||{}).name;
 const g={...BASE,...(BY_TYPE[type]||{}),...(BY_AGE[recipe.age]||{}),...(PERSONAL_GAITS[recipe.name]||RETIRED_GAITS[recipe.name]||{})};
 const jitter=(v,k)=>v*(1+(rand()-.5)*k);
 return {...g,stride:jitter(g.stride,.08),bounce:jitter(g.bounce,.2),arms:jitter(g.arms,.15),lift:jitter(g.lift,.1),tics:[...g.tics],ticEvery:[...g.ticEvery],type};
}

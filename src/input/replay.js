/**
 * Recording and replaying a walk, step by step (Mario Artist's REC MODE: research/mario-artist/report.md §2.7 —
 * "determinism is a tool": the same recording is a test, a staged shot and a title-screen demo).
 *
 * The game runs on a fixed simulation step (game.js SIM_STEP, 1/60 s), and updatePlayer() combines every input — keys,
 * touch sticks, a controller, mouse look, tap to walk, thumb steering, easing, running, a drink's wander — into one
 * move each step. A recording keeps that move, step by step, and where the player then stood:
 *   frame [f, s, yaw, pitch, flags, x, z, dt, wander]
 *     f/s     forward and sideways, as the feet were told (-1..1, after easing and tap-to-walk steering)
 *     yaw/pitch  the view; flags: 1 running, 2 walking to a tapped spot
 *     x/z     where he stood after the step; dt: the step's length (the last step of an audit step can be short)
 *     wander  how far a drink turned the feet off their line (radians, 0 when sober)
 * Two ways to play it back:
 *   inputs  the moves again: the world answers as it did (a test: do the walls and floors stop him where they did?)
 *   poses   the recorded places exactly: nothing can drift (a staged comic or film shot, the title demo)
 * Every second a checkpoint compares where he is with where he was; the largest drift is reported, never hidden.
 * Inside a room the walls answer the same each time, and a walk replays to the millimetre (checked: 11–12 m walks in
 * Umi-no-yu and the izakaya). Out in the town the residents walk their own ways: one standing where they did not
 * before nudges him aside, and that shows as drift. Use poses for a shot that must match.
 * Not in recordings yet (open): presses on things (E, taps on objects), the bicycle, menus.
 */
export const REPLAY_VERSION=1;
export const CHECK_EVERY=60;   // steps between checkpoints (one second)
const r4=v=>Math.round((+v||0)*1e4)/1e4,r3=v=>Math.round((+v||0)*1e3)/1e3;

const r6=v=>Math.round((+v||0)*1e6)/1e6,r9=v=>Math.round((+v||0)*1e9)/1e9;
export const FRAME_LENGTH=9;
export const encodeFrame=({f=0,s=0,yaw=0,pitch=0,running=false,walking=false,x=0,z=0,dt=1/60,wander=0})=>
 [r6(f),r6(s),r6(yaw),r6(pitch),(running?1:0)|(walking?2:0),r3(x),r3(z),r9(dt),r6(wander)];
export const decodeFrame=([f,s,yaw,pitch,flags,x,z,dt,wander])=>({f,s,yaw,pitch,running:!!(flags&1),walking:!!(flags&2),x,z,dt,wander});

/**
 * Starts a recording. start: {room (a place id, or null in the town), x, y, z, yaw, pitch, minutes, weather}.
 * add(frame) once per simulation step; finish() gives the recording (plain JSON).
 */
export function createRecorder(start,{note=''}={}){
 const frames=[];let open=true;
 return {
  get open(){return open;},
  get length(){return frames.length;},
  add(frame){if(open)frames.push(encodeFrame(frame));},
  finish(){open=false;return {version:REPLAY_VERSION,step:1/60,note:String(note||''),start:{...start},frames:frames.slice()};},
  cancel(){open=false;},
 };
}

/** What is wrong with a recording, as sentences (none: it can be played). */
export function recordingProblems(rec){
 if(!rec||typeof rec!=='object')return ['That is not a recording.'];
 const out=[];
 if(rec.version!==REPLAY_VERSION)out.push(`A recording of version ${rec.version} cannot be played here (this town plays version ${REPLAY_VERSION}).`);
 const st=rec.start;
 if(!st||![st.x,st.z,st.yaw,st.pitch].every(Number.isFinite))out.push('The recording does not say where it starts.');
 if(!Array.isArray(rec.frames)||!rec.frames.length)out.push('The recording has no steps.');
 else if(!rec.frames.every(a=>Array.isArray(a)&&a.length===FRAME_LENGTH&&a.every(Number.isFinite)&&a[7]>=0&&a[7]<=.1))out.push('Some steps of the recording are damaged.');
 return out;
}

/**
 * Plays a recording back. next() gives the step's frame (decoded) until the end, then null. check(i, x, z) is called
 * by the game after each step with where the player now is: it keeps the largest drift at the checkpoints and at the
 * last step. mode: 'inputs' or 'poses'.
 */
export function createPlayer(rec,{mode='inputs'}={}){
 const problems=recordingProblems(rec);if(problems.length)throw new Error(problems.join(' '));
 if(mode!=='inputs'&&mode!=='poses')throw new Error(`No replay mode "${mode}" (inputs or poses).`);
 let i=0,worst=0,worstAt=-1,last=0;
 return {
  mode,
  get index(){return i;},
  get length(){return rec.frames.length;},
  get done(){return i>=rec.frames.length;},
  next(){return i<rec.frames.length?decodeFrame(rec.frames[i++]):null;},
  /** Where the player is after step i-1, against where the recording had him. */
  check(x,z){
   const k=i-1;if(k<0||k>=rec.frames.length)return;
   if(k%CHECK_EVERY!==CHECK_EVERY-1&&k!==rec.frames.length-1)return;
   const [, , , , , rx,rz]=rec.frames[k],d=Math.hypot(x-rx,z-rz);last=d;
   if(d>worst){worst=d;worstAt=k;}
  },
  report(){return {mode,steps:rec.frames.length,played:i,done:i>=rec.frames.length,drift:{worst:r3(worst),at:worstAt,last:r3(last)}};},
 };
}

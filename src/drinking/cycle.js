/** One sober performance shared by every drink and every character adapter.
 * Times are seconds; values are sampled from absolute time, never accumulated poses.
 */
export const DRINK_PHASES = Object.freeze([
  ['PREPARE', .25], ['REACH', .65], ['GRASP', .30], ['LIFT', .45],
  ['APPROACH', .65], ['CONTACT', .30], ['SIP', 1.25], ['SWALLOW', .55],
  ['RECOVER', .60], ['SET_DOWN', .65], ['RELEASE', .30], ['RETURN', .65],
].map(([id, duration], i) => Object.freeze({id, duration, index: i + 1})));
export const CYCLE_DURATION = DRINK_PHASES.reduce((s, p) => s + p.duration, 0);
export const SIP_FLOW_START = .42;
export const SIP_FLOW_END = .90;
export const clamp01 = x => Math.min(1, Math.max(0, x));
export const ease = x => { const t = clamp01(x); return t*t*t*(t*(t*6-15)+10); };
export const phaseStart = id => {
  let t = 0;
  for (const phase of DRINK_PHASES) { if (phase.id === id) return t; t += phase.duration; }
  return CYCLE_DURATION;
};

/** Flow is a bounded part of the sip, after the glass has reached its flow angle.
 * This is the requested amount, not permission to consume. The contact controller
 * separately validates rim/lip contact, orientation and liquid at the edge.
 */
export function sampleCycle(elapsed, {active = true} = {}) {
  const time = Math.max(0, Number(elapsed) || 0);
  if (!active || time >= CYCLE_DURATION - 1e-10) {
    return {id:'IDLE',index:0,progress:0,eased:0,elapsed:time,busy:false,
      done:active && time >= CYCLE_DURATION - 1e-10,grip:0,flowProgress:active ? 1 : 0,lift:0};
  }
  let start = 0, phase = DRINK_PHASES[0];
  for (const candidate of DRINK_PHASES) {
    phase = candidate;
    if (time < start + candidate.duration - 1e-10) break;
    start += candidate.duration;
  }
  const progress = clamp01((time-start)/phase.duration), s = ease(progress);
  let grip = phase.index >= 4 && phase.index <= 10 ? 1 : 0;
  if (phase.id === 'GRASP') grip = s;
  if (phase.id === 'RELEASE') grip = 1-s;
  let lift = phase.index >= 6 && phase.index <= 8 ? 1 : 0;
  if (phase.id === 'LIFT') lift = .2*s;
  if (phase.id === 'APPROACH') lift = .2+.8*s;
  if (phase.id === 'RECOVER') lift = 1-.8*s;
  if (phase.id === 'SET_DOWN') lift = .2*(1-s);
  const flowProgress = phase.id === 'SIP' ? ease((progress-SIP_FLOW_START)/(SIP_FLOW_END-SIP_FLOW_START)) : phase.index > 7 ? 1 : 0;
  return {...phase,progress,eased:s,elapsed:time,busy:true,done:false,grip,flowProgress,lift};
}

/** Break elapsed time at phase ends so a slow frame cannot skip the final valid
 * consumption sample, or release before the placement sample was evaluated.
 */
export function advanceCycle(from, dt, visit) {
  const end = Math.min(CYCLE_DURATION, Math.max(from, from+Math.max(0,dt)));
  let boundary=0;
  for (const phase of DRINK_PHASES) {
    boundary += phase.duration;
    if (boundary > from+1e-9 && boundary <= end+1e-9) {
      visit(Math.max(from,boundary-1e-8));
      visit(boundary);
    }
  }
  if (end < CYCLE_DURATION) visit(end);
  return end;
}

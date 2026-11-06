/**
 * When to try the ink and grade again after the driver has refused them.
 *
 * The look used to be given up for the whole session on the strength of one bad
 * frame: a single throw disposed the pipeline and left the town rendering plain until
 * reload. On a phone that is the wrong trade. iOS drops and restores WebGL contexts
 * under memory pressure and when a tab is backgrounded, so a frame that fails is
 * usually a moment rather than a verdict — and what the player sees is the cel shading
 * vanishing mid-walk and never coming back.
 *
 * So a failure costs a few seconds instead of the session, with a cooling-off that
 * lengthens each time so a driver that genuinely cannot do it is not asked forever. A
 * restored context is the one case worth trying again at once, because the targets
 * that died went with the old context.
 */
export function createInkRecovery({retries=4,cooldown=3500,now=()=>performance.now()}={}){
 let failures=0,retryAt=0;
 return {
  get failures(){return failures;},
  /** True while another attempt is still owed, whether or not it is due yet. */
  get retrying(){return failures>0&&failures<=retries;},
  /** True once the driver has been given every chance and the plain path is the answer. */
  get exhausted(){return failures>retries;},
  /** Whether the pipeline may be built right now. */
  ready(){return failures<=retries&&now()>=retryAt;},
  /** Records a failed frame. Returns whether another attempt will be made. */
  failed(){failures++;retryAt=now()+cooldown*failures;return failures<=retries;},
  /** A restored context: forget the history and try at the next frame. */
  restored(){failures=0;retryAt=0;},
 };
}

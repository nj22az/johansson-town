/**
 * The sun's shadow biases, held in texels of its shadow map so every device gets the same freedom from acne (the owner's
 * iPad, 26 November 2026: diagonal saw-toothed bands on the Minato Maru's white walls, "Lots of z fighting I thought we
 * eliminated it").
 *
 * The normal bias was a fixed 0.045 m: 1.77 texels of the desktop's 2048² map over ±26 m, but only 0.89 of a tablet's
 * 1024² (5 cm a texel), less than the shadow filter's own reach of a texel either side. A wall turned from the sun is
 * drawn in the shadow map itself (three.js casts a one-sided solid from its far side), so with too short an offset its
 * filtered comparisons fell either side of its own depth, texel by texel: light and dark bands, with saw-toothed edges.
 * Measured with tools/flicker-audit.mjs (briefs/HANDOFF-ZFIGHT-FERRY-2026-11-26.md). The desktop keeps exactly the bias
 * it was tuned with; a smaller map gets the same number of texels, so its bias is longer in metres.
 */
/** The normal bias in texels of the sun's shadow map: the desktop's tuned 0.045 m over 2048 texels across 52 m. */
export const SUN_NORMAL_BIAS_TEXELS=.045/(52/2048);
/** The depth bias (in the shadow camera's depth range), unchanged from the desktop's. */
export const SUN_DEPTH_BIAS=-.00035;

/** The sun's shadow biases for a graphics profile (startup-recovery.js graphicsProfile): {bias, normalBias, texel}. */
export function sunShadowBias({shadowSize,shadowRadius}){
 const texel=shadowSize>0?2*shadowRadius/shadowSize:0;
 return {bias:SUN_DEPTH_BIAS,normalBias:+(SUN_NORMAL_BIAS_TEXELS*texel).toFixed(5),texel};
}

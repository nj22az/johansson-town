import * as THREE from '../../vendor/three.module.js';

// The ink pipeline's hue-preserving highlight shoulder, fused into the ordinary
// material draw. No render targets, depth textures, extra passes or model loads.
// Cel bands and painted surface grain continue to come from cel.js.
export const TOWN_TONE_MAPPING=`vec3 CustomToneMapping( vec3 color ) {
 color = max( color * toneMappingExposure * 1.04, vec3(0.0) );
 float peak = max(color.r, max(color.g, color.b));
 const float knee = 0.78;
 if (peak > knee) {
  float shoulder = knee + (1.0-knee)*(1.0-exp(-(peak-knee)/(1.0-knee)));
  color *= shoulder / peak;
 }
 float light = dot(color, vec3(0.2126,0.7152,0.0722));
 float paper = smoothstep(0.02,0.55,light);
 // A restrained violet shadow and warm paper light; no grey shadow lift, so
 // night, dark hair and the shaded counter retain their depth.
 color *= mix(vec3(0.93,0.92,1.0),vec3(1.0,0.99,0.96),paper);
 color += vec3(0.007,0.00315,0.0)*light;
 float grey = dot(color, vec3(0.2126,0.7152,0.0722));
 return clamp(mix(vec3(grey),color,1.12),0.0,1.0);
}`;

export function useTownColour(renderer){
 const chunk=THREE.ShaderChunk.tonemapping_pars_fragment;
 const plain='vec3 CustomToneMapping( vec3 color ) { return color; }';
 if(chunk.includes(plain))THREE.ShaderChunk.tonemapping_pars_fragment=chunk.replace(plain,TOWN_TONE_MAPPING);
 // Repeated calls after a restored context use the same shader source/cache key.
 renderer.toneMapping=THREE.CustomToneMapping;
 renderer.toneMappingExposure=1;
}

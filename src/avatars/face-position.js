import {faceLayout} from './face.js';

export const POSITION_FEATURES=new Set(['eyes','brows','nose','mouth']);

/** Hit the selected feature in the face painter's 256-unit coordinate system. */
export function hitFaceFeature(recipe,feature,{x,y}){
 if(!POSITION_FEATURES.has(feature))return null;
 const l=faceLayout(recipe),paired=feature==='eyes'||feature==='brows';
 const cy=feature==='eyes'?l.eyeY:feature==='brows'?l.browY:l[feature+'Y'];
 const spread=feature==='eyes'?l.spread:l.browSpread;
 const side=x<128?-1:1,cx=paired?128+side*spread:l[feature+'X'];
 // Generous touch targets; restrict edits to the selected category.
 return Math.abs(x-cx)<=28&&Math.abs(y-cy)<=22?{feature,side}:null;
}

/** Relative motion preserves the initial grab offset and mirrors paired features. */
export function draggedFaceFields(start,{feature,side},dx,dy){
 const paired=feature==='eyes'||feature==='brows',horizontal=paired?'spacing':'x';
 const scaleX={eyes:36,brows:32,nose:48,mouth:56}[feature];
 const scaleY={eyes:56,brows:48,nose:48,mouth:54}[feature];
 const clamp=v=>Math.max(0,Math.min(1,v));
 return {[feature+'.'+horizontal]:clamp(start[feature][horizontal]+dx*(paired?side:1)/scaleX),
  [feature+'.height']:clamp(start[feature].height-dy/scaleY)};
}

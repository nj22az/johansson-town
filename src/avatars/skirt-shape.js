import * as THREE from '../../vendor/three.module.js';

/** Shared tailoring dimensions, in the avatar's own metres. Plain skirts follow
 * the reference's fitted hips and restrained A-line; other cuts keep their identity.
 * Used by the mesh, spring endpoints and both the CPU/GPU cloth fit.
 */
export function skirtSpec(m,kind='skirt'){
 if(m.panelSkirt&&kind==='skirt'){
  const waist=m.hipY+m.torso*(m.studio?.30:.13),length=(m.studio?m.H*.142:m.torso*.13+m.thigh*.78)*(.8+.4*m.skirtLength);
  const waistR=m.studio?m.width*m.waistRatio*.5+.009*m.k:m.hips*.5+.008*m.k;
  const hipR=m.hips*.5+.007*m.k,hemR=Math.max(hipR+.009*m.k,waistR*(m.studio?1.40:1.18))+(m.skirtFlare-.5)*.05*m.k;
  return {waist,length,waistR,hipR,hemR,hipAt:Math.min(.65,Math.max(.25,(waist-m.hipY)/length)),rx:hemR,rz:hemR*m.depth/m.width,thickness:.002*m.k};
 }
 const waist=m.hipY+m.torso*.13,tailored=kind==='skirt';
 const length=tailored?m.torso*.13+m.thigh*.78:kind==='longskirt'?m.thigh+m.shin*.85:m.thigh*.9;
 const waistR=tailored?m.hips*.5+.008*m.k:m.hips*.53;
 const hipR=m.hips*.53+.004*m.k,hemR=tailored?m.hips*.55+.008*m.k:m.hips*.66+length*.22;
 return {waist,length,waistR,hipR,hemR,rx:hemR,rz:hemR*m.depth/m.width,thickness:.0035*m.k};
}

export function skirtRadiusAt(s,f){
 if(s.hipAt)return f<s.hipAt?THREE.MathUtils.lerp(s.waistR,s.hipR,THREE.MathUtils.smoothstep(f,0,s.hipAt)):THREE.MathUtils.lerp(s.hipR,s.hemR,THREE.MathUtils.smoothstep(f,s.hipAt,1));
 return f<.35?THREE.MathUtils.lerp(s.waistR,s.hipR,THREE.MathUtils.smoothstep(f,0,.35)):
  THREE.MathUtils.lerp(s.hipR,s.hemR,THREE.MathUtils.smoothstep(f,.35,1));
}

/** A continuous closed cloth shell with a rounded waistband and turned-under
 * hem. Elliptical body scaling is applied by the shared builder as for pleats.
 * No floor disk: the legs enter and leave through the two garment openings.
 */
export function tailoredSkirtGeometry(m){
 const s=skirtSpec(m),rows=[],n=10,h=s.length/2,t=s.thickness;
 const radius=f=>skirtRadiusAt(s,f);
 for(let i=0;i<=n;i++){const f=i/n;rows.push(new THREE.Vector2(radius(f),THREE.MathUtils.lerp(h-t/2,-h+t/2,f)));}
 // A half-round hem joins the outer face to the lining without a razor edge.
 for(let i=1;i<=4;i++){const a=i/4*Math.PI;rows.push(new THREE.Vector2(s.hemR-t/2+t/2*Math.cos(a),-h+t/2-t/2*Math.sin(a)));}
 for(let i=n-1;i>=0;i--){const f=i/n;rows.push(new THREE.Vector2(radius(f)-t,THREE.MathUtils.lerp(h-t/2,-h+t/2,f)));}
 for(let i=1;i<=4;i++){const a=Math.PI+i/4*Math.PI;rows.push(new THREE.Vector2(s.waistR-t/2+t/2*Math.cos(a),h-t/2-t/2*Math.sin(a)));}
 // LatheGeometry expects the outward side of a profile to run bottom to top.
 const g=new THREE.LatheGeometry(rows.reverse(),48);g.userData.skirtSpec=s;return g;
}

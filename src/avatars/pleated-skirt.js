import * as THREE from '../../vendor/three.module.js';

/** Broad pressed pleats, a fitted waist and a narrow turned hem. The inner
 * surface closes the cloth edge rather than leaving a paper-thin open cone. */
export function pleatedSkirtGeometry(m,length){
 const waist=m.hips*.53,hem=m.hips*.66+length*.22,thickness=.004*m.k;
 const rows=[];
 for(let i=0;i<=8;i++){
  const t=i/8,r=THREE.MathUtils.lerp(waist,hem,t);
  rows.push(new THREE.Vector2(r,length*(.5-t)));
 }
 for(let i=8;i>=0;i--){const p=rows[i];rows.push(new THREE.Vector2(p.x-thickness,p.y));}
 rows.push(rows[0].clone());
 const g=new THREE.LatheGeometry(rows,96),P=g.attributes.position;
 const folds=[0,.2,1,1,1,1,1,.2];
 for(let i=0;i<P.count;i++){
  const t=THREE.MathUtils.clamp(.5-P.getY(i)/length,0,1);
  // Same profile on both surfaces. Pressed folds open below the waistband;
  // flat panels are much wider than the recessed crease between each pair.
  const f=1+.085*folds[Math.floor(i/rows.length)%8]*THREE.MathUtils.smoothstep(t,0,.32);
  P.setXYZ(i,P.getX(i)*f,P.getY(i),P.getZ(i)*f);
 }
 g.computeVertexNormals();return g;
}

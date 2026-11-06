/** Length 0 keeps older compact braids; 1 falls below the waist. Mesh and rig
 * use the same anchors at every length, volume and body size. */
export function longBraidPoints(m,side,hair={}){
 const R=m.Rh,t=Math.min(1,Math.max(0,hair.length||0));
 const root=m.headCentre-R*.38,short=m.chestY+m.torso*.15;
 const tip=short+(m.hipY-m.thigh*.28-short)*t;
 return [
  [side*R*.8,root,-R*.22],
  [side*R*(.79+.13*t),m.headCentre-R*1.05+(tip-short)*.4,m.depth*(.45+.3*t)],
  [side*R*(.77+.30*t),tip,m.depth*(.62+.34*t)],
 ];
}

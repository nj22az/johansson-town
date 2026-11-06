/** Retargeted from the user's PoseCraft reference onto Johansson's existing rig.
 * No fixed pelvis height: the shared foot grounder fits every character's body.
 * Degrees become bounded rig angles; faces remain independently overridable.
 */
const poses={
 HeroicPride:['Heroic pride','smug',{hips:[-4,0,0],chest:[-10,0,0],head:[-8,10,0],shoulderL:[10,-20,48],elbowL:[-95,0,-20],shoulderR:[10,20,-48],elbowR:[-95,0,20],thighL:[-6,8,14],kneeL:[8,0,0],thighR:[-6,-8,-14],kneeR:[8,0,0]}],
 VictoryStand:['Victory pose','happy',{chest:[-12,-5,-5],head:[-14,0,8],shoulderL:[-140,10,35],elbowL:[-25,0,0],shoulderR:[-145,-10,-40],elbowR:[-20,0,0],thighL:[-10,0,12],kneeL:[16,0,0],thighR:[-10,0,-12],kneeR:[16,0,0]}],
 DeepThinker:['Deep thinker','thinking',{chest:[16,10,4],head:[20,-8,-10],shoulderL:[-35,-20,25],elbowL:[-80,0,-20],shoulderR:[-65,20,-15],elbowR:[-115,0,8],thighL:[-15,0,8],kneeL:[22,0,0],thighR:[-5,0,-8],kneeR:[8,0,0]}],
 Heartbreak:['Heartbreak','sad',{chest:[30,0,0],head:[28,0,8],shoulderL:[-45,-12,30],elbowL:[-80,0,0],shoulderR:[-45,12,-30],elbowR:[-80,0,0],thighL:[-38,0,14],kneeL:[65,0,0],thighR:[-38,0,-14],kneeR:[65,0,0]}],
 BattleRage:['Battle rage','angry',{chest:[18,0,0],head:[-18,0,0],shoulderL:[-30,-20,50],elbowL:[-100,0,0],shoulderR:[-30,20,-50],elbowR:[-100,0,0],thighL:[-30,10,20],kneeL:[42,0,0],thighR:[-30,-10,-20],kneeR:[42,0,0]}],
 StartledPanic:['Startled panic','surprised',{chest:[-15,0,0],head:[10,0,-12],shoulderL:[-75,-20,50],elbowL:[-90,0,0],shoulderR:[-75,20,-50],elbowR:[-90,0,0],thighL:[8,0,14],kneeL:[25,0,0],thighR:[-20,0,-14],kneeR:[32,0,0]}],
 BashfulPose:['Shy and bashful','shy',{hips:[0,10,4],chest:[10,-12,-8],head:[18,12,18],shoulderL:[-25,-20,22],elbowL:[-85,0,-20],shoulderR:[-25,20,-22],elbowR:[-85,0,20],thighL:[-10,-12,4],kneeL:[18,0,0],thighR:[-10,12,-4],kneeR:[22,0,0]}],
 GrandGrace:['Grand grace','happy',{hips:[10,10,-8],chest:[-16,-10,8],head:[-12,12,-8],shoulderL:[-130,10,45],elbowL:[-25,0,0],shoulderR:[-65,0,-65],elbowR:[-20,0,0],thighL:[35,10,16],kneeL:[15,0,0],thighR:[-12,0,-4],kneeR:[5,0,0]}],
 Sleepwalker:['Sleepwalker','drowsy',{hips:[6,-8,6],chest:[20,10,-12],head:[12,-12,10],shoulderL:[-78,0,16],elbowL:[-12,0,0],handL:[45,0,0],shoulderR:[-72,0,-18],elbowR:[-22,0,0],handR:[48,0,0],thighL:[-20,0,8],kneeL:[30,0,0],thighR:[10,0,-8],kneeR:[20,0,0]}],
};
export const EXPRESSIVE_POSES=Object.freeze(Object.fromEntries(Object.entries(poses).map(([name,[label,face,joints]])=>[name,Object.freeze({label,face,joints:Object.freeze(Object.fromEntries(Object.entries(joints).map(([bone,angles])=>[bone,Object.freeze(angles.map(v=>v*Math.PI/180))])))})])));
export const expressiveEmotion=name=>EXPRESSIVE_POSES[name]?.face||({ChickenDance:'laugh',JellyWobble:'laugh',DramaFinish:'surprised',DiscoPoint:'happy',IdolDance:'happy',AirGuitar:'focus',RockBelt:'focus',EnkaReach:'hope',RobotDance:'dry'})[name];

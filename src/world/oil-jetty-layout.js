/** Full-scale original CAD berth off the eastern shore, clear of airport and wall. */
export const CARGO_BERTH=Object.freeze({x:42.5,y:-.56,z:-95.5,yaw:Math.PI/2,scale:1});
export const OIL_JETTY=Object.freeze({
 root:Object.freeze([44.2,-44.4]),
 shore:Object.freeze({minX:44.2,maxZ:-44.4}),
 deck:Object.freeze({minX:50.4,maxX:68.4,minZ:-145.5,maxZ:-45.5,y:1.54}),
 head:Object.freeze({minX:50.4,maxX:68.4,minZ:-145.5,maxZ:-45.5}),
 access:Object.freeze({minX:44.2,maxX:58.2,minZ:-45.5,maxZ:-43.3,fromY:.06,rampEndX:56.2}),
 depot:Object.freeze({x:39.5,z:-32.5,r:1.7,h:3.2}),
 berth:Object.freeze({x:CARGO_BERTH.x,z:CARGO_BERTH.z}),
});
/** Every third day, alongside from 08:00 to 15:00, half an hour in and out. */
export const TANKER_CALL=Object.freeze({every:3,arrive:480,leave:900,passage:30});

export function oilJettyAt(x,z,r=0){
 const D=OIL_JETTY.deck,A=OIL_JETTY.access;
 return x>=D.minX+r&&x<=D.maxX-r&&z>=D.minZ+r&&z<=D.maxZ-r||x>=A.minX&&x<=A.maxX-r&&z>=A.minZ+r&&z<=A.maxZ-r;
}

export function oilJettyHeight(x,z){
 const D=OIL_JETTY.deck,A=OIL_JETTY.access;
 if(x>=A.minX&&x<=A.maxX&&z>=A.minZ&&z<=A.maxZ){
  const t=Math.max(0,Math.min(1,(x-A.minX)/(A.rampEndX-A.minX)));
  return A.fromY+(D.y-A.fromY)*t;
 }
 if(x>=D.minX&&x<=D.maxX&&z>=D.minZ&&z<=D.maxZ)return D.y;
 return null;
}


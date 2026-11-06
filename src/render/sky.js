import * as THREE from '../../vendor/three.module.js';
import {PALETTE} from './dusk.js';

// Original low-cost cloud backdrop. One opaque draw, no fog or transparent veil.
//
// A holiday sky: deep blue overhead paling to a soft haze at the sea, a bank of fat
// cumulus sitting on the horizon all the way round, and a few small fair-weather puffs
// higher up. The clouds are painted, not simulated: a white crown, a cool blue-grey
// underside, and a lighter rim where each puff turns away from you.
export function createTownSky(scene){
 const width=1024,height=512,data=new Uint8Array(width*height*4);
 const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
 const noise=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y);let u=x-ix,v=y-iy;u=u*u*(3-2*u);v=v*v*(3-2*v);return THREE.MathUtils.lerp(THREE.MathUtils.lerp(hash(ix,iy),hash(ix+1,iy),u),THREE.MathUtils.lerp(hash(ix,iy+1),hash(ix+1,iy+1),u),v);};
 // Periodic round the horizon, so there is no seam where the texture wraps.
 const ring=(u,f,y=0)=>THREE.MathUtils.lerp(noise(u*f,y),noise((u-1)*f,y),THREE.MathUtils.smoothstep(u,.85,1));
 const fbm=(u,v,f)=>ring(u,f,v*f)*.55+ring(u,f*2.1,v*f*2.1+5)*.28+ring(u,f*4.3,v*f*4.3+11)*.17;
 // How tall the horizon bank stands at each angle: big billows on a lumpy base.
 const crown=new Float32Array(width);
 for(let x=0;x<width;x++){
  const u=x/width,big=ring(u,9,.5),billow=Math.abs(Math.sin(u*Math.PI*2*23+ring(u,5,2)*4))*.35+Math.abs(Math.sin(u*Math.PI*2*57+ring(u,7,8)*5))*.18;
  crown[x]=Math.max(0,(big-.36)*.1+billow*.022*(big>.34?1:.3));
 }
 const zenith=[54,140,228],mid=[110,186,242],haze=[214,238,250],under=[205,222,238];
 const S=THREE.MathUtils.smoothstep,lerp=THREE.MathUtils.lerp;
 for(let y=0;y<height;y++){
  const latitude=y/(height-1),h=latitude-.5;
  // Sky: deep blue high up, a clear mid blue, white-blue haze just above the sea.
  const up=S(h,0,.42),low=1-S(h,0,.07),sky=[0,1,2].map(c=>lerp(lerp(mid[c],zenith[c],up),haze[c],low));
  const band=h>-.02&&h<.38,highBand=S(h,.1,.16)*(1-S(h,.3,.37));
  for(let x=0;x<width;x++){
   const i=(y*width+x)*4;let r=sky[0],g=sky[1],b=sky[2];
   if(band&&(h<crown[x]+.012||highBand>0)){
    const u=x/width;
    // The horizon bank: a lumpy top edge, its base just above the sea line.
    const top=crown[x]+(fbm(u,h,40)-.5)*.018,inBank=S(top-h,-.002,.004)*S(h,-.004,.006);
    // Small high puffs, flattened.
    let high=0,puff=0;if(highBand>0){puff=fbm(u+.37,h*2.6,14);high=S(puff,.6,.64)*highBand;}
    const cloud=Math.max(inBank,high);
    if(cloud>0){
     // White crown, blue-grey underside; finer noise rounds each billow's light side.
     const lift=inBank>=high?Math.min(1,Math.max(0,h/Math.max(.004,top))):S(puff,.6,.8);
     const shade=Math.min(1,Math.max(0,.55+lift*.6+(ring(u+.11,90,h*90)-.5)*.3));
     r=lerp(r,lerp(under[0],255,shade),cloud);g=lerp(g,lerp(under[1],255,shade),cloud);b=lerp(b,lerp(under[2],255,shade),cloud);
    }
   }
   data[i]=Math.round(r);data[i+1]=Math.round(g);data[i+2]=Math.round(b);data[i+3]=255;
  }
 }
 const texture=new THREE.DataTexture(data,width,height,THREE.RGBAFormat);texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=texture.minFilter=THREE.LinearFilter;texture.needsUpdate=true;
 // The same painting under a grey lid, for cloudy and rainy days: the blue drained to a
 // soft blue-grey, the bank of cloud still showing a little lighter than the sky around it.
 const greyData=new Uint8Array(data.length);
 for(let i=0;i<data.length;i+=4){const l=data[i]*.3+data[i+1]*.59+data[i+2]*.11,v=Math.min(255,l*.72+62);greyData[i]=lerp(data[i],v*.95,.88);greyData[i+1]=lerp(data[i+1],v*.98,.88);greyData[i+2]=lerp(data[i+2],v*1.03,.88);greyData[i+3]=255;}
 const greyTexture=new THREE.DataTexture(greyData,width,height,THREE.RGBAFormat);greyTexture.colorSpace=THREE.SRGBColorSpace;greyTexture.magFilter=greyTexture.minFilter=THREE.LinearFilter;greyTexture.needsUpdate=true;
 const material=new THREE.MeshBasicMaterial({map:texture,side:THREE.BackSide,depthWrite:false,fog:false,toneMapped:false});
 const mesh=new THREE.Mesh(new THREE.SphereGeometry(180,48,24),material);mesh.name='Open harbour sky';mesh.renderOrder=-1000;mesh.frustumCulled=false;scene.add(mesh);
 const night=new THREE.Color(0x33465e),daylight=new THREE.Color(0xffffff),wet=new THREE.Color(0xa7b2bc);
 // The painting is already a daytime sky, so the clock's sky colour is applied relative
 // to its daytime blue: noon leaves the clouds white, dusk warms them, night darkens them.
 const noon=new THREE.Color(PALETTE.skyDay);
 return {mesh,update(camera,day,rain,inside,tint,overcast=false){mesh.visible=!inside;mesh.position.copy(camera.position);const map=rain||overcast?greyTexture:texture;if(material.map!==map){material.map=map;material.needsUpdate=true;}if(tint!=null){material.color.set(tint);material.color.r=Math.min(1.2,material.color.r/noon.r);material.color.g=Math.min(1.2,material.color.g/noon.g);material.color.b=Math.min(1.2,material.color.b/noon.b);}else{material.color.copy(night).lerp(daylight,day);if(rain)material.color.multiply(wet);}if(rain&&tint!=null)material.color.multiply(wet);}};
}

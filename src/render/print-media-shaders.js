/** Optional print/media experiments. Accepted kernels live unchanged in looks.js.
 * All patterns are deterministic. Lettering is composited later by Studio.
 */
export const RISOGRAPH_GLSL=`
float risoDot(vec2 p,float coverage,float angle){
 vec2 q=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*p/5.5;
 float d=length(fract(q)-.5),r=sqrt(clamp(coverage,0.0,1.0))*.56419;
 return (1.0-smoothstep(r-.055,r+.055,d))*step(.008,coverage);
}
void main(){
 float u=unit();vec2 p=vUv*uResolution/u;
 vec3 raw=texture2D(tDiffuse,vUv).rgb;
 vec3 paper=vec3(.985,.96,.885),warm=vec3(.86,.25,.22),cool=vec3(.12,.48,.52),key=vec3(.12,.19,.25);
 // Separate colour plates drift by about one print pixel, not the drawing or lettering.
 vec3 a=texture2D(tDiffuse,vUv+uTexel*u*vec2(1.1,.4)).rgb;
 vec3 b=texture2D(tDiffuse,vUv+uTexel*u*vec2(-.7,-.6)).rgb;
 float cold=smoothstep(-.06,.16,b.b-b.r+(b.g-b.r)*.3);
 float cover=clamp((1.0-luma(raw))/max(.1,1.0-luma(mix(warm,cool,cold))),0.0,.93);
 float red=risoDot(p+vec2(1.1,.4),cover*(1.0-cold),.26);
 float blue=risoDot(p-vec2(.7,.6),cover*cold,-.26);
 float tooth=noise(p*1.7);
 red*=.86+.14*tooth;blue*=.86+.14*tooth;
 vec3 col=paper*mix(vec3(1),warm/paper,red)*mix(vec3(1),cool/paper,blue);
 float contour=max(edges(vUv,1.5*u,.62),spotBlack(vUv,u));
 float fill=1.0-smoothstep(.075,.16,luma(a));
 col=mix(col,key,max(contour*.93,fill)*(.94+.06*tooth));
 gl_FragColor=vec4(clamp(col,0.0,1.0),1.0);
}`;

export const PENCIL_MANGA_GLSL=`
void main(){
 float u=unit();vec3 raw=texture2D(tDiffuse,vUv).rgb;float lum=luma(raw);
#ifdef HAS_DEPTH
 if(readDepth(vUv)>.999999){gl_FragColor=vec4(vec3(step(.35,lum)),1.0);return;}
#endif
 vec2 p=illustrationCoord(vUv);
 // Deliberately confined to the deepest tones: a dark shirt is not a lighting buffer.
 // This conservative fallback keeps ordinary skin and lit clothing clear of hatches.
 float shade=strokes(p,vec2(.7071,.7071),5.0)*(1.0-smoothstep(.20,.28,lum));
 shade=max(shade,strokes(p,vec2(.5,-.866),4.2)*(1.0-smoothstep(.12,.19,lum)));
 float solid=1.0-smoothstep(.055,.10,lum);
 float outline=max(edges(vUv,1.4*u,.8),spotBlack(vUv,u));
 float porous=.76+.24*noise(p*.95);
 float ink=max(solid,max(outline*porous,shade*.76));
 gl_FragColor=vec4(mix(vec3(1),vec3(.055),clamp(ink,0.0,1.0)),1.0);
}`;

export const BRUSH_OIL_GLSL=`
void main(){
 float u=unit();vec2 p=vUv*uResolution/u;vec3 raw=texture2D(tDiffuse,vUv).rgb;
 vec2 dx=vec2(uTexel.x*u*2.0,0),dy=vec2(0,uTexel.y*u*2.0);
 float gx=luma(texture2D(tDiffuse,vUv+dx).rgb)-luma(texture2D(tDiffuse,vUv-dx).rgb);
 float gy=luma(texture2D(tDiffuse,vUv+dy).rgb)-luma(texture2D(tDiffuse,vUv-dy).rgb);
 // Strokes follow local colour boundaries and the projected surface normal.
 vec2 flow=vec2(-gy,gx);
#ifdef HAS_NORMALS
 vec4 n=texture2D(tNormal,vUv);flow+=vec2(-(n.g*2.0-1.0),n.r*2.0-1.0)*n.a*.16;
#endif
 float angle=length(flow)>.002?atan(flow.y,flow.x):.42;
 vec2 along=vec2(cos(angle),sin(angle)),across=vec2(-along.y,along.x);
 mat2 brush=mat2(along*1.4,across*.7);
 // Both qualities cover the same broad footprint; only sample density differs.
#ifdef LIGHT
 const int R=1;const float STEP=3.0;const float N=4.0;
#else
 const int R=3;const float STEP=1.0;const float N=16.0;
#endif
 vec3 m[4];vec3 sq[4];
 for(int k=0;k<4;k++){m[k]=vec3(0);sq[k]=vec3(0);}
 for(int j=0;j<=R;j++)for(int i=0;i<=R;i++){
  vec2 d=(vec2(float(i),float(j))*STEP+.25)*4.0*u;
  for(int k=0;k<4;k++){
   vec2 side=k==0?vec2(-d.x,-d.y):k==1?vec2(d.x,-d.y):k==2?d:vec2(-d.x,d.y);
   vec2 uv=clamp(vUv+brush*side*uTexel,uTexel,vec2(1)-uTexel);
   vec3 c=texture2D(tDiffuse,uv).rgb;
#ifdef HAS_DEPTH
   // Do not pull the wall across a face silhouette.
   float gap=abs(viewDepth(uv)-viewDepth(vUv));c=mix(c,raw,smoothstep(.12,.45,gap));
#endif
   m[k]+=c;sq[k]+=c*c;
  }
 }
 vec3 col=raw;float best=1e9;
 for(int k=0;k<4;k++){vec3 mean=m[k]/N;vec3 variance=abs(sq[k]/N-mean*mean);float score=dot(variance,vec3(1));if(score<best){best=score;col=mean;}}
 // Broad colour dabs remain visible on cheeks; only high-contrast small features return.
 float detail=abs(luma(raw)-luma(col));
 float feature=smoothstep(.16,.34,detail)*(1.0-smoothstep(.28,.48,luma(raw)));
 col=mix(col,raw,feature);
 vec2 q=vec2(dot(p,along),dot(p,across));
 float bristle=noise(vec2(q.x*.035,q.y*.33));
 col*=1.0+(bristle-.5)*.085;
 float ridge=clamp(length(fwidth(col))*2.5,0.0,1.0);col+=col*.05*ridge;
 float ink=max(edges(vUv,1.35*u,.46)*.78,spotBlack(vUv,u));
 col=mix(col,vec3(.13,.095,.08),clamp(ink,0.0,1.0));
 gl_FragColor=vec4(clamp(col,0.0,1.0),1.0);
}`;

export const RUBBER_STAMP_GLSL=`
void main(){
 float u=unit();vec2 p=vUv*uResolution/u;vec3 raw=texture2D(tDiffuse,vUv).rgb;
 vec3 paper=vec3(.985,.965,.90),ink=vec3(.49,.09,.16);
 // Solid cut shapes and broad outlines; irregular pressure and sparse pinholes,
 // rather than another halftone screen. Fine facial marks remain protected.
 float pressure=.035*(noise(p*.025)-.5);
 float fill=1.0-smoothstep(.40+pressure,.46+pressure,luma(raw));
 float edge=edges(vUv,2.1*u,.72),feature=spotBlack(vUv,u);
 float pores=smoothstep(.68,.83,noise(p*1.8));
 float deposit=max(fill,edge)*(.84+.16*noise(p*.14));
 deposit*=1.0-pores*.82;deposit=max(deposit,feature*.97);
 gl_FragColor=vec4(mix(paper,ink,clamp(deposit,0.0,1.0)),1.0);
}`;

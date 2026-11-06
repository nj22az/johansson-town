/** Reusable wash and pencil stages for Architectural sketchbook. */
export const PENCIL_GLSL=`float strokes(vec2 p,vec2 dir,float spacing){
 float along=dot(p,vec2(-dir.y,dir.x));
 float across=dot(p,dir)+noise(vec2(along*0.02,dot(p,dir)*0.05))*4.0;
 float lane=floor(across/spacing);
 // Each stroke has its own pressure, and fades in and out along its length.
 float pressure=0.55+0.45*hash(vec2(lane,7.0));
 float body=1.0-abs(fract(across/spacing)-0.5)*2.0;
 float segment=floor(along/28.0+hash(vec2(lane,11.0)));
 float phase=fract(along/28.0+hash(vec2(lane,11.0)));
 float run=smoothstep(.03,.16,phase)*(1.0-smoothstep(.68,.94,phase));
 float wax=smoothstep(.17,.67,noise(p*2.4+hash(vec2(lane,segment))*7.0));
 return smoothstep(0.15,0.75,body)*pressure*run*mix(.22,1.0,wax);
}`;
export const WASH_GLSL=`
vec3 paperWash(vec3 c,float strength){vec3 paper=vec3(.98,.96,.91);float chroma=max(c.r,max(c.g,c.b))-min(c.r,min(c.g,c.b));float deposit=mix(.20,.78,smoothstep(.035,.20,chroma));deposit=max(deposit,(1.0-smoothstep(.48,.9,luma(c)))*.70);return mix(paper,c,deposit*strength);}
vec3 wetEdge(vec3 paint,vec2 uv){float rim=edges(uv,1.1*unit(),.20);return paint*(1.0-.10*clamp(rim,0.0,1.0));}
`;
export const SURFACE_GLSL=`
vec2 illustrationCoord(vec2 uv){vec2 p=uv*uResolution/unit();
#ifdef HAS_DEPTH
 if(readDepth(uv)<.999999){vec3 position=surfacePosition(uv);vec3 n=vec3(0,0,1);
#ifdef HAS_NORMALS
 n=abs((uCameraWorld*vec4(texture2D(tNormal,uv).rgb*2.0-1.0,0)).xyz);
#endif
 p=(n.z>n.x&&n.z>n.y?position.xy:n.y>n.x?position.xz:position.zy)*150.0;}
#endif
 return p;}
float pencilShade(vec2 p,float light){float primary=strokes(p,vec2(.7071,.7071),4.0)*(1.0-smoothstep(.62,.75,light));float crossed=strokes(p,vec2(.5,-.866),3.5)*(1.0-smoothstep(.32,.45,light));return max(primary,crossed);}
`;

import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
// The Meshy audit for the kissaten in the shut Higa Liquor (briefs/higa-kissaten/): the same props twice in the real
// shop room, once as the Meshy models (art/kissaten/meshy/) and once drawn in code with the kit's primitives, so the
// two can be judged in World's own light and ink. Built like fish-market-photos.mjs: the real createTown scene, the
// cel and ink passes, no simulation, swiftshader in a cloud session. The shutter is lifted and the tubes lit for the
// photographs only; the room is still the liquor shop's (its counter, shelves and jars), not yet redressed.
// The siphon and the morning set are code in both sets: Meshy's attempts failed at the shape stage (as did a table
// fortune machine, not shown).
//   node tools/kissaten-meshy-look.mjs [out-dir] [repo-root]
const out=resolve(process.argv[2]||'docs/qa/kissaten-meshy'),root=resolve(process.argv[3]||'..');
await mkdir(out,{recursive:true});
const port=8700+Math.floor(Math.random()*90);
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1','--directory',root],{stdio:'ignore'});
await new Promise(r=>setTimeout(r,800));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:900,height:600},deviceScaleFactor:1});page.setDefaultTimeout(1200000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${port}/404-qa`);await page.setContent('<style>body{margin:0}canvas{display:block}</style><canvas id="photo"></canvas>');
 const stats=await page.evaluate(async()=>{
  const base='/johansson-town/',T=await import(base+'vendor/three.module.js');
  const {GLTFLoader}=await import(base+'vendor/GLTFLoader.js');
  const {createTown}=await import(base+'src/world/town.js');
  const {createBusinesses}=await import(base+'src/world/businesses.js');
  const {createCelPass}=await import(base+'src/render/cel.js');
  const {createInkPipeline}=await import(base+'src/render/ink-pipeline.js');
  const {clock:duskClock}=await import(base+'src/render/dusk.js');
  const {atmosphere}=await import(base+'src/render/atmosphere.js');
  const {tickOcean}=await import(base+'src/world/ocean.js');
  const {HIGA_FRAME}=await import(base+'src/world/okinawa/higa-liquor-dressing.js');
  const scene=new T.Scene();
  const world=createTown({scene,sites:createBusinesses(),townMode:'peninsula',kitano:'distant',shadows:false,mobile:true,register(){},enter(){},onAction(){},getPlayerPosition:()=>new T.Vector3(30,0,30)});
  // The shop open for the photograph: the shutter up, the door leaves aside, the tubes on.
  const higa=world.quarters.higa;higa.shutter.visible=false;for(const l of higa.leaves)l.visible=false;higa.lights.emissiveIntensity=1;
  const renderer=new T.WebGLRenderer({canvas:document.querySelector('canvas'),antialias:true});renderer.setSize(900,600);renderer.setPixelRatio(1);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  const camera=new T.PerspectiveCamera(50,900/600,.05,400);
  const ambient=new T.HemisphereLight(0xdbe7f2,0x6b5f8c,1.15);scene.add(ambient);
  const bounce=new T.DirectionalLight(0x9db6e8,1.25);scene.add(bounce);
  const sun=new T.DirectionalLight(0xffdca8,2.3);sun.castShadow=true;scene.add(sun,sun.target);
  Object.assign(sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,near:.5,far:160});sun.shadow.mapSize.set(2048,2048);sun.shadow.normalBias=.035;

  // The shop-house frame: x along the frontage (+x the police-station side), z out to Main Street, y up.
  const frame=()=>{const g=new T.Group();g.position.set(HIGA_FRAME.origin[0],0,HIGA_FRAME.origin[1]);g.rotation.y=-Math.PI/2;scene.add(g);return g;};
  // The fitted interior stands on the 8 cm shop floor (houses.js shopHouse lifts it by `floor`): the counter top is at floor+.95.
  const F=HIGA_FRAME.floor,TOP=F+.95;
  const std=(hex,o={})=>new T.MeshStandardMaterial({color:hex,roughness:.8,...o});
  const mesh=(geometry,material,x,y,z,parent,{rx=0,ry=0,rz=0,sx=1,sy=1,sz=1}={})=>{const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.scale.set(sx,sy,sz);parent.add(m);return m;};
  const glass=()=>new T.MeshStandardMaterial({color:0xdfeff2,transparent:true,opacity:.35,roughness:.1,metalness:0,depthWrite:false});
  const lathe=(pts,seg=20)=>new T.LatheGeometry(pts.map(([r,y])=>new T.Vector2(r,y)),seg);

  // ── The code versions, each drawn as the kit draws: primitives at real size, flat colours. ──
  const CODE={
   'record-player':()=>{const g=new T.Group(),teak=std(0xc98a46),cream=std(0xeadfc4);
    mesh(new T.BoxGeometry(.42,.11,.32),teak,0,.055,0,g);mesh(new T.BoxGeometry(.39,.006,.29),cream,0,.113,0,g);
    mesh(new T.CylinderGeometry(.13,.13,.012,28),std(0x3a3d40,{metalness:.4}),-.05,.122,0,g);
    mesh(new T.CylinderGeometry(.122,.122,.006,28),std(0x111111),-.05,.131,0,g);mesh(new T.CylinderGeometry(.04,.04,.007,20),std(0xb8302a),-.05,.132,0,g);
    mesh(new T.CylinderGeometry(.006,.006,.2,6),std(0xc8cccf,{metalness:.6}),.12,.14,.02,g,{rx:Math.PI/2,rz:.35});
    const lid=new T.Group();lid.position.set(0,.11,-.16);lid.rotation.x=-1.75;g.add(lid);mesh(new T.BoxGeometry(.42,.32,.02),teak,0,.16,-.01,lid);mesh(new T.BoxGeometry(.39,.29,.004),cream,0,.16,.002,lid);
    for(const x of [-.09,.09])mesh(new T.CylinderGeometry(.022,.022,.02,14),std(0x222222),x,.055,.165,g,{rx:Math.PI/2});return g;},
   'bentwood-chair':()=>{const g=new T.Group(),wood=std(0x5a3a24),cane=std(0xe0c36a);
    mesh(new T.CylinderGeometry(.2,.2,.035,24),cane,0,.45,0,g);mesh(new T.TorusGeometry(.2,.012,6,24),wood,0,.45,0,g,{rx:Math.PI/2});
    for(const [x,z] of [[.14,.14],[-.14,.14]])mesh(new T.CylinderGeometry(.014,.017,.45,8),wood,x*1.08,.225,z*1.08,g,{rz:-x*.18,rx:z*.18});
    for(const x of [.12,-.12]){const c=new T.CatmullRomCurve3([new T.Vector3(x*1.1,0,-.17),new T.Vector3(x,.45,-.15),new T.Vector3(x*.9,.7,-.2),new T.Vector3(x*.75,.9,-.24)]);mesh(new T.TubeGeometry(c,16,.014,6),wood,0,0,0,g);}
    mesh(new T.TorusGeometry(.15,.012,6,24),wood,0,.24,0,g,{rx:Math.PI/2});mesh(new T.TorusGeometry(.1,.011,6,24),wood,0,.72,-.21,g,{sy:1.25,rx:-.2});return g;},
   'counter-stool':()=>{const g=new T.Group(),chrome=std(0xd5d9dc,{metalness:.7,roughness:.3});
    mesh(new T.CylinderGeometry(.2,.21,.03,24),chrome,0,.015,0,g);mesh(new T.CylinderGeometry(.028,.028,.62,12),chrome,0,.33,0,g);
    mesh(new T.TorusGeometry(.16,.012,6,24),chrome,0,.3,0,g,{rx:Math.PI/2});mesh(new T.CylinderGeometry(.18,.17,.08,24),std(0xa3202a),0,.68,0,g);return g;},
   'cup-saucer':()=>{const g=new T.Group(),white=std(0xf6f4ee,{roughness:.4});
    mesh(lathe([[0,0],[.06,0],[.07,.012],[.072,.016]]),white,0,0,0,g);mesh(lathe([[0,.012],[.03,.012],[.04,.03],[.042,.07],[.04,.07],[.038,.03],[0,.03]]),white,0,0,0,g);
    mesh(new T.CircleGeometry(.038,20),std(0x2a1a10),0,.064,0,g,{rx:-Math.PI/2});mesh(new T.TorusGeometry(.016,.004,6,12,Math.PI*1.3),white,.047,.045,0,g,{rz:-Math.PI*.65});
    mesh(new T.BoxGeometry(.075,.003,.01),std(0xc8cccf,{metalness:.6}),.03,.016,.045,g,{ry:.4});return g;},
   'hand-grinder':()=>{const g=new T.Group(),wood=std(0x5a3422),brass=std(0xc9a24a,{metalness:.6,roughness:.4});
    mesh(new T.BoxGeometry(.11,.1,.11),wood,0,.05,0,g);mesh(new T.BoxGeometry(.08,.035,.005),std(0x4a2a1a),0,.03,.056,g);mesh(new T.SphereGeometry(.008,8,6),std(0xe0c890),0,.03,.062,g);
    mesh(new T.SphereGeometry(.05,16,8,0,Math.PI*2,0,Math.PI/2),brass,0,.1,0,g,{rx:Math.PI});mesh(new T.CylinderGeometry(.052,.052,.012,16),brass,0,.106,0,g);
    mesh(new T.CylinderGeometry(.004,.004,.1,6),std(0x222222),.05,.14,0,g,{rz:Math.PI/2});mesh(new T.CylinderGeometry(.006,.006,.05,6),std(0x222222),0,.125,0,g);
    mesh(new T.SphereGeometry(.014,10,8),std(0xd8b080),.1,.16,0,g);return g;},
   'drip-kettle':()=>{const g=new T.Group(),white=std(0xf2f1ec,{roughness:.35});
    mesh(lathe([[0,0],[.06,0],[.068,.04],[.062,.1],[.04,.12],[0,.125]]),white,0,0,0,g);mesh(new T.CylinderGeometry(.008,.012,.02,8),std(0x222222),0,.135,0,g);
    const spout=new T.CatmullRomCurve3([new T.Vector3(-.05,.02,0),new T.Vector3(-.09,.05,0),new T.Vector3(-.11,.12,0),new T.Vector3(-.15,.14,0)]);mesh(new T.TubeGeometry(spout,12,.006,6),white,0,0,0,g);
    mesh(new T.TorusGeometry(.035,.008,6,12,Math.PI*1.2),std(0x222222),.07,.08,0,g,{rz:-Math.PI*.6});return g;},
  };
  // Code in both sets: the siphon (glass) and the morning set (Meshy's shapes failed).
  const siphon=()=>{const g=new T.Group(),chrome=std(0xd5d9dc,{metalness:.7,roughness:.3});
   mesh(new T.CylinderGeometry(.06,.065,.012,20),chrome,0,.006,0,g);mesh(new T.CylinderGeometry(.005,.005,.3,6),chrome,-.06,.15,0,g);mesh(new T.TorusGeometry(.05,.004,6,20),chrome,0,.15,0,g,{rx:Math.PI/2});
   mesh(new T.SphereGeometry(.055,20,14),glass(),0,.12,0,g);mesh(new T.SphereGeometry(.045,16,10,0,Math.PI*2,Math.PI*.45,Math.PI*.55),std(0x2a1a10),0,.12,0,g);
   mesh(lathe([[.008,0],[.02,.06],[.05,.13],[.055,.16],[.052,.16]]),glass(),0,.17,0,g);mesh(new T.CylinderGeometry(.006,.006,.12,6),glass(),0,.13,0,g);
   mesh(new T.CylinderGeometry(.025,.03,.045,14),glass(),0,.03,0,g);mesh(new T.ConeGeometry(.008,.02,8),std(0x6aa7ff,{emissive:0x3a6aff,emissiveIntensity:.8}),0,.065,0,g);return g;};
  const morningSet=()=>{const g=new T.Group(),white=std(0xf6f4ee,{roughness:.4});
   mesh(new T.CylinderGeometry(.09,.07,.012,24),white,0,.006,0,g);
   for(const s of [-1,1])mesh(new T.BoxGeometry(.055,.04,.1),std(0xd9a24e),s*.031-.02,.032,0,g,{ry:s*.06});mesh(new T.BoxGeometry(.03,.004,.02),std(0xf2df8a),-.02,.054,0,g);
   mesh(new T.CylinderGeometry(.018,.014,.03,14),white,.05,.027,.02,g);mesh(new T.SphereGeometry(.02,14,10),std(0xfbf6ea),.05,.055,.02,g,{sy:1.3});return g;};
  // The table for two the plan puts by the window, and a cabinet for the record player: code in both sets.
  const furniture=()=>{const g=frame(),wood=std(0x6e4b30);
   mesh(new T.CylinderGeometry(.32,.32,.03,24),std(0x8a6641),.95,F+.72,2.1,g);mesh(new T.CylinderGeometry(.03,.03,.7,10),wood,.95,F+.36,2.1,g);mesh(new T.CylinderGeometry(.2,.22,.02,20),wood,.95,F+.01,2.1,g);
   mesh(new T.BoxGeometry(.4,.62,.48),wood,1.82,F+.31,.45,g);return g;};

  const loader=new GLTFLoader(),models={},stats={};
  for(const id of Object.keys(CODE)){
   const gltf=await loader.loadAsync(base+'art/kissaten/meshy/'+id+'.glb');models[id]=gltf.scene;
   let tris=0;gltf.scene.traverse(o=>{if(o.isMesh)tris+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;});stats[id]={tris};
  }
  // Fit an object to a real size: `h` its height, or `w` its widest plan side; stood on its own base.
  const fit=(obj,{h,w})=>{const box=new T.Box3().setFromObject(obj),size=box.getSize(new T.Vector3());const s=h?h/size.y:w/Math.max(size.x,size.z);
   obj.scale.multiplyScalar(s);const b2=new T.Box3().setFromObject(obj),c=b2.getCenter(new T.Vector3());const holder=new T.Group();obj.position.sub(new T.Vector3(c.x,b2.min.y,c.z));holder.add(obj);return holder;};
  const SIZE={'record-player':{w:.42},'bentwood-chair':{h:.86},'counter-stool':{h:.72},'cup-saucer':{w:.14},'hand-grinder':{h:.2},'drip-kettle':{h:.17}};
  // Where each stands in the shop frame, and which way it faces (yaw about y; 0 faces Main Street, +z).
  const PLACE=[
   ['drip-kettle',-1.93,TOP,-.22,0],['hand-grinder',-1.3,TOP,-.24,0],['cup-saucer',-.95,TOP,-.24,.3],['cup-saucer',-.36,TOP,-.24,-.2],
   ['counter-stool',-1.55,F,.16,0],['counter-stool',-.95,F,.16,0],['counter-stool',-.35,F,.16,0],
   ['bentwood-chair',.95,F,1.5,0],['bentwood-chair',.95,F,2.72,Math.PI],
   ['record-player',1.8,F+.62,.45,-Math.PI/2],
  ];
  const sets={};
  for(const kind of ['meshy','code']){
   const g=frame();
   for(const [id,x,y,z,ry] of PLACE){const src=kind==='meshy'?models[id].clone(true):CODE[id]();const o=fit(src,SIZE[id]);o.position.set(x,y,z);o.rotation.y=ry;g.add(o);}
   const s=siphon();s.position.set(-1.62,TOP,-.24);g.add(s);const m=morningSet();m.position.set(-.67,TOP,-.36);g.add(m);
   const t=morningSet();t.position.set(.85,F+.735,2.25);g.add(t);const c=fit(kind==='meshy'?models['cup-saucer'].clone(true):CODE['cup-saucer'](),SIZE['cup-saucer']);c.position.set(1.05,F+.735,1.95);g.add(c);
   sets[kind]=g;g.visible=false;
  }
  furniture();
  const cel=createCelPass();cel.apply(scene);
  const ink=createInkPipeline(renderer,{superScale:1,samples:2,preferHalfFloat:true,fxaa:true});ink.setCamera(camera);
  const local=(x,y,z)=>[HIGA_FRAME.origin[0]-z,y,HIGA_FRAME.origin[1]+x];
  window.capture=({kind,pos,at,m})=>{
   for(const [k,g] of Object.entries(sets))g.visible=k===kind;
   world.updateHours?.(m);tickOcean(12.5);higa.shutter.visible=false;higa.lights.emissiveIntensity=1;
   const c=duskClock(m,{rain:false}),air=atmosphere(c.day,false,false,m);scene.background=new T.Color(air.sky);scene.fog=air.fog;
   ambient.intensity=air.ambient*1.35;ambient.color.set(c.skyFill);ambient.groundColor.set(c.groundFill);
   const P=local(...pos),A=local(...at),fx=(P[0]+A[0])/2,fz=(P[2]+A[2])/2;
   sun.intensity=c.sunIntensity;sun.color.set(c.sun);sun.position.set(fx+c.sunDirection.x*60,c.sunDirection.y*60,fz+c.sunDirection.z*60);sun.target.position.set(fx,0,fz);sun.target.updateMatrixWorld();
   bounce.position.set(-c.sunDirection.x*30,16,-c.sunDirection.z*30);bounce.intensity=c.bounce;ink.setExposure(air.exposure*1.04);
   camera.position.set(...P);camera.lookAt(...A);camera.updateMatrixWorld();cel.apply(scene);ink.render(()=>renderer.render(scene,camera));
  };
  return stats;
 });
 const MORNING=8*60;
 // Lenses in the shop frame (x along the front, y up, z out to the street).
 const shots=[
  ['01-room-from-door',[.9,1.55,3.15],[-.7,.75,-.2]],
  ['02-counter-close',[-.85,1.32,.85],[-.95,.98,-.28]],
  ['03-table-and-player',[-1.2,1.35,2.4],[1.5,.6,1.1]],
  ['04-from-street',[.2,1.6,5.6],[-.4,.9,.4]],
 ];
 for(const [name,pos,at] of shots)for(const kind of ['meshy','code']){
  await page.evaluate(v=>window.capture(v),{kind,pos,at,m:MORNING});await page.locator('canvas').screenshot({path:`${out}/${name}-${kind}.jpg`,type:'jpeg',quality:88});console.log('wrote',name,kind);
 }
 await writeFile(`${out}/report.json`,JSON.stringify({viewport:[900,600],time:'08:00',physicalDevice:false,meshyTriangles:stats,
  scope:'The shut Higa Liquor with its shutter lifted and tubes lit for the photographs only; static createTown scene with cel and ink passes; the room still dressed as the liquor shop',errors},null,2)+'\n');
 if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close();server.kill();}

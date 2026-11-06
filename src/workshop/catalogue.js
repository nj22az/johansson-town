// The workshop uses the same five recipes as Form 3D Studio. Prices are town yen.
export const WORKSHOP_MODELS=Object.freeze([
 {id:'cable-ring',type:'cableRing',name:'Johansson cable ring',material:40,price:120,seconds:8,colour:0xc7dbcf,description:'A slotted ring for keeping workshop cables together.',parameters:{ringOuterDiameter:115,ringInnerDiameter:40,ringHeight:18,ringTray:true,ringTrayWidth:10}},
 {id:'pencil-capsule',type:'applePencilCase',name:'Johansson pencil capsule',material:100,price:280,seconds:16,colour:0xe6e2d6,description:'A slim two-piece capsule with the raised Johansson mark.',parameters:{pencilLength:166,pencilDiameter:8.9,pencilClearance:.4,pencilWall:1.2,pencilCapClearance:.7,pencilEndProtection:7,pencilLogo:true,pencilPrintLayout:false}},
 {id:'spur-gear',type:'spurGear',name:'Involute spur gear',material:60,price:180,seconds:10,colour:0xd3a75e,description:'A working pattern with twenty-four involute teeth and a central bore.',parameters:{gearTeeth:24,gearModule:1.25,gearThickness:6,gearBore:5}},
 {id:'hex-bolt',type:'hexBolt',name:'Threaded hex bolt',material:30,price:100,seconds:8,colour:0x8cabb8,description:'A coarse threaded bolt with a hexagonal head.',parameters:{boltDiameter:8,boltLength:25}},
 {id:'l-bracket',type:'lBracket',name:'Reinforced L-bracket',material:80,price:220,seconds:12,colour:0xbe7770,description:'A four-hole angle bracket with twin reinforcing gussets.',parameters:{bracketWidth:40,bracketHeight:40,bracketLeg:35,bracketThickness:4,bracketHole:5}},
].map(model=>Object.freeze({...model,parameters:Object.freeze(model.parameters)})));
export const workshopModel=id=>WORKSHOP_MODELS.find(model=>model.id===id);
export const printedModels=inventory=>WORKSHOP_MODELS.filter(model=>inventory.includes(model.name));
export function modelTicket(model){return [
 '1. Materials: ¥'+model.material,
 '2. Thuan’s buying price: ¥'+model.price,
 '3. Earnings: ¥'+model.price+' − ¥'+model.material+' = ¥'+(model.price-model.material),
 '4. Machine time: '+model.seconds+' seconds while you explore.',
].join('\n');}

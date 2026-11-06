import * as THREE from '../../vendor/three.module.js';
import {FOOD_ART} from '../commerce/food-art.js';
const textures=new Map();
/** A billboard cutout gives prepared food its original illustration from every seat. */
export function attachFoodCutout(prop,kind){
 if(!FOOD_ART[kind]||typeof Image==='undefined')return;
 const fallback=new THREE.Group();fallback.name='Food geometry fallback';for(const child of [...prop.children])fallback.add(child);prop.add(fallback);
 const material=new THREE.SpriteMaterial({transparent:true,alphaTest:.02,depthWrite:false});
 const sprite=new THREE.Sprite(material);sprite.name='Original '+kind+' food cutout';sprite.scale.set(.25,.25,1);sprite.position.y=.105;sprite.visible=false;prop.add(sprite);
 const u=prop.userData;u.foodCutout={sprite,fallback,ready:false};
 const apply=texture=>{if(!sprite.parent)return;material.map=texture;material.needsUpdate=true;u.foodCutout.ready=true;fallback.visible=false;sprite.visible=true;};
 const old=textures.get(kind);if(old){old.then(apply);return;}
 const pending=new Promise(resolve=>new THREE.TextureLoader().load(FOOD_ART[kind],texture=>{texture.colorSpace=THREE.SRGBColorSpace;resolve(texture);},undefined,()=>{}));textures.set(kind,pending);pending.then(apply);
}
export function updateFoodCutout(prop){const u=prop.userData,a=u.foodCutout;if(!a?.ready)return;const p=u.portion??1;a.sprite.visible=p>0;a.sprite.material.opacity=Math.min(1,p*1.8);const size=.25*(.65+.35*p);a.sprite.scale.set(size,size,1);a.fallback.visible=p===0;}

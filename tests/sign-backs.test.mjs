import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {signPlate,SIGN_PLATE} from '../src/world/sign-plate.js';

/**
 * No lettered sign in the street is a single plane drawn on both sides, which reads mirrored from behind: the owner,
 * 20 October 2026, of the guide sign at the Kitano Road junction. A plate has a back (sign-plate.js); only cloth that is
 * dyed through (a noren, a flag, a hanging banner) may show its picture reversed from behind.
 */
installDOM();globalThis.self=globalThis;
const {createTown}=await import('../src/world/town.js');
const {createIslandBusinesses}=await import('../src/world/businesses.js');
const world=createTown({scene:new THREE.Scene(),sites:createIslandBusinesses(),mobile:true,kitano:'distant',shadows:false,register(){},enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});

// Dyed cloth reads reversed from behind, as it does in the street; the rest are no lettering at all (a block screen's
// pattern, frosted glass) or a paper pinned flat to a board, whose back is the board.
const CLOTH=/noren|flag|banner|curtain|nobori|laundry|washing/i,NOT_A_SIGN=/^(School boundary wall|Power compound fence|Umi-no-yu frosted door glass)$|flyer/;
test('lettered planes in the street have a back: no sign reads mirrored from behind',()=>{
 const mirrored=[];
 world.group.traverse(o=>{
  if(!o.isMesh||Array.isArray(o.material)||!o.material.map||o.material.side!==THREE.DoubleSide)return;
  if(o.geometry.type!=='PlaneGeometry'||o.material.transparent&&o.material.depthWrite===false)return;   // decals on the ground
  if(CLOTH.test(o.name)||CLOTH.test(o.parent?.name||'')||NOT_A_SIGN.test(o.name)||o.userData.banner)return;
  mirrored.push(o.name||'(unnamed plane)');
 });
 assert.deepEqual(mirrored,[]);
 const junction=[];world.group.traverse(o=>{if(/^Sign: East lawn/.test(o.name))junction.push(o);});
 assert.equal(junction.length,1,'the junction’s guide sign is there');
 const [sign]=junction;assert.ok(Array.isArray(sign.material)&&sign.material[4].map&&!sign.material[5].map,'lettered on the front, plain metal on the back');
});

test('a sign plate is lettered on its front and plain on its back and edges',()=>{
 const face=new THREE.MeshStandardMaterial({map:new THREE.Texture()}),m=signPlate(face,1.5,.6);
 assert.equal(m.material[4],face);assert.equal(m.material[5].map,null);assert.equal(m.material[5].color.getHex(),SIGN_PLATE.back);
 assert.ok(m.geometry.parameters.depth>0);
});

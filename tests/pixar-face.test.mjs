import test from 'node:test';
import assert from 'node:assert/strict';
import {recipeFace,recipeEye} from '../src/avatars/pixar-face.js';

const card={eyes:{rx:12.5,ry:10.5,iris:8.75,lash:3.8,flick:3.2,lashes:0},
 brows:{colour:'#1c1714',left:{x0:-4,x1:20,line:[-.005,-.24,25],half:[-.013,.088,4.3]},right:{x0:-1,x1:20,line:[0,-.36,26],half:[-.013,.08,4.4]}},
 mouth:{half:16,line:[0,0,.003,0,.2],upper:[0,0,-.003,0,2.1],lower:[0,0,-.0045,0,2.9],lip:'#eda194',ink:'#ef9f92'}};
const at=(c,x)=>c[0]*x*x+c[1]*x+c[2];

test('a clone face follows the creator: the eye style shapes the modelled eye, inside its disc',()=>{
 const narrow=recipeEye(card.eyes,{style:'narrow'}),doe=recipeEye(card.eyes,{style:'doe',size:1});
 assert.ok(narrow.ry<card.eyes.ry*.8&&narrow.cut>0);
 assert.ok(doe.ry<=card.eyes.ry*1.12+1e-9&&doe.rx<=card.eyes.rx*1.1+1e-9&&doe.iris<=doe.rx*.78+1e-9);
 assert.equal(recipeEye(card.eyes,{style:'cat'}).shape,'almond');
 assert.equal(recipeEye(card.eyes,{style:'droopy'}).slant,-.43);
});

test('the brows: arched lifts the middle and keeps the ends, worried lifts the inner end, none has none',()=>{
 const plain=recipeFace(card,{brows:{style:'thick',size:.5}}).brows.left,arch=recipeFace(card,{brows:{style:'arched',size:.5}}).brows.left;
 const m=(plain.x0+plain.x1)/2;
 assert.ok(at(arch.line,m)-at(plain.line,m)>3);
 assert.ok(Math.abs(at(arch.line,plain.x0)-at(plain.line,plain.x0))<1e-6&&Math.abs(at(arch.line,plain.x1)-at(plain.line,plain.x1))<1e-6);
 const worried=recipeFace(card,{brows:{style:'worried',size:.5}}).brows.left;
 assert.ok(at(worried.line,worried.x0)>at(card.brows.left.line,worried.x0));
 assert.ok(plain.half[2]>card.brows.left.half[2]*1.4);
 assert.equal(recipeFace(card,{brows:{style:'none'}}).brows,null);
 assert.equal(recipeFace(card,{brows:{style:'bushy'}}).bushy,1);
});

test('the mouth rests as the recipe says, and its width stays on its decal',()=>{
 assert.ok(recipeFace(card,{mouth:{style:'grin'}}).mouthBase.smile>1);
 assert.ok(recipeFace(card,{mouth:{style:'flat'}}).mouthBase.smile<0);
 const wide=recipeFace(card,{mouth:{style:'wide',size:1,width:1}}).mouth;
 assert.ok(wide.half<=card.mouth.half*1.15+1e-9&&wide.half>card.mouth.half);
});

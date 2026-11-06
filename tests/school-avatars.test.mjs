import test from 'node:test';
import assert from 'node:assert/strict';
import {installDOM} from './fixtures.mjs';
import {buildFigure,setPose,animateFigure,pupilRecipe,TEACHER_RECIPE} from '../src/people/school-avatars.js';
import {measure} from '../src/avatars/build.js';

test('the class are Shimanchu: children smaller than their teacher, each with their own face',()=>{
 installDOM();
 const yui=pupilRecipe({name:'金城 ゆい',girl:true}),kenta=pupilRecipe({name:'比嘉 けんた'});
 assert.notDeepEqual(yui.face??yui.eyes,kenta.face??kenta.eyes);
 assert.ok(measure(yui).H<measure(TEACHER_RECIPE).H,'children are shorter than Miss Higa');
 assert.equal(pupilRecipe({name:'x',smock:true}).outfit.top,'smock');
 const f=buildFigure({name:'金城 ゆい',girl:true});assert.ok(f.getObjectByName('Shimanchu body'));
 setPose(f,'eat');animateFigure(f,0);animateFigure(f,.1);assert.equal(f.userData.figure.pose,'eat');
});

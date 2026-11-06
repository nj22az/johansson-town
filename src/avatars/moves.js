import {MUSIC_MOVES} from './music-moves.js';
import {EXPRESSIVE_POSES} from './expressive-poses.js';
/** Shared actions available to every avatar, in the order the moves menu lists them. */
export const MOVES=Object.freeze([
 ['Wave','Wave'],['Bow','Bow'],['Nod','Nod'],['HeadShake','Shake your head'],['Point','Point'],
 ['Shrug','Shrug'],['Clap','Clap'],['Laugh','Laugh'],['Think','Think it over'],['LookAround','Look around'],
 ['Stretch','Stretch'],['Talk','Chat with your hands'],['Kachashi','Kachāshī dance'],['Crouch','Squat on your heels'],
 ['PickUp','Pick something up'],['Fist','Make a fist'],
 ['Heart','Make a heart'],['Peace','Hand by the cheek'],['Coy','Coy look'],['Tada','Ta-da!'],['HandsOnHips','Hands on hips'],['HeelKick','Kick up a heel'],['CheekRest','Hand on cheek'],['DoubleCheek','Both hands on cheeks'],
 ['Sing','Sing into a microphone'],...MUSIC_MOVES,...Object.entries(EXPRESSIVE_POSES).map(([name,p])=>[name,p.label])
]);

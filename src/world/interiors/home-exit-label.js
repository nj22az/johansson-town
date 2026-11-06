import {YARD_HOMES} from '../yard-homes-layout.js';

/** Name the neighbourhood outside the current house, including relocated homes. */
export function homeExitLabel(site,profile){
 const address=profile?.homeAddress||'';
 if(site?.plot?.startsWith('kitahama-')||/\bKitahama\b/i.test(address))return 'Exit to Kitahama';
 if(site?.plot?.startsWith('fumoto-'))return 'Exit to Fumoto';
 if(site?.plot?.startsWith('kitano-'))return 'Exit to the lane';
 if(YARD_HOMES[site?.id]||/\bFront-Row\b/i.test(address))return 'Exit to Front-Row yard';
 if(/\bMain Street\b/i.test(address))return 'Exit to Main Street';
 return 'Exit to the street';
}

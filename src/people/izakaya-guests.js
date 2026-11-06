import {createIndoorResidents} from './indoor-residents.js';
export function createIzakayaGuests(options){return createIndoorResidents({...options,place:'izakaya'});}

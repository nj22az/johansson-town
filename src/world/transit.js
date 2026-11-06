import {FERRY_TERMINAL} from './ferry.js';

/**
 * How the town's commuters come and go: the island has no road out, so it is the ferry
 * from the outer pier. Everything that walks people to "the stop" asks here.
 */
export const transitStop=()=>FERRY_TERMINAL;
import {livesOnKitano} from '../people/kitano-residents.js';
/** Where somebody who is away is: Kitano-jima's residents are at home across the water (batch 7b). */
export const awayPlace=name=>livesOnKitano(name)?'at home on Kitano-jima':'on the mainland';

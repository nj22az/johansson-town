/**
 * How high off the ground each kind of outdoor surface is drawn. A thin re-export of world/ground-standard.js, the
 * rulebook (21 October 2026), where each class's top, its tolerance and its edges are.
 *
 * Two slabs in the same plane flicker against each other wherever they overlap, worst on a phone's depth buffer:
 * planted ground sits lowest (grass, gravel), the paved routes ride two centimetres over it (lane), and the old
 * apron layer clears the routes by the same margin again. Keep at least 15 mm between any two surfaces that overlap
 * in plan -- tests/ground-clearance.test.mjs measures it.
 */
export {GROUND_LAYER} from './ground-standard.js';

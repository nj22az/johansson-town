/** Observe committed sale records, including at the shop's cash ceiling. No economy writes. */
export function createCheckoutFeedback({drawer,getSale,onSale=()=>{}}){
 const home=drawer.position.x;let last=getSale(),age=Infinity;
 return {
  update(dt,inside){
   const sale=getSale();
   if(sale!==last){last=sale;if(inside&&sale){age=0;onSale(sale);}}
   if(!inside){age=Infinity;drawer.position.x=home;return;}
   age+=Math.max(0,dt);
   // Slide into the staff aisle, within the counter top: 0.2s open, 0.55s hold, 0.25s close.
   const travel=age<.2?age/.2:age<.75?1:age<1?(1-age)/.25:0;
   drawer.position.x=home+.08*Math.max(0,travel);
  },
 };
}

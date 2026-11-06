/**
 * The island police officer's uniform: the 1994 pattern of the Japanese police (平成6年改正), as Officer Mori wears it at
 * the Minato police box in 1997. Built so that anybody can wear it in the maker: the peaked cap is outfit.hat 'police',
 * the jacket outfit.top 'police', and the duty belt with its kit accessories.belt 'duty'.
 *
 * What the pattern is, from the rule itself (警察官の服制に関する規則, National Public Safety Commission rule No. 4 of
 * 1956, its 別表 as revised; e-Gov's text, read 2026-10-14, is the 2016 and 2025 revisions, which keep the 1994 cut) and
 * from the prefectures' own orders (Tokyo's 警視庁警察官服制規程 of 22 March 1994; Okinawa's 沖縄県警察官等の服制に関する訓令;
 * Nagano's order on how the duty belt is worn):
 * - the jacket (冬服・合服上衣): dark navy (濃紺), notched lapels (折り襟), single-breasted with three dark-gold metal buttons
 *   (黒金色の桜葉ボタン) in one row, two breast pockets each with a pleat, a flap and a button, a slot with a flap at each
 *   side of the waist (腰部の貫通口) for the holster (right) and the baton holder and radio (left), side vents behind,
 *   shoulder straps (肩章) sewn into the shoulder seam and buttoned at the collar end, the force's emblem on the right upper
 *   arm (エンブレム, navy with a gold frame). Before 1994 it was the 1968 four-button jacket with peaked lapels.
 * - under it a white shirt (冬・合ワイシャツ 白色) and a plain indigo-grey tie (藍ねず色の棒ネクタイ); the light-blue shirt
 *   is the summer uniform's, worn without the jacket and without a tie (1 June to 30 September in Okinawa).
 * - the rank insignia (階級章), since 1994 one metal plate on the left breast along the top of the pocket flap (it was on
 *   both lapels before). The numbered ID badge (識別章) came in October 2002, so a 1997 officer has none.
 * - the cap (制帽): the jacket's navy, a black woven band (帯章, plain for a patrolman), a black resin visor and chin strap
 *   held by a dark-gold ear button each side, the badge on a black felt base on the front of the crown.
 * - the duty belt (帯革): black cowhide with a silver buckle, worn on the trouser belt UNDER the jacket since 1994 (the
 *   cross strap, 負革, was abolished then); the holster comes out through the right waist slot and the baton holder
 *   through the left. On it: the holster, the revolver's lanyard (a black coiled cord, clipped to the belt since 1994,
 *   to the right shoulder before), the handcuff case, the baton holder (the 1994 baton is the three-section telescopic
 *   aluminium one, 特殊警棒, carried closed, grip up). Black shoes.
 * - the whistle (警笛), carried in the right breast pocket on its cord; Tokyo's order also has a silver whistle chain
 *   (警笛鎖) hooked on the shoulder strap, which is what is built here: it is the one that shows.
 * - Okinawa's order: the winter uniform 1 December to 31 March, the between-season (合服) 1 April to 31 May and
 *   1 October to 30 November, the summer uniform 1 June to 30 September. Halloween night is in the 合服 season: jacket,
 *   white shirt and tie.
 * Ours, not the real thing (the town's rule: no real emblems): the cap badge, the arm emblem and the rank plate carry the
 * Minato island police emblem we drew, a gold ring round a silver full moon (the harbour moon), never the real asahi badge.
 * Open, not found in the rules read: the radio. A handheld set (署活系無線機) on the belt with a speaker-microphone on the
 * shoulder strap is built as the brief asks; whether a 1997 kōban officer's set had a shoulder microphone, or only a
 * receiver with an earpiece (受令機), is not confirmed.
 */
export const POLICE_UNIFORM=Object.freeze({
 period:'1994 pattern, as worn in Okinawa in 1997 (the between-season jacket, worn 1 October to 30 November)',
 /**
  * The cloth (the rule: the winter jacket 濃紺, dark navy; the between-season one 紺, navy, with linen in it). Mori wears the
  * between-season navy on Halloween night; a shade lighter than the winter cloth, which also keeps him from melting into
  * the navy night (the film's night grade).
  */
 cloth:Object.freeze({winter:'#1f2b47',between:'#2c416d'}),
 sources:Object.freeze([
  // (the rule on police officers' uniforms, its table; Tokyo's 1994 order; Okinawa's order; Nagano's order: see above)
  'National Public Safety Commission rule No. 4 of 1956 on police uniforms, its table (e-Gov law 331M50400000004)',
  'Tokyo Metropolitan Police order No. 5 of 22 March 1994 on uniforms',
  'Okinawa Prefectural Police order No. 13 of 1978 on uniforms: the wearing periods',
  'Nagano Prefectural Police guidance on uniforms: how the duty belt is worn and where the whistle is carried',
 ]),
 cap:Object.freeze({
  /** Heights on the head's unit sphere: the band's lower edge just above the brows, its top, the crown's top. */
  band:Object.freeze([.34,.63]),crownFront:1.29,crownBack:1.15,crownRadius:1.2,dome:.03,gap:.018,
  /** Hair is drawn in to the band from this height up (head-cover.js hatTuck): it tapers into the band's edge. */
  tuck:Object.freeze([.23,.33]),
  visor:Object.freeze({half:1.1,length:.46,pitch:.14,thickness:.04}),
  colours:Object.freeze({band:'#1b1d24',visor:'#15161b',gloss:'#3d414e',under:'#1f2622',strap:'#17181d',earButton:'#8c7642',felt:'#121317',gold:'#d9b24a',silver:'#d8dce2'}),
  why:'The 1994 pattern cap: navy crown, black woven band, black resin visor and chin strap, the badge on black felt.',
 }),
 jacket:Object.freeze({
  /**
   * The notched lapel, one side (mirrored), as [fraction of the cloth's half-width, height up the torso]: by the neck, the
   * collar's point, its lower corner, the notch, the lapel's point, the roll down to the top button, its foot at the
   * middle; it closes back up the open V (the gorge) to the neck, where the white shirt and the tie show.
   */
  lapel:Object.freeze([[.55,1.0],[.84,.89],[.7,.855],[.61,.868],[.66,.825],[.07,.585],[.03,.59]].map(Object.freeze)),
  /** The three front buttons (heights up the torso), dark-gold metal. */
  buttons:Object.freeze([.53,.4,.27]),
  /** The breast pockets: centre (fraction of the half-width), height, width and height (fractions), flap depth. */
  pockets:Object.freeze({f:.62,t:.71,w:.34,h:.12,flap:.045}),
  /** The waist slots (貫通口) with their flaps: azimuth round the body (radians from the front) and height. */
  slots:Object.freeze({at:.95,t:.12,w:.2,h:.045}),
  /** The jacket's hem: how far below the hip joint it falls (m, for a body of 1.6 m), and its ease round the hips. */
  hem:Object.freeze({below:.02,ease:.57}),
  metal:'#a8893f',shirt:'#f6f4ee',tie:'#4b5268',strapButton:'#1d2433',chain:'#d4d8de',
  /** The shoulder straps (肩章): their width and how far in from the shoulder seam they reach (m for 1.6 m). */
  strap:Object.freeze({half:.021,inner:.035}),
  rank:Object.freeze({plate:'#c9cdd2',bar:'#e2c25a',ground:'#27304d',
   why:'Mori’s rank by our choice: senior police officer (junsa-chō), the plate on the left breast; its details are ours. A story can promote him.'}),
  emblem:Object.freeze({ground:'#1f2a48',frame:'#d9b24a',why:'The force’s emblem on the right upper arm, as the 1994 jacket has it: navy, a gold frame, our island emblem.'}),
 }),
});

/**
 * The duty belt (accessories.belt 'duty'): the 帯革 and its kit, worn by anyone the story makes a police officer.
 * Under the 1994 jacket the belt itself is hidden; the holster comes out of the right waist slot and the baton holder and
 * the radio out of the left. Without the jacket (a summer shirt, a costume) the belt shows, buckle and all, with the
 * handcuff case at the back. Every piece is black leather or black resin except the buckle (silver), the revolver's grip
 * (dark wood) and the radio's aerial.
 * Where each hangs: an azimuth round the body (radians from the front, + the wearer's left) and the height of its top
 * (the kit rides behind the line of the hanging arms, so a hand never meets it, and clear of the thighs when seated)
 * (fraction of the torso above the hip joint); sizes in metres for a body of 1.6 m. The arms of anyone wearing it hang a
 * little further out (armClear, radians), as a police officer's do over the kit, so a swinging hand passes outside it.
 */
export const DUTY_BELT=Object.freeze({
 belt:Object.freeze({t:.13,width:.05,colour:'#16171b',buckle:'#cfd3d8'}),
 holster:Object.freeze({at:-2.1,top:.14,length:.13,width:.05,depth:.035,colour:'#121316',grip:'#4a3527',lanyard:'#101114',
  why:'The revolver on the right hip, its grip forward of the hand, the coiled lanyard from its butt to the belt (since 1994).'}),
 baton:Object.freeze({at:2.1,top:.16,length:.2,radius:.015,colour:'#141518',grip:'#26282d',
  why:'The three-section telescopic baton (from 1994), carried closed, grip up, in its holder on the left hip.'}),
 radio:Object.freeze({at:2.5,top:.22,height:.1,width:.05,depth:.03,colour:'#1b1c20',aerial:'#2a2b30',mic:'#1b1c20',
  why:'The police box’s handheld radio on the left hip, its coiled cord up the back and over the shoulder, under the arm’s swing, to the speaker-microphone clipped on the left shoulder strap.',
  open:'Whether a 1997 kōban officer’s handheld set had a shoulder microphone, or only an earpiece receiver, is not confirmed in the rules read.'}),
 cuffs:Object.freeze({at:Math.PI*.8,top:.15,height:.09,width:.075,depth:.035,colour:'#131417',
  why:'The handcuff case on the belt at the back, under the jacket when it is worn.'}),
 armClear:.12,
 who:'Officer Mori',why:'What a police officer carries on duty: the revolver, the baton, the handcuffs and the radio.',
});

/** Who it is for: the wardrobe catalogue and the stories read these. */
export const POLICE_PURPOSE=Object.freeze({who:'Officer Mori at Minato Police Station',
 why:'The island police officer in his 1994-pattern uniform, so anyone can find him at the desk or on night patrol.'});


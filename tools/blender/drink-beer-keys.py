# ---- the keys (seconds; the game's frame, the body's root at the origin, seated on Minato's counter stool)
# (included by tools/blender/drink-beer.py: written here so the performance reads on its own; the rig and the bake are there)
#
# THE BRIEF (docs/ANIMATION-STANDARD.md section 4, step 1). Register: everyday (calm, friendly), the comedy register's push
# only on the "kaa!" after the first draught. Primary: the glass (the right hand); secondary: the free left hand (the wipe of
# the foam moustache), breathing, the swallows. Four parts, each starting and ending on the same pose (C: leaning in a
# little, the right hand on the glass where it stands on the counter), so the game plays TAKE, then FIRST or SIP, then LET:
#   TAKE  0-1.75     still 0-0.35; the eyes to the glass 0.35 (the head 5 frames after); the reach's counter-move, the hand
#                    down and back on the thigh, 0.45-0.62; the lean in and the reach on an arc 0.62-1.22; the hand slides on
#                    1.22-1.3 and closes 1.3-1.42 (four frames after it is there); still from 1.5.
#   FIRST 1.75-8.35  (times from its start) still to 0.2 (the eyes on the glass); anticipation 0.2-0.5: a small inhale, a lean in,
#                    the glass rocked forward on its front edge 5 degrees and slid 15 mm (the hand's dip, 40% of the lift);
#                    the lift on an arc 0.5-1.25 (slow out, the elbow rising, up and in, the body sitting back); contact 1.25-1.4
#                    (the rim on the lower lip, the head coming forward to meet it); the gulp 1.4-3.2 (the glass going over as
#                    the beer goes down, the tilt following the fill; the head back; the eyes shut on the first long
#                    draught; three swallows, each a beat); off the lip 3.2-3.5 and down on an arc to his chest; "kaa!" 3.5-4.1
#                    (comedy: the brows up, the mouth open, the shoulders up then down, the chin up then a nod); the foam
#                    moustache wiped with the side of the left forefinger 4.05-5.1 (secondary); the set-down 5.1-5.95
#                    (anticipation up and back 5.1-5.3, forward and down on an arc, the tap at 5.95, a 6 mm follow-through of the
#                    body past it); still from 6.35.
#   SIP   8.35-12.6  the same keys smaller and quieter (timing contrast): a short anticipation, the lift, one swallow, no "kaa"
#                    (a content little breath out), the set-down; still from 4.0 of it.
#   LAST  12.6-16.85 the last of the glass: SIP's beats at SIP's times (the game blends the two by how far the glass must go over
#                    for the beer left: tools say `beerLast`), the glass from a quarter full to empty, so it goes over toward
#                    horizontal; the head back as far as the first draught's and more, the elbow up higher, the eyes shut on it.
#   LET   16.85-18.25 the hand opens off the glass, back to the thigh on an arc, the body easing back past upright and settling
#                    (a micro-overshoot) by 1.15 s of it.
# The table it is keyed at (tools/drink-beer-kit.mjs `--seat`): Minato's counter (0.78 m high, the glass 0.48 m ahead of the
# stool and 0.15 m to his right) or the booth's table (0.72 m, the glass 0.35 m ahead of the bench): nearer and lower, so he
# leans in less (CPOSE), and the hand lifts over the table's near edge on its way to it.
# Overlap: the spine leads every pose by 4 frames; the head after the eyes by 5; the forearm and hand dragged 3 frames at the
# bake; the left hand's wipe after the right hand's release. Arcs: every stroke of the glass through a breakdown off its chord.

k = M['k']
TIMES = {}


def mark(name, t):
    TIMES[name] = t
    return t


ROOT0 = Vector(K['seated']['root'])
TOP = K['counter']['top'] - ROOT0.y                                          # the counter's top, in the body's frame
SPOT = Vector((K['counter']['spot'][0], TOP, K['counter']['spot'][2] - ROOT0.z))   # where Thao set the glass down
RB = V['outline'][1][0] if V['outline'][1][0] > .01 else V['outline'][2][0]   # the foot's radius
TILT = V['tilt']


def tilt_for(fill):
    """How far the glass must be tipped (radians, from upright) for what is left to reach the rim (the kit's table)."""
    fill = max(0.0, min(1.0, fill))
    for (f0, a0), (f1, a1) in zip(TILT, TILT[1:]):
        if f0 <= fill <= f1:
            return a0 + (a1 - a0) * (fill - f0) / (f1 - f0)
    return TILT[-1][1]


# How much of each part there is, by glass: the beer left after the first draught and after a sip; the head back at the
# deepest of the first draught (the taller mug goes over further for the same beer, the small glass less).
FILLS = {'mug': (.9, .62, .52), 'pint': (.9, .64, .55), 'glass': (.85, .45, .32)}[VESSEL]
# (the last of it: a quarter of the glass to none; the glass toward horizontal, the head back further than the first draught's)
LAST_FILLS = (.22, 0.0)
LAST_HEAD = 1.55
HEADBACK = {'mug': 1.0, 'pint': .9, 'glass': .7}[VESSEL]
FOAM = VESSEL in ('mug', 'pint')                                              # (a draught's head and the pint's: a moustache)


def counter_at(dz=0.0, tip=0.0, dx=0.0, lift=0.0):
    """The glass standing on the counter at its place (moved dz toward the far side, dx to his left), rocked forward `tip`
    on its foot's front edge (its rim away from him), `lift` metres off the counter."""
    front = SPOT + Vector((dx, lift, dz + RB))
    turn = Quaternion((1, 0, 0), tip) @ UPRIGHT
    return Matrix.Translation(front + Quaternion((1, 0, 0), tip) @ Vector((0, 0, -RB))) @ turn.to_matrix().to_4x4()


C_GLASS = lambda t: counter_at()
# FK: spine, chest, neck, head (radians, game Euler XYZ: x pitches forward, y turns to his left, z leans)
ZERO = ((0, 0, 0), (0, 0, 0), (0, 0, 0), (0, 0, 0))
# leaning in to it a little, looking down at the glass. (The counter is 38 cm in front of him as the game seats him: the stool
# 42 cm from its edge, the body forward on the stool by 10 cm. The kit had it 20 cm further, and the lean was 0.58 rad.)
# (At the booth the glass is 24 cm ahead of him and 6 cm lower, a forearm's reach: he leans in a third as much, and looks down
# further at it.)
BOOTH = K['counter']['kind'] == 'booth'
# (and leans a little toward it, the right shoulder dropping, so the forearm comes level to a glass that low and the hand round
# it holds it upright with the wrist all but straight)
CPOSE = ((.03, -.02, .05), (.025, -.04, .04), (-.01, 0, -.04), (.2, -.07, -.03)) if BOOTH else ((.085, -.03, 0), (.07, -.05, 0), (-.03, 0, 0), (.12, -.06, 0))


def C(ds=0.0, dc=0.0, dn=0.0, dh=0.0):
    """The pose C, its spine, chest, neck and head pitched on by so much (a breakdown about it)."""
    return tuple((p[0] + d, p[1], p[2]) for p, d in zip(CPOSE, (ds, dc, dn, dh)))

BODY, GLASS, LEFT, POLES_R, CUES = [], [], [], [], {c: [] for c in ('closeR', 'closeL', 'blink', 'breath', 'smile', 'look', 'kaa', 'foam', 'swallow',
                                                                    'shrug', 'lip', 'mouth', 'counter', 'hold', 'wipe', 'lean', 'fill')}


def cue(name, *tv):
    CUES[name] += list(tv)


def body(t, spine, chest, neck, head):
    BODY.append((t, spine, chest, neck, head))


def scale(pose, a, extra=()):
    return tuple(tuple(c * a for c in part) for part in pose)


POLE_REST, POLE_REACH, POLE_UP, POLE_HOLD = (-.45, .7, -.15), (-.55, .75, .15), (-.75, 1.1, .25), (-.6, .85, .05)
POLE_LIFT = POLE_REACH                                                        # (the elbow as the glass leaves the table: the counter's)
if BOOTH:
    # (the booth's glass a forearm away and low: the elbow down by his side and back, the forearm level to the glass, so the
    # hand round it holds it upright with the wrist straight; with the counter's elbow, out and forward, the wrist could not,
    # and the glass stood 10 degrees over in the hand, its foot 9-13 mm into the table)
    POLE_REACH = (-.38, .5, -.25)
POLE_LAST = (-.8, 1.35, .3)                                                  # (the elbow up higher for the last of it)
# ---- TAKE
SEG = {'take': 0.0}
body(0, *ZERO)
body(.35, *ZERO)
body(.62, (-.01, 0, 0), (-.02, 0, 0), (0, 0, 0), (.08, -.04, 0))           # the eyes went first; a small breath in, a glance down
body(1.22, *C(.01, .01, 0, .005))                                            # leaned in to it (a touch past C)
body(1.42, *CPOSE)
body(1.75, *CPOSE)
REST_R = lambda t: SEATED['handR']
GLASS += [(0, 'rest'), (.35, 'rest'), (.45, 'rest'), (.62, 'dip'), (.92, 'mid'), (1.22, 'near'), (1.3, 'on'), (1.75, 'on')]
POLES_R += [(0, POLE_REST), (.45, POLE_REST), (.9, (-.6, .65, .05)), (1.3, POLE_REACH), (1.75, POLE_REACH)]
cue('closeR', (0, .12), (.45, .12), (1.22, .1), (1.3, .15), (1.42, V['hold']['amount']), (1.75, V['hold']['amount']))
cue('hold', (0, 0), (1.3, 0), (1.36, 1), (1.75, 1))
cue('counter', (0, 1), (1.75, 1))
cue('look', (0, 0), (.35, 0), (.45, 1), (1.75, 1))
cue('lean', (0, 0), (.62, 0), (1.22, 1), (1.75, 1))
SEG['first'] = 1.75


def drink(t0, kind):
    """FIRST, SIP or LAST (`kind`) from t0: the same keys, the sip smaller and quieter, the last at the sip's times with the
    glass going over toward horizontal and the head further back."""
    first, last = kind == 'first', kind == 'last'
    u = lambda s: t0 + s
    fill0, fill1 = (FILLS[0], FILLS[1]) if first else LAST_FILLS if last else (FILLS[1], FILLS[2])
    g1 = 3.2 if first else 2.1                                              # the draught ends
    s0 = 5.1 if first else 2.75                                             # the set-down begins
    hb = HEADBACK * (1.0 if first else LAST_HEAD if last else .5)
    end = s0 + 1.5
    body(u(0), *CPOSE)
    body(u(.2), *CPOSE)
    body(u(.5), *C(.01, -.02, .01, -.01))                                    # anticipation: a breath in (the chest up), a lean in
    body(u(1.25), (0, 0, 0), (-.03, 0, 0), (-.02, 0, 0), (-.03, 0, 0))       # sat up, the glass at the mouth
    body(u(1.4), (0, 0, 0), (-.03, 0, 0), (-.01, 0, 0), (.02, 0, 0))         # contact: the head comes to meet it
    body(u(g1 - .45), (-.03 * hb, 0, .01), (-.08 * hb, 0, 0), (-.12 * hb, 0, 0), (-.27 * hb, 0, 0))   # deep: the head back
    body(u(g1), (-.03 * hb, 0, .01), (-.08 * hb, 0, 0), (-.12 * hb, 0, 0), (-.26 * hb, 0, 0))         # held till it leaves
    body(u(g1 + .3), (-.01, 0, 0), (-.03, 0, 0), (-.03, 0, 0), (-.06, 0, 0))                          # off the lip
    if first:
        body(u(g1 + .5), (-.035, 0, 0), (-.1, 0, 0), (-.07, 0, 0), (-.18, 0, 0))   # "kaa!": the chest up, the chin up (pushed)
        body(u(g1 + .8), (.03, 0, 0), (.05, 0, 0), (.03, 0, 0), (.11, 0, 0))       # and down: the nod, the shoulders dropped
        body(u(g1 + 1.1), (0, 0, 0), (0, 0, 0), (0, .02, 0), (.03, .06, 0))        # settled; turning a little to the hand
        body(u(g1 + 1.75), (0, 0, 0), (0, 0, 0), (0, .02, 0), (.02, .05, 0))       # (the wipe)
    else:
        body(u(g1 + .55), (.008, 0, 0), (.015, 0, 0), (.01, 0, 0), (.05, 0, 0))   # a small breath out
    body(u(s0), (0, 0, 0), (0, 0, 0), (0, 0, 0), (.05, -.04, 0))           # looks to the counter (the eyes first)
    body(u(s0 + .2), (-.01, 0, 0), (-.012, 0, 0), (0, 0, 0), (.06, -.05, 0))   # the set-down's anticipation: up a touch
    body(u(s0 + .85), *C(-.005, -.005))                                       # the tap
    body(u(s0 + 1.0), *C(.005, .005, 0, .005))                                # past it, a little
    body(u(s0 + 1.25), *CPOSE)
    body(u(end), *CPOSE)
    # the glass
    # (for the last of it the glass comes up already further over: it goes to the lip at 80 degrees, not 60)
    GLASS.extend([(u(0), 'on'), (u(.2), 'on'), (u(.5), 'rock'), (u(.75), 'up'), (u(1.05), ('in', 34, 24) if last else 'in'), (u(1.25), ('lip', -8, .025)), (u(1.4), ('lip', None, 0))])
    GLASS.append((u(1.4), ('pull', u(1.4), u(g1), fill0, fill1)))
    # (down from the lip to the chest unhurried: 0.35 s for the 25 cm, the glass at 1.2 m/s at the most)
    GLASS.extend([(u(g1 + .3), ('lip', 34 if last else 20, .06)), (u(g1 + .65), 'chest' if first else 'chestlow')])
    if first:
        GLASS.extend([(u(g1 + .9), 'chestlow'), (u(s0), 'chestlow')])
    else:
        GLASS.append((u(s0), 'chestlow'))
    GLASS.extend([(u(s0 + .2), 'setup'), (u(s0 + .55), 'setmid'), (u(s0 + .78), 'setnear'), (u(s0 + .85), 'on'), (u(end), 'on')])
    up = POLE_LAST if last else POLE_UP
    # (at the booth the elbow comes out from his side to the counter's way in the anticipation, as the glass is rocked, so the
    # lift swings it no further than at the counter: from his side to up and out in the lift, it swung 0.2 rad a frame at the lip)
    POLES_R.extend([(u(.2), POLE_REACH), (u(.5), POLE_LIFT), (u(1.05), up), (u(g1), up), (u(g1 + .55), POLE_HOLD), (u(s0 + .2), POLE_HOLD),
                    (u(s0 + .85), POLE_REACH), (u(end), POLE_REACH)])
    # the hand's closing, the contacts, the face
    cue('closeR', (u(0), V['hold']['amount']), (u(end), V['hold']['amount']))
    cue('hold', (u(0), 1), (u(end), 1))
    cue('counter', (u(0), 1), (u(.5), 1), (u(.56), 0), (u(s0 + .8), 0), (u(s0 + .85), 1), (u(end), 1))
    cue('lean', (u(0), 1), (u(.5), 1), (u(1.2), 0), (u(s0 + .2), 0), (u(s0 + .85), 1), (u(end), 1))
    # (on as the rim lands, a frame after its key: the hand eases into the key and is there a frame later)
    cue('lip', (u(0), 0), (u(1.33), 0), (u(1.44), 1), (u(g1), 1), (u(g1 + .12), 0), (u(end), 0))
    cue('mouth', (u(0), 0), (u(.75), 0), (u(1.3), 1), (u(g1 + .3), 1), (u(g1 + .75), 0), (u(end), 0))
    cue('look', (u(0), 1), (u(.45), 1), (u(.8), 0), (u(s0 - .1), 0), (u(s0 + .05), 1), (u(end), 1))
    shut = 1 if first else .85 if last else 0                               # (the eyes shut on the first draught, and on the last of it)
    cue('blink', (u(0), 0), (u(1.45), 0), (u(1.6), shut), (u(g1 - .1), shut), (u(g1 + .1), 0), (u(end), 0))
    cue('breath', (u(0), 0), (u(.2), 0), (u(.4), .5), (u(.5), 0), (u(g1 + .25), 0), (u(g1 + .45), 1 if first else .6), (u(g1 + .9), 0), (u(end), 0))
    if first:
        cue('kaa', (u(0), 0), (u(g1 + .3), 0), (u(g1 + .45), 1), (u(g1 + .75), 1), (u(g1 + 1.0), 0), (u(end), 0))
        cue('shrug', (u(0), 0), (u(g1 + .3), 0), (u(g1 + .5), 1), (u(g1 + .8), 0), (u(end), 0))
        cue('smile', (u(0), 0), (u(g1 + .9), 0), (u(g1 + 1.2), .8), (u(s0 + .85), .3), (u(end), 0))
    else:
        cue('kaa', (u(0), 0), (u(end), 0))
        cue('shrug', (u(0), 0), (u(end), 0))
        cue('smile', (u(0), 0), (u(g1 + .3), 0), (u(g1 + .6), .7), (u(s0 + .85), .3), (u(end), 0))
    sw = [1.85, 2.35, 2.85] if first else [1.75]
    cue('swallow', (u(0), 0))
    for s in sw:
        cue('swallow', (u(s - .12), 0), (u(s), 1), (u(s + .18), 0))
    cue('swallow', (u(end), 0))
    cue('fill', (u(0), fill0), (u(1.45), fill0), (u(g1 - .05), fill1), (u(end), fill1))
    if first and FOAM:
        # (the left hand up from his thigh in 0.6 s, its dip first; across the lip from his left to his right; down again)
        cue('foam', (u(0), 0), (u(g1), 0), (u(g1 + .12), 1), (u(g1 + 1.35), 1), (u(g1 + 1.62), 0), (u(end), 0))
        cue('wipe', (u(0), 0), (u(g1 + 1.27), 0), (u(g1 + 1.35), 1), (u(g1 + 1.62), 1), (u(g1 + 1.72), 0), (u(end), 0))
        cue('closeL', (u(g1 + .75), 0), (u(g1 + 1.3), .45), (u(g1 + 1.68), .45), (u(g1 + 2.2), 0))
        LEFT.extend([(u(g1 + .6), 'rest'), (u(g1 + .75), 'restdip'), (u(g1 + 1.05), 'rising'), (u(g1 + 1.35), 'wipe0'), (u(g1 + 1.62), 'wipe1'),
                     (u(g1 + 1.9), 'falling'), (u(g1 + 2.2), 'restpast'), (u(g1 + 2.45), 'rest')])
    else:
        cue('foam', (u(0), 0), (u(end), 0))
        cue('wipe', (u(0), 0), (u(end), 0))
    return t0 + end


SEG['sip'] = drink(SEG['first'], 'first')
SEG['last'] = drink(SEG['sip'], 'sip')
SEG['let'] = drink(SEG['last'], 'last')
t0 = SEG['let']
body(t0, *CPOSE)
body(t0 + .15, *CPOSE)
body(t0 + .7, (-.015, 0, 0), (-.02, 0, 0), (0, 0, 0), (.02, 0, 0))      # eased back past upright
body(t0 + 1.0, (.004, 0, 0), (.006, 0, 0), (0, 0, 0), (.03, 0, 0))      # the micro-overshoot back
body(t0 + 1.4, *ZERO)
# (off the glass and back, unhurried: drawn back toward him as he sits back, the elbow bending, then down onto the thigh; the
# breakdowns between them kept within the arm's reach of the shoulder as the body leans back)
GLASS += [(t0, 'on'), (t0 + .15, 'on'), (t0 + .22, ('reach', 'on', 'off', .4)), (t0 + .32, ('reach', 'off', 'off', 0)),
          (t0 + .42, ('reach', 'off', 'back', .25)), (t0 + .52, ('reach', 'off', 'back', .5)), (t0 + .62, ('reach', 'off', 'back', .75)),
          (t0 + .72, ('reach', 'back', 'back', 0)), (t0 + .9, ('reach', 'back', 'restpast', .5)), (t0 + 1.08, 'restpast'), (t0 + 1.4, 'rest')]
POLES_R += [(t0, POLE_REACH), (t0 + .32, POLE_REACH), (t0 + 1.08, POLE_REST), (t0 + 1.4, POLE_REST)]
cue('closeR', (t0, V['hold']['amount']), (t0 + .15, V['hold']['amount']), (t0 + .32, .12), (t0 + 1.4, .12))
cue('hold', (t0, 1), (t0 + .14, 1), (t0 + .2, 0), (t0 + 1.4, 0))
cue('counter', (t0, 1), (t0 + 1.4, 1))
cue('lean', (t0, 1), (t0 + .15, 1), (t0 + .8, 0), (t0 + 1.4, 0))
cue('look', (t0, 1), (t0 + .3, 1), (t0 + .45, 0), (t0 + 1.4, 0))
cue('smile', (t0, 0), (t0 + .9, .3), (t0 + 1.4, .3))
for c in ('blink', 'breath', 'kaa', 'shrug', 'swallow', 'lip', 'mouth', 'foam', 'wipe'):
    cue(c, (t0, 0), (t0 + 1.4, 0))
cue('fill', (t0, FILLS[2]), (t0 + 1.4, FILLS[2]))
for c in ('blink', 'breath', 'kaa', 'shrug', 'swallow', 'lip', 'mouth', 'foam', 'wipe', 'smile'):
    CUES[c].insert(0, (0, 0))
CUES['fill'].insert(0, (0, FILLS[0]))
cue('closeL', (0, 0), (t0 + 1.4, 0))
duration = mark('end', t0 + 1.4)
for n, t in SEG.items():
    mark(n, t)
LEFT.insert(0, (0, 'rest'))
LEFT.append((duration, 'rest'))
# the sheets' moments: the reach, the first draught's lift, contact, gulp, "kaa!", wipe and set-down, a sip at the lip, the last of
# it at the lip and coming off it, the let-go; the story poses again as silhouettes
T0, T1, T2, TL, T3 = SEG['take'], SEG['first'], SEG['sip'], SEG['last'], SEG['let']
SHEET_PICKS = [T0 + .3, T0 + .62, T0 + 1.0, T0 + 1.45, T1 + .5, T1 + .9, T1 + 1.4, T1 + 2.6, T1 + 3.3, T1 + 3.65, T1 + 4.5, T1 + 5.3, T1 + 5.95, T2 + 1.75,
               TL + 1.05, TL + 1.75, TL + 2.3, T3 + .7, T3 + 1.4]
SHEET_STORY = [T0 + 1.45, T1 + .5, T1 + 1.4, T1 + 2.6, T1 + 3.65, T1 + 4.5, T1 + 5.95, TL + 1.75, T3 + .7]

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
#   LET   12.6-14.0  the hand opens off the glass 12.75, back to the thigh on an arc, the body easing back past upright 12.85-13.3
#                    and settling (a micro-overshoot) by 13.75.
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
CPOSE = ((.32, -.04, 0), (.26, -.06, 0), (-.04, 0, 0), (.06, -.06, 0))    # leaning in to it, looking at the glass (the counter is a long arm away)
BODY, GLASS, LEFT, POLES_R, CUES = [], [], [], [], {c: [] for c in ('closeR', 'closeL', 'blink', 'breath', 'smile', 'look', 'kaa', 'foam', 'swallow',
                                                                    'shrug', 'lip', 'mouth', 'counter', 'hold', 'wipe', 'lean', 'fill')}


def cue(name, *tv):
    CUES[name] += list(tv)


def body(t, spine, chest, neck, head):
    BODY.append((t, spine, chest, neck, head))


def scale(pose, a, extra=()):
    return tuple(tuple(c * a for c in part) for part in pose)


POLE_REST, POLE_REACH, POLE_UP, POLE_HOLD = (-.45, .7, -.15), (-.55, .75, .15), (-.75, 1.1, .25), (-.6, .85, .05)
# ---- TAKE
SEG = {'take': 0.0}
body(0, *ZERO)
body(.35, *ZERO)
body(.62, (-.01, 0, 0), (-.02, 0, 0), (0, 0, 0), (.08, -.04, 0))           # the eyes went first; a small breath in, a glance down
body(1.22, (.33, -.04, 0), (.27, -.06, 0), (-.04, 0, 0), (.065, -.06, 0))   # leaned in to it (a touch past C)
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


def drink(t0, first):
    """FIRST (`first`) or SIP from t0: the same keys, the sip smaller and quieter."""
    u = lambda s: t0 + s
    fill0, fill1 = (FILLS[0], FILLS[1]) if first else (FILLS[1], FILLS[2])
    g1 = 3.2 if first else 2.1                                              # the draught ends
    s0 = 5.1 if first else 2.75                                             # the set-down begins
    a = 1.0 if first else .45                                               # how much of the first's movement
    hb = HEADBACK * (1.0 if first else .5)
    end = s0 + 1.5
    body(u(0), *CPOSE)
    body(u(.2), *CPOSE)
    body(u(.5), (.33, -.04, 0), (.24, -.06, 0), (-.03, 0, 0), (.05, -.06, 0))  # anticipation: a breath in (the chest up), a lean in
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
    body(u(s0 + .85), (.315, -.04, 0), (.255, -.06, 0), (-.04, 0, 0), (.06, -.06, 0))   # the tap
    body(u(s0 + 1.0), (.325, -.04, 0), (.265, -.06, 0), (-.04, 0, 0), (.065, -.06, 0))  # past it, a little
    body(u(s0 + 1.25), *CPOSE)
    body(u(end), *CPOSE)
    # the glass
    GLASS.extend([(u(0), 'on'), (u(.2), 'on'), (u(.5), 'rock'), (u(.75), 'up'), (u(1.05), 'in'), (u(1.25), ('lip', 18, .025)), (u(1.4), ('lip', None, 0))])
    GLASS.append((u(1.4), ('pull', u(1.4), u(g1), fill0, fill1)))
    GLASS.extend([(u(g1 + .3), ('lip', 20, .06)), (u(g1 + .55), 'chest' if first else 'chestlow')])
    if first:
        GLASS.extend([(u(g1 + .9), 'chestlow'), (u(s0), 'chestlow')])
    else:
        GLASS.append((u(s0), 'chestlow'))
    GLASS.extend([(u(s0 + .2), 'setup'), (u(s0 + .55), 'setmid'), (u(s0 + .78), 'setnear'), (u(s0 + .85), 'on'), (u(end), 'on')])
    POLES_R.extend([(u(.2), POLE_REACH), (u(.5), POLE_REACH), (u(1.05), POLE_UP), (u(g1), POLE_UP), (u(g1 + .55), POLE_HOLD), (u(s0 + .2), POLE_HOLD),
                    (u(s0 + .85), POLE_REACH), (u(end), POLE_REACH)])
    # the hand's closing, the contacts, the face
    cue('closeR', (u(0), V['hold']['amount']), (u(end), V['hold']['amount']))
    cue('hold', (u(0), 1), (u(end), 1))
    cue('counter', (u(0), 1), (u(.5), 1), (u(.56), 0), (u(s0 + .8), 0), (u(s0 + .85), 1), (u(end), 1))
    cue('lean', (u(0), 1), (u(.5), 1), (u(1.2), 0), (u(s0 + .2), 0), (u(s0 + .85), 1), (u(end), 1))
    cue('lip', (u(0), 0), (u(1.3), 0), (u(1.4), 1), (u(g1), 1), (u(g1 + .12), 0), (u(end), 0))
    cue('mouth', (u(0), 0), (u(.75), 0), (u(1.3), 1), (u(g1 + .3), 1), (u(g1 + .75), 0), (u(end), 0))
    cue('look', (u(0), 1), (u(.45), 1), (u(.8), 0), (u(s0 - .1), 0), (u(s0 + .05), 1), (u(end), 1))
    cue('blink', (u(0), 0), (u(1.45), 0), (u(1.6), 1 if first else .0), (u(g1 - .1), 1 if first else 0), (u(g1 + .1), 0), (u(end), 0))
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


SEG['sip'] = drink(SEG['first'], True)
SEG['let'] = drink(SEG['sip'], False)
t0 = SEG['let']
body(t0, *CPOSE)
body(t0 + .15, *CPOSE)
body(t0 + .7, (-.015, 0, 0), (-.02, 0, 0), (0, 0, 0), (.02, 0, 0))      # eased back past upright
body(t0 + 1.0, (.004, 0, 0), (.006, 0, 0), (0, 0, 0), (.03, 0, 0))      # the micro-overshoot back
body(t0 + 1.4, *ZERO)
GLASS += [(t0, 'on'), (t0 + .15, 'on'), (t0 + .32, 'off'), (t0 + .72, 'back'), (t0 + 1.08, 'restpast'), (t0 + 1.4, 'rest')]   # (off the glass and back, unhurried)
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

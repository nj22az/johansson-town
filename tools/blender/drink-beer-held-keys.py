# ---- the keys of a glass held in the hand with nowhere to set it down (seconds; the game's frame, the body's root at the origin)
# (included by tools/blender/drink-beer.py --table held: written here so the performance reads on its own; the rig and the bake
# are there, and the table's keys, which this follows beat for beat, in tools/blender/drink-beer-keys.py)
#
# THE BRIEF (docs/ANIMATION-STANDARD.md section 4, step 1). Who: a resident with a glass of beer and no table or counter at hand:
# standing (a glass carried from Minato's counter as they get up, a shop's), or seated where there is nothing to set it on
# (Mr Fujita in his chair in the shed with the ballgame on, Tetsuo and Erik outside Kissa Higa of an evening). Register: everyday
# (calm, friendly; no "kaa!" push: that is the first draught's, of a fresh glass at a table). Primary: the glass (the right hand);
# secondary: breathing, the swallows, the head; the free left hand stays where the body keeps it (Johansson's in his pocket).
# Every part starts and ends on the same pose, H: the glass held before him at the waist in his right hand, upright, its
# drinking side toward him, the forearm a little under level and the elbow by his side, the head a little down to it.
#   HOLD  0-0.5      H, still (the game blends the body into it from where the animator has it, and holds it between sips)
#   SIP   0.5-4.75   the table's SIP, beat for beat: still to 0.2 (the eyes on the glass); anticipation 0.2-0.5 (a small breath in,
#                    the glass drawn down 15 mm and in toward him: the counter-move, opposite to the lift, 40% of its length);
#                    the lift on an arc 0.5-1.25 (slow out, the elbow rising and coming forward), contact 1.25-1.4 (the head
#                    coming down to meet the rim), the draught 1.4-2.1 (the glass going over as the beer goes down, the head
#                    back, one swallow), off the lip 2.1-2.4 and down on an arc to his chest, a content breath out 2.4-2.75,
#                    lowered to H on an arc 2.75-3.6 (an anticipation up first), past it 6 mm and back (the follow-through of
#                    a glass with nothing under it), still from 3.95 of it.
#   LAST  4.75-9.0   the last of the glass at the sip's times (the game blends the two by how far over the beer left needs
#                    the glass): from a quarter full to empty, the glass toward horizontal, the head back further, the elbow
#                    up higher, the eyes shut on it.
# Overlap: the spine leads every pose by 4 frames; the head after the eyes by 5; the forearm and hand dragged 3 frames at the
# bake. Arcs: every stroke of the glass through a breakdown off its chord.

k = M['k']
TIMES = {}


def mark(name, t):
    TIMES[name] = t
    return t


ROOT0 = Vector(K['seated']['root'])
RB = V['outline'][1][0] if V['outline'][1][0] > .01 else V['outline'][2][0]   # the foot's radius
TILT = V['tilt']


def tilt_for(fill):
    """How far the glass must be tipped (radians, from upright) for what is left to reach the rim (the kit's table)."""
    fill = max(0.0, min(1.0, fill))
    for (f0, a0), (f1, a1) in zip(TILT, TILT[1:]):
        if f0 <= fill <= f1:
            return a0 + (a1 - a0) * (fill - f0) / (f1 - f0)
    return TILT[-1][1]


# (the sip's and the last's fills as at the table: the game's portion is what it is, and tips the glass as far as it needs)
FILLS = {'mug': (.9, .62, .52), 'pint': (.9, .64, .55), 'glass': (.85, .45, .32)}[VESSEL]
LAST_FILLS = (.22, 0.0)
HEADBACK = {'mug': 1.0, 'pint': .9, 'glass': .7}[VESSEL]
LAST_HEAD = 1.55

# H: the wrist before his right hip, the forearm a little under level from an elbow by his side (in his size), the glass upright
# in the hand, its drinking side toward him, turned in a little (0.1 rad) as a forearm brought across holds it
H_WRIST = Vector((-.2 * k, Vector(K['bones']['elbowR']).y - .05 * k, .2 * k))
H_TURN = Quaternion((0, 1, 0), .1) @ Quaternion((0, 1, 0), math.pi)
_SOCK = Matrix.Translation(Vector(V['socket']['position'])) @ Quaternion((V['socket']['quaternion'][3], *V['socket']['quaternion'][:3])).to_matrix().to_4x4()
_HAND0 = (H_TURN.to_matrix().to_4x4() @ _SOCK.inverted()).to_translation()     # (the wrist from the glass's foot, the glass so turned)
SPOT = H_WRIST - _HAND0                                                       # the glass's foot at H
TOP = SPOT.y                                                                  # (no table: for the export's record, the foot's height at H)


def counter_at(dz=0.0, tip=0.0, dx=0.0, lift=0.0):
    """The glass at H (moved dz away from him, dx to his left, `lift` up), tipped `tip` away from him."""
    return Matrix.Translation(SPOT + Vector((dx, lift, dz))) @ (Quaternion((1, 0, 0), tip) @ H_TURN).to_matrix().to_4x4()


HPOSE = ((0, 0, 0), (0, 0, 0), (0, 0, 0), (.04, -.02, 0))                      # standing easy, the head level, the glass held
CPOSE, ZERO = HPOSE, ((0, 0, 0), (0, 0, 0), (0, 0, 0), (0, 0, 0))             # (the pose the parts join on, and the spine's lead: drink-beer.py)
BODY, GLASS, LEFT, POLES_R, CUES = [], [], [], [], {c: [] for c in ('closeR', 'closeL', 'blink', 'breath', 'smile', 'look', 'kaa', 'foam', 'swallow',
                                                                    'shrug', 'lip', 'mouth', 'counter', 'hold', 'wipe', 'lean', 'fill')}


def cue(name, *tv):
    CUES[name] += list(tv)


def body(t, spine, chest, neck, head):
    BODY.append((t, spine, chest, neck, head))


POLE_HOLD, POLE_UP, POLE_LAST, POLE_DOWN = (-.6, .5, -.2), (-.75, 1.1, .25), (-.8, 1.35, .3), (-.6, .7, -.05)
# the held glass's own places (drink-beer.py glass_pose takes these first)
PLACES = {
    'h': lambda t: hand_for(counter_at()),
    # (the anticipation: drawn down and in toward him, opposite to the lift)
    'hdip': lambda t: hand_for(counter_at(dz=-.012, lift=-.015, tip=math.radians(-3))),
    # (the lift's breakdown: up and out, the elbow coming forward, the glass beginning to go over)
    'hup': lambda t: hand_for(can_at(SPOT + Vector((.005, .11, .04)), can_turn(math.radians(6), .08))),
    # (the lowering's anticipation, a touch up; its breakdown out on an arc; past H by 6 mm, as a glass with nothing under it
    # carries on a little, and back)
    'hset': lambda t: hand_for(can_at(LOW_AT + Vector((0, .02, -.01)), can_turn(math.radians(4), .1))),
    'hmid': lambda t: hand_for(can_at((LOW_AT + Vector((0, .02, -.01))).lerp(SPOT, .55) + Vector((0, .02, .03)), can_turn(math.radians(2), .1))),
    'hpast': lambda t: hand_for(counter_at(lift=-.006)),
}


def sip(t0, kind):
    """SIP or LAST from H at t0: the table's sip, its glass lifted from the hand and not off a table."""
    last = kind == 'last'
    u = lambda s: t0 + s
    fill0, fill1 = LAST_FILLS if last else (FILLS[1], FILLS[2])
    g1, s0 = 2.1, 2.75
    hb = HEADBACK * (LAST_HEAD if last else .5)
    end = s0 + 1.5
    body(u(0), *HPOSE)
    body(u(.2), *HPOSE)
    body(u(.5), (0, 0, 0), (-.02, 0, 0), (0, 0, 0), (.13, -.04, 0))           # anticipation: a breath in (the chest up), the eyes on it
    body(u(1.25), (0, 0, 0), (-.03, 0, 0), (-.02, 0, 0), (-.03, 0, 0))        # the glass at the mouth
    body(u(1.4), (0, 0, 0), (-.03, 0, 0), (-.01, 0, 0), (.02, 0, 0))          # contact: the head comes to meet it
    body(u(g1 - .45), (-.03 * hb, 0, .01), (-.08 * hb, 0, 0), (-.12 * hb, 0, 0), (-.27 * hb, 0, 0))   # the head back
    body(u(g1), (-.03 * hb, 0, .01), (-.08 * hb, 0, 0), (-.12 * hb, 0, 0), (-.26 * hb, 0, 0))         # held till it leaves
    body(u(g1 + .3), (-.01, 0, 0), (-.03, 0, 0), (-.03, 0, 0), (-.06, 0, 0))                          # off the lip
    body(u(g1 + .55), (.008, 0, 0), (.015, 0, 0), (.01, 0, 0), (.05, 0, 0))   # a small breath out
    body(u(s0), (0, 0, 0), (0, 0, 0), (0, 0, 0), (.08, -.03, 0))              # looks down to the glass (the eyes first)
    body(u(s0 + .85), (.005, 0, 0), (.005, 0, 0), (0, 0, 0), (.1, -.04, 0))   # down at H, a touch past
    body(u(s0 + 1.2), *HPOSE)
    body(u(end), *HPOSE)
    GLASS.extend([(u(0), 'h'), (u(.2), 'h'), (u(.5), 'hdip'), (u(.75), 'hup'), (u(1.05), ('in', 34, 24) if last else 'in'), (u(1.25), ('lip', -8, .025)),
                  (u(1.4), ('lip', None, 0)), (u(1.4), ('pull', u(1.4), u(g1), fill0, fill1)), (u(g1 + .3), ('lip', 34 if last else 20, .06)), (u(g1 + .65), 'chestlow'),
                  (u(s0), 'chestlow'), (u(s0 + .2), 'hset'), (u(s0 + .55), 'hmid'), (u(s0 + .85), 'hpast'), (u(s0 + 1.15), 'h'), (u(end), 'h')])
    up = POLE_LAST if last else POLE_UP
    POLES_R.extend([(u(0), POLE_HOLD), (u(.5), POLE_HOLD), (u(1.05), up), (u(g1), up), (u(g1 + .55), POLE_DOWN), (u(s0 + .2), POLE_DOWN),
                    (u(s0 + .85), POLE_HOLD), (u(end), POLE_HOLD)])
    cue('closeR', (u(0), V['hold']['amount']), (u(end), V['hold']['amount']))
    cue('hold', (u(0), 1), (u(end), 1))
    cue('counter', (u(0), 0), (u(end), 0))
    cue('lean', (u(0), 0), (u(end), 0))
    cue('lip', (u(0), 0), (u(1.33), 0), (u(1.44), 1), (u(g1), 1), (u(g1 + .12), 0), (u(end), 0))
    cue('mouth', (u(0), 0), (u(.75), 0), (u(1.3), 1), (u(g1 + .3), 1), (u(g1 + .75), 0), (u(end), 0))
    # (the eyes on the glass only to take it up and to put it back: between sips he looks out, not at it)
    cue('look', (u(0), 0), (u(.05), 0), (u(.25), 1), (u(.8), 1), (u(1.0), 0), (u(s0 - .1), 0), (u(s0 + .05), 1), (u(s0 + 1.0), 1), (u(s0 + 1.35), 0), (u(end), 0))
    shut = .85 if last else 0
    cue('blink', (u(0), 0), (u(1.45), 0), (u(1.6), shut), (u(g1 - .1), shut), (u(g1 + .1), 0), (u(end), 0))
    cue('breath', (u(0), 0), (u(.2), 0), (u(.4), .5), (u(.5), 0), (u(g1 + .25), 0), (u(g1 + .45), .6), (u(g1 + .9), 0), (u(end), 0))
    cue('kaa', (u(0), 0), (u(end), 0))
    cue('shrug', (u(0), 0), (u(end), 0))
    cue('smile', (u(0), 0), (u(g1 + .3), 0), (u(g1 + .6), .7), (u(s0 + .85), .3), (u(end), 0))
    cue('swallow', (u(0), 0), (u(1.63), 0), (u(1.75), 1), (u(1.93), 0), (u(end), 0))
    cue('fill', (u(0), fill0), (u(1.45), fill0), (u(g1 - .05), fill1), (u(end), fill1))
    cue('foam', (u(0), 0), (u(end), 0))
    cue('wipe', (u(0), 0), (u(end), 0))
    return t0 + end


SEG = {'hold': 0.0}
body(0, *HPOSE)
body(.5, *HPOSE)
GLASS += [(0, 'h'), (.5, 'h')]
POLES_R += [(0, POLE_HOLD), (.5, POLE_HOLD)]
for c, v in (('closeR', V['hold']['amount']), ('hold', 1), ('look', 0)):
    cue(c, (0, v), (.5, v))
SEG['sip'] = .5
SEG['last'] = sip(SEG['sip'], 'sip')
duration = sip(SEG['last'], 'last')
for c in ('blink', 'breath', 'kaa', 'shrug', 'swallow', 'lip', 'mouth', 'foam', 'wipe', 'smile', 'counter', 'lean'):
    CUES[c].insert(0, (0, 0))
CUES['fill'].insert(0, (0, FILLS[1]))
cue('closeL', (0, 0), (duration, 0))
mark('end', duration)
for n, t in SEG.items():
    mark(n, t)
LEFT += [(0, 'rest'), (duration, 'rest')]
TS, TL = SEG['sip'], SEG['last']
SHEET_PICKS = [0, TS + .5, TS + .9, TS + 1.25, TS + 1.75, TS + 2.4, TS + 3.0, TS + 3.6, TL + .9, TL + 1.25, TL + 1.75, TL + 2.4, TL + 3.6, duration]
SHEET_STORY = [0, TS + .5, TS + 1.75, TS + 2.4, TL + 1.75, TL + 3.6]

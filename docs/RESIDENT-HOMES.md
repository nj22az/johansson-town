# Homes and the overnight town

The active cast remains ten human residents, plus Tama the cat. The existing
Harbour master runs the office computer and files its binders; there is no extra
office clerk. Every human resident owns one persistent, visitable apartment in
the supplied residential street. Four entrances serve two separate flats each;
two serve one home. These are neighbours sharing an entrance, not new households
or duplicate characters.

| Willow Alley entrance | Apartments | Daily work |
| --- | --- | --- |
| 1 | Nao — 1A; Thuan — 1B | Minato Izakaya; Sakura |
| 2 | Aya — 2A; Reiko — 2B | Front-Row Books & Press |
| 3 | Mrs Sato — 3A; Tetsuo — 3B | Sakura frontage; repairs |
| 4 | Kenji — 4A; Officer Mori — 4B | Repairs; night patrol |
| 5 | Harbour master | Harbour office |
| 6 | Bus driver | Main Street bus stop |

Addresses come from `residential-layout.js`. Nameplates, home records, apartment
selection and the conversation question “Where do you live?” all use those same
addresses. Current friendships and discoveries use the active profiles in
`residents.js`; the archived larger roster is retained for asset/source history.
Home IDs, saved identities and the cast size are unchanged.

Each resident has a complete daily schedule: work, meal visits, time at home and
sleep. Home interiors reuse the resident's street actor, with walking to the
table and bed, breakfast, preparation, reading, tea and planning errands. Leisure
changes every half hour using the saved clock. A resident must reach their actual
door before a room can borrow them; departures walk out through that door.

Officer Mori patrols from 22:00 until 06:00, including rainy nights, and sleeps
07:00–15:00. Nao works at Minato from 16:00 until 03:00, sleeps 04:00–12:00 and
has ramen at 13:00–14:00, after breakfast and preparation. Kenji's ramen break is
09:15–11:00. The restaurant reserves at most two visitor stools, with Thuan's
separate after-work place. Tetsuo retains his 00:00–02:45 supper visit; Thuan keeps
her alternating evening visit to Nao.

Indoor saves restore to the current door of the saved home, shop or workplace.
If the clock now calls for a different activity, the resident leaves from that
door and continues on foot. Outdoor saves preserve walks in progress. Residents
continue their schedules off camera and while the player is inside another room.

Validation covers all ten selectable and reachable homes, furnished sleep/wake/
breakfast/departure transitions, two full days in clear and rainy weather, current
address dialogue, moved-door save restoration, meal seating and ordinary walks.
The available browser cannot initialise WebGL; automated checks do not establish
visual quality or device frame times.

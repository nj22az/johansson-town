# Speech placement and portrait conversation QA

Captured through the local Johansson World MCP server on 17 October 2026, using normal Town Book, walking, look, conversation and close controls. These are unedited game screenshots. The original views below use source sessions; the final phone release check uses the compiled runtime.

## Selected views

- `desktop-higa-side-bubble.png`: Higa speaks beside Johansson. The complete line wraps into a 360 px side column and both faces stay clear. A short normal move along the veranda gives this unobstructed camera angle.
- `phone-higa-bubble.png`: 390 × 844 portrait view, with both characters in frame, Higa’s complete welcome line, and both reply buttons visible.
- `phone-johansson-reply.png`: the same phone conversation during Johansson’s reply. The balloon changes its placement and speaker portrait while the shared camera stays steady.

The phone portraits exposed a separate camera issue: the previous wide-screen shoulder shot put one head partly outside the 390 px view and the other almost entirely outside it. Portrait conversations now choose a shared camera position with a clear lens and a clear sightline to each person. In the tested Higa courtyard, the selected lens is about 6 m from the pair and uses the normal zoom. Closing the conversation restores the ordinary walking view and leaves the chosen first/third-person preference unchanged.

## Recorded checks

- Walked from Sakura to the Higa gate and through its actual entrance path. No relocation or unlocked shortcut was used.
- Desktop rakkyō line stayed at exactly 360 × 210.34375 px while changing from a few typed characters to the complete sentence. Both protected face and body rectangles had zero balloon overlap.
- Phone Higa’s welcome balloon occupied x 12–260, y 12–365.44. Higa’s protected face began at y 371.93 and Johansson’s at y 395.08. Both heads and both reply buttons were in view.
- Phone rakkyō line used a 192 × 328.25 px right column; Johansson’s reply used a 192 × 51.19 px left balloon. Both cleared the protected face and body rectangles.
- Normal conversation close removed the balloon, unblocked walking and retained third-person preference in the tested session.
- A constructed-town collision check accepted the portrait camera at approximately (−25.74, 2.00, −25.85), with clear paths to both heads.

## Automated verification

All 22 named native tests passed:

- `tests/balloon-layout.test.mjs`: 8, including clipping bounds, typewriter footprint, motion stability, both-head portrait projection, collision-safe camera selection and exceptionally long text.
- `tests/neighbour-chats.test.mjs`: 3.
- `tests/dialogue-rpg.test.mjs`: 7.
- `tests/conversation.test.mjs`: 2.
- `tests/activity-lifecycle.test.mjs`: 2.

Game and MCP module syntax checks and `git diff --check` also passed. Source-session Google Fonts requests received certificate errors in this local environment, so these captures use the available fallback font; no game script exceptions or invalid scene transforms were observed.

The exceptional-text fallback was added after the pictured phone session: if a normal side column cannot keep characters clear, the line may use a clear wider band, and an unusually long line can scroll inside a clear reading area. Its focused tests pass. It does not change the photographed successful placements. The compiled phone release check below verifies the integrated speech layout and conversation camera after that addition.


## Compiled phone release check

A fresh MCP phone session loaded `boot-u9j_gLou.js` with `source: false` at 390 × 844. It used Sakura's normal bench start at 12:00. The release coordinator subsequently made ferry-only changes and verifies that final compiled graph separately; no speech, camera or Town Book changes were made between this pass and that rebuild.

- `phone-home-compiled.png`: the Town Book shows Grandmother Higa's home and current activity separately, with both Show home and Find person visible. The home target identifies Miss Higa and Grandmother Higa at Higa house, Nishi-machi. Show home returned a found ten-point walking route with exactly zero player displacement.
- All ten walking points to the named Higa gate and all seven courtyard points to the conversation prompt were reached using normal MCP walking controls.
- `phone-higa-compiled.png`: the complete rakkyō line wraps in a 192 × 328.25 px right column, at x 186–378 and y 52.89–381.14. Both character face and body rectangles have zero overlap with the balloon, and both reply buttons are visible. Johansson's ordinary “Tell me more” reply used a left balloon before Higa's next line.
- Normal close removed the speech bubble and activity, restored movement/look/interact/jump controls, and retained the chosen third-person preference. The browser then closed normally.
- No game asset 404 or script exception appeared. The six previously documented Google Fonts certificate entries remained, so the capture uses the available fallback font.

Raw observations, route results and exact screenshots are in the scratch evidence directory `bubbles-phone-compiled-evidence` (Town Book 003–005, walks 007–008, dialogue geometry 010–014, final Higa view 015, close 016–019). No source was changed during this release pass.

# Johansson Town WebMCP

Johansson Town exposes browser-native tools for AI agents using the current WebMCP draft (`document.modelContext`). The older `navigator.modelContext` alias is feature-detected as a compatibility fallback.

Specification: https://webmachinelearning.github.io/webmcp/

## Runtime behaviour

WebMCP is optional. The game still starts and remains fully playable when the browser does not implement WebMCP.

The modules retry briefly because browser extensions/polyfills may inject a model context shortly after page load. When no model context becomes available, the page reports `window.__JOHANSSON_WEBMCP__.status === 'unsupported'` and leaves normal controls untouched.

GitHub Pages supplies the required HTTPS secure context.

## Player tools

- `johansson_get_state` — read the current location, clock, wallet, nearby prompt, dialogue/activity and visible action buttons.
- `johansson_move` — move Johansson forward/back/left/right through the same keyboard control path used by a human player.
- `johansson_look` — turn the camera using the existing touch-look path.
- `johansson_jump` — use the real jump controller.
- `johansson_interact` — activate the nearby ACTION/TALK/ENTER interaction.
- `johansson_travel` — use the in-game town directory to travel to a named location.
- `johansson_choose_action` — press one enabled button in an open dialogue/activity, including quest, shopping and minigame actions.
- `johansson_ui` — operate notebook, time, weather, sound and modal controls.
- `johansson_concert` — configure the open Minato karaoke song book: song, six-genre arrangement, live text voice, stage energy, cast, title and four lyric lines. Read `concert.choices` for available values. `vocalSource`, `vocalNotice` and `vocalCue` expose live speech or the electronic fallback. `johansson_choose_action` operates Perform, Cheer!, Stop, Encore and Return to Minato. The machine must be opened in the game; this tool does not teleport or open it remotely. Movement and HUD actions remain blocked during a performance.

## Character tools

- `johansson_list_characters` — read Johansson and the four named residents with current positions.
- `johansson_control_npc` — temporarily move Nhung, Chin, Mrs Sato or the Harbour master, make them face another character, trigger a restrained gesture, or release AI control.

NPC movement is deliberately bounded to the playable street and limited in distance/time. Johansson himself is moved through the normal game input/collision path rather than direct position writes.

## Compatibility bridge

Even without native WebMCP, compatible browser-agent extensions can use:

- `window.__JOHANSSON_AGENT_API__`
- `window.__JOHANSSON_CHARACTER_CONTROL__`

These expose the same bounded game actions without exposing arbitrary JavaScript evaluation or raw Three.js internals.

## Security and design choices

The tools operate only in local game state. They do not expose account credentials, arbitrary navigation, arbitrary JavaScript execution, filesystem access or network write operations.

Actions that can spend in-game yen or advance a quest are explicitly described as mutating tools (`readOnlyHint: false`). Read-only state/list tools are annotated accordingly.

## Browser support

WebMCP remains an emerging browser API. Current Chromium implementations may require an origin trial, experimental feature or compatible extension/polyfill depending on browser version. The website therefore treats WebMCP as progressive enhancement rather than a boot dependency.

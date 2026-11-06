# AI gameplay testing

The local `johansson-town-audit` MCP server lets an AI inspect a running game, use real keyboard/mouse controls and menu buttons, examine standing collisions and floor heights, capture game pixels, and save reproducible findings. It uses the [official MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk). The existing browser-native WebMCP controls remain available in browsers that implement that API.

Run `npm install` and `npm run build` in `johansson-town`. The repository's `.mcp.json` supplies the server entry for clients that read project MCP configuration. In another client, configure a stdio server with command `node` and the **absolute** path to `johansson-town/tools/mcp/server.mjs` as its argument. `npm run mcp:audit` starts the same stdio server; its standard output is reserved for the protocol. `npm run audit:mcp` checks a complete actual-client/browser session.

No API key is required by the game server. The MCP client supplies the AI. Each `start_session` creates an isolated browser save and an ephemeral loopback preview of the compiled checkout. `headless:false` shows its test browser. It does not connect to the player's normal browser or edit that save. Closing the session releases the preview and browser. Developer packages are used by the local tester and are not added to the public game bundle.

Use the `audit_town` prompt, or ask the connected AI to:

1. Start a session and read `get_state` to learn what is currently possible.
2. Walk with `press_control`, a short `walk_to` target or `follow_path` waypoints. Interiors use their own local x/z coordinates; a doorway stops a route before later world waypoints can be misinterpreted. Check before/after displacement, collisions, floor height and screenshots. `walk_to` attempts a straight route; it never teleports or invents success.
3. Use `interact` through `press_control`, then select an exact enabled label with `choose_action`. Finish the interaction, walk to the exit, use `ui_control` for the visible Exit to street button, and verify the return route. Unavailable buttons are rejected.
4. Inspect a bounded collision grid with `inspect_navigation`. Static walls/steps determine connected components; every connecting edge is probed at 5 cm spacing, so thin walls between coarse cells are checked too. Residents are shown separately because they can move. Confirm suspicious cells with actual controls. Use `wait` to observe routines and ferry activity without movement.
5. Inspect `screenshot` for clipping, invisible vehicles, obstructed camera angles and odd NPC behaviour. Record an observed finding with expected behaviour and steps using `report_finding`.

Tools serialize their actions so two AI calls cannot hold conflicting controls. Movement and sampling are bounded. There is no arbitrary JavaScript, shell, teleport, fixture room entry or save-writing tool. Findings are saved with screenshot, state and input history under the repository's `output/mcp-audit` directory. An AI can judge something strange from pixels; passing a collision grid alone cannot prove every animation or layout is correct.

`get_state` includes the actual site doors/headings, current room bounds/spawn/exit, and visible interaction positions. The MCP session advances the normal simulation and avatar poses at 60 Hz after real input; between actions it holds simulation time and renders on demand. Camera turns settle through a real simulation tick before capture. This keeps long audits reproducible; it is not a benchmark of production frame rate.

The official-client tour helpers in `tools/mcp` write all calls, screenshots and coverage records. Their path planner only proposes routes from sampled collision cells; every route is then walked through ordinary controls. An attempted route, an accidentally crossed doorway and an entered room are recorded separately.

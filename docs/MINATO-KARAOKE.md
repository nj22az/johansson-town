# Minato karaoke

Enter Minato Izakaya between 16:00 and 03:00. Use the laserdisc karaoke machine at the end of the raised dining area, or choose **Sing karaoke · solo or with friends** from the wall menu. Opening the song book is free. The first performance costs ¥100; encores and further songs are included until returning to Minato.

Choose a song, arrangement and one to four performers. Open **Edit the title and lyrics** to write four short lines. Press **Perform**: the screen counts in four beats, then highlights each word over a live 3D performance. Groups alternate the first three verses and sing the final line together. A bow and applause finish the take. **Encore** repeats it, **Back to songs** changes it, and **Return to Minato** resumes the same position and seat. Escape also exits. Auto and fixed wide cameras, a sound toggle, reduced-motion support and keyboard focus trapping are included.

The three original templates are Harbour Lights, Island Bus Stop and Summer After Midnight. Each can use Island city pop (112 BPM), Power ballad (80 BPM), Neon disco (124 BPM), Stadium rock (128 BPM), Midnight enka (76 BPM) or Turbo eurobeat (160 BPM). These have different percussion, bass, harmony and lead-instrument patterns, not just different playback speeds. No Nintendo music, lyrics, character models, voices, choreography or extracted game files are used. This is an original implementation of the performance idea.

## Evidence and interpretation

- [Nintendo 3DS Tomodachi Life electronic manual](https://www.nintendo.com/eu/media/downloads/games_8/emanuals/nintendo_3ds_2/tomodachi_life/ElectronicManual_Nintendo3DS_TomodachiLife_EN.pdf), section 11, “The Concert Hall”, PDF page 26: solo and group singing, editable titles and lyrics, and individual lyrics for each solo singer.
- [Nintendo's 2015 Concert Hall contest](https://www.nintendo.com/en-gb/News/2015/July/Tomodachi-Life-Friendship-Fiesta-Concert-Hall-Contest-1038388.html) demonstrates the intended create-and-watch loop: players make original songs within the game's Concert Hall and record their performances.
- [REA](https://github.com/morluto/rea) was reviewed as the requested investigation reference. Its native workflow needs a local binary and analysis backend. No Tomodachi Life binary was supplied or analysed. The design here is informed by public documentation, not a claim about Nintendo's internal audio or animation code.

The implementation interprets that loop as a fixed musical score with replaceable text, an editable cast, clocked animation and directed cameras. Alternating parts, prices, arrangements and the Minato set are Johansson World's design choices.

## Implementation

- `src/music/songs.js`: bounded save data, four count-in beats, four eight-beat phrases and a four-beat bow. One score supplies word timing, melody and singer parts.
- `src/music/audio.js`: original Web Audio accompaniment and electronic fallback. `src/music/live-lyrics.js` reuses the town's browser speech helper for live edited text, character voice settings and word callbacks. See Live lyrics below for device support and timing limits.
- `src/music/stage.js`: shared World avatar builder and animator, stand microphones sized to each singer, original curtains, wood riser, speakers and sign. Uses the existing game renderer; no second WebGL context. Cast changes and exit dispose avatar skeletons and stage resources.
- `src/music/concert.js`: responsive song book and live performance, lazy-loaded from the physical machine. Opening does not spend money. Cancellation invalidates pending audio unlocks. Sound schedules a bounded 450 ms window ahead (with cancellable subdivisions inside each beat) and skips stale notes; backgrounding, page exit, interruption, Stop and Return cancel sound. Lyrics are inserted as text, never HTML.
- `state.concert`: song, cast and completed performances, saved per player and retained through the annual loop. No live audio handles or temporary stage coordinates are saved. The session payment uses the game's receipt and ledger system.
- WebMCP: the normal state lists concert choices and visible actions. `johansson_concert` validates settings; the existing action tool presses the visible buttons.

## Verification

Run `node --test tests/concert.test.mjs tests/izakaya-play.test.mjs tests/year-loop.test.mjs tests/runtime-package.test.mjs tests/live-features.test.mjs tests/travel-webmcp.test.mjs` after `npm run build:runtime`.

Run `node tools/concert-smoke.mjs` with a Playwright Chromium installation, or set `CONCERT_BROWSER` to a browser executable. `CONCERT_QA_OUTPUT` selects the screenshot/report folder. Add `--game` to exercise the compiled World, the physical interaction and the WebMCP controls too; `--game-only` runs that route alone. The default browser test uses the real avatar meshes, WebGL renderer and Web Audio graph; it checks a complete song, a free encore, Stop, backgrounding, exit, focus, saved text and insufficient funds at desktop, phone and tablet viewport sizes.

Browser viewport checks do not establish real iPad Safari or device audio acceptance. Device listening remains a separate check.

### Acceptance recorded on 16 October 2026

The standalone Chromium 131 browser run passed its complete performance, audio output, caption, saved editing, encore, Stop, backgrounding, exit, focus and funds checks at 1280 × 800, 390 × 844 and 1024 × 768. The existing CPU full-game boot/interior smoke passed, as did the targeted source and runtime checks. Full-town browser navigation in this execution environment terminated the browser process before acceptance; that result is not counted as a visual pass. Physical iPad Safari and listening acceptance remain outstanding.

## Showtime upgrade

- **Live voices:** Cast, Low crooner, Bright alto, Stadium belt and Tiny superstar control the device text voice. New lyrics are spoken immediately. Unavailable speech selects the announced electronic fallback. The existing Qwen authoring tool remains available for offline recordings used in exports.
- **Stage energy:** Relaxed, Showtime or Go wild, saved with the song. Each genre directs different routines and expressions; leads and backing performers alternate, and everybody joins the final chorus.
- **Shared moves:** Disco point, Idol step-touch, Air guitar, Stadium rock singer, Dramatic ballad and Robot dance are in the common avatar animator and moves menu. Sing is also exposed in the menu. World and Studio use the same rig and definitions.
- **Direction:** handheld microphones, coloured rim light and slow stage beams, a disco ball, lead shots during verses, wide final choruses and facial/mouth timing from the musical score. The wide camera stays available. Reduced motion disables dance displacement, rotating beams and automatic shot changes.
- **Cheering:** choose Cheer! or press H while performing. A bounded, rate-limited electronic backing response raises the cast's energy for four beats. Stop/Return/backgrounding still cancels all scheduled sources, including the new vocal oscillators and cheers.
- **MCP:** read `concert.choices` and set `arrangement`, `voice` and `performance` through `johansson_concert`. Existing song/cast/title/lines controls still work. `johansson_choose_action` can press Cheer! as well as Perform, Stop, Encore and Return. Invalid options are rejected before any field changes.

Run `node --test tests/concert-showtime.test.mjs tests/concert.test.mjs tests/travel-webmcp.test.mjs`. Run `node tools/showtime-smoke.mjs` for the real-renderer six-genre browser checks; the same `CONCERT_BROWSER` and `CONCERT_QA_OUTPUT` variables apply. This fixture tests the published registration callbacks and original concert modules, not complete navigation through the town or a native browser WebMCP transport.


## Live lyrics and expressive bodies (17 October 2026)

Write a title and four short lyric lines directly in the open song book. Choose a genre, cast, Character voice and Stage energy, then Perform. The lyrics are spoken immediately through the device's browser TTS, reusing `src/people/thuan-voice.js`; no generation account, audio-file authoring, Qwen server or external API key is needed for live play. Test voice checks the device voice synchronously from a tap. Cast mode uses the character's existing pitch/speed profile, with available system voices and register choices. Operating-system voices may vary, may use their own network service, and require device listening acceptance.

This is rhythmic text-to-speech over the original arrangements. Browser TTS cannot guarantee note-accurate sustained singing or simultaneous multi-voice audio. Verses alternate speakers and the last line uses one TTS lead while all performers dance and mouth the chorus. Speech boundaries drive word highlighting when supported; the musical score supplies the fallback timing. Mouths follow actual speech start/end. Unsupported, failed or blocked speech is announced and switches to the existing electronic voice. Stale phrases never queue after a hidden tab. Stop, Return, muting and backgrounding cancel both speech and music. Native speech is outside Web Audio's export graph: a recording/export workflow still needs authored voice audio, such as the existing Qwen tool.

Go wild and Cheer! use shared Chicken dance, Jelly wobble and Overdramatic superstar moves alongside the genre choreography. Reduced motion keeps the body in a restrained singing pose.

The user's PoseCraft reference supplied useful expressive body arrangements and pose-to-emotion matching. Nine held poses are retargeted in `src/avatars/expressive-poses.js`: Heroic pride, Victory pose, Deep thinker, Heartbreak, Battle rage, Startled panic, Shy and bashful, Grand grace and Sleepwalker. They use World's rig, face painter, easing, breathing and foot grounding, without a fixed mannequin height or extra rendering engine. They appear in the shared moves list, photo studio and Johansson Studio. Automatic expression in the character preview matches their faces; explicit face selections still override it. Studio adds Match pose emotion and Surprise me controls.

### Further reference: Tomodachi Life Modding

The community [3DS TTS documentation](https://tlmodding.com/documentation/tomodachi-life-3ds/text-to-speech/) describes runtime voice synthesis controlled by pitch, speed, quality, tone, accent and intonation. It suggests singing reuses speech with timing, effects and note control, but explicitly marks singing documentation as unfinished. This is reference evidence, not a complete singing implementation or a supplied distributable engine.

Its [event-flow documentation](https://tlmodding.com/documentation/tomodachi-life-3ds/event-flows/) describes messages, conditions and character animation/scene properties. The useful architectural lesson for World is to keep lyric text, voice parameters and performance cues coordinated while remaining separately editable. World's own score and performance director implement that separation. No Nintendo engine, voice model or extracted asset is added.

### Validation

`node --test tests/live-lyrics.test.mjs tests/expressive-poses.test.mjs tests/concert.test.mjs tests/concert-showtime.test.mjs tests/voices.test.mjs tests/travel-webmcp.test.mjs` covers edited words, distinct voice choices, boundary events, stale callbacks, cancellation, mute, unavailable speech, bounded delivery, shared poses and valid emotions. `tests/avatar-floor-contact.test.mjs` covers grounding across the added moves. Johansson Studio's unit suite also runs.

`tools/showtime-smoke.mjs` runs the real WebGL/Web Audio stage and native speech fallback. `--live-lyrics` exercises custom words, Test voice, per-word callbacks, alternating speakers and cancellation using simulated browser speech events; this establishes the game wiring, not native speaker output. `tools/expressive-poses-smoke.mjs` renders the nine poses with their actual avatar bodies and faces. Physical Safari/iPhone listening remains outstanding; use Test voice on the target device.

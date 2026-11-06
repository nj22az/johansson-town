# Hugging Face asset pilot — checkpoint, 8 September 2026

## Delivered

- Five isolated prop references: analogue radio, mechanical rice cooker, outdoor AC condenser, wooden stool and fish crate. Generated with the built-in OpenAI image tool, **not FLUX or Hugging Face**. Exact prompts are in `prompts.json`; image hashes are in `status.json`. They are authoring references, not flat photographs pasted into the 3D world.
- Four Japanese voice clips generated through Qwen's public Hugging Face Space. Aiko has three spoken subjects; Kenji has one. Japanese and English subtitles match the submitted scripts. Completed clips are explicitly listed in `src/people/voice-lines.js`; missing clips cause no runtime fetches.
- Ten authored voice requests in `voices.json`, per-output provenance, an audio validation report, and offline authoring scripts in `tools/`.

## Blocked

No TRELLIS mesh was exported. The service returned `You have exceeded your ZeroGPU quota (60s requested vs. 0s left)`. Qwen then returned the same limit with 90s requested. The public APIs initially hid this behind generic error events; the standard Gradio client revealed the quota message. Generation stopped when the limit became explicit. The connected account is not Pro, so no paid Jobs were submitted. No subscription was purchased.

Six voice lines and all five 3D props remain pending. Existing game props and collision are intact. No claim is made that the five reference images are playable 3D assets.

## Resume with available GPU access

From the game directory, `python -u tools/generate-pilot-voices.py` resumes missing voices using the public API and stops on any error. For authenticated TRELLIS access, install `gradio_client==2.6.1`, configure the standard `HF_TOKEN` environment variable outside source control, then run `python tools/generate-pilot-props.py radio` (or another listed prop). Never embed a token in the browser. Public API shapes can change; the prop helper is a prepared workflow, not a verified successful export in this session.

Before promoting a new voice, confirm its Japanese pronunciation and add its matching subtitle/topic to `src/people/voice-lines.js`. The final radio bulletin belongs at the stall radio, with positional playback; it is not yet integrated.

Before promoting a raw GLB: inspect all sides in Blender, repair open/thin geometry, reduce to roughly 2–5k triangles per small prop, bake a shared 1K material, set metres and pivot, validate texture embedding and materials, then replace only the visual child of the existing interactive object. Preserve its collision and E action, and retain its procedural fallback. TRELLIS's public export minimum is 100k faces, which is too heavy to ship directly for every small prop. Record final hashes and actual triangle/material counts.

Model references: [TRELLIS.2-4B](https://huggingface.co/microsoft/TRELLIS.2-4B), MIT model/code; [Qwen3-TTS CustomVoice](https://huggingface.co/Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice), Apache-2.0 model. Model licences are distinct from the provenance of generated outputs. No weights, unverified asset pack or Google data were added.

## Verification limits

Reference images were visually inspected. WAV headers, durations, channels, hashes and non-silence were checked. Automated dialogue, cancellation and existing game regressions are covered by tests. Native Japanese listening, WebGL rendering and device frame rates are not verified in this environment. Nothing was deployed to the live game.

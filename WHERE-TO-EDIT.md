# Where to edit this folder

This folder is published to the live site from the work branch `claude/sjoskolan-youtube-strategy-gofi3o`
(workflow `.github/workflows/johansson-town-live.yml`, which tests a push and copies `johansson-town/` and
`avatar-creator/` onto `main`). The copy on `main` is the published result.

- Make changes on the work branch, not directly on `main`. A change made directly on `main` stops all publishing
  until someone merges `main` back into the work branch.
- If you must change `main` directly, say so in the commit message, so the next merge can carry it over.

Johansson World (the game) is `johansson-town/`; Johansson Studio (the web studio) is `avatar-creator/` and runs on
World's own code.

# Harbour office and town cleanup

The harbour office computer and binders open three real Excel workbooks inside the existing game modal. Players can switch sheets, search records, inspect formulas and download each `.xlsx` to edit on their device. The in-game view is a read-only preview of the shipped records; edits to a downloaded file do not alter the town save.

| Workbook | Prepared calculations |
| --- | --- |
| Berth register | Scheduled time alongside, call count and vessels alongside |
| Warehouse stock | Opening + received − issued, reorder quantity and negative balances |
| Marine service log | Remaining hours, unclosed jobs and overdue work against an editable review date |

All three contain six fictional records dated 14 September 1988, 20 prepared entry rows, Excel filters, frozen headings, typed dates/numbers and input validation. Blue cells are inputs; calculated cells use a neutral fill. The service log requires a closed date to finish a job. Zero quantities and hours are valid inputs.

`scripts/build-office-workbooks.mjs` authors the files with `@oai/artifact-tool`, verifies changed-input calculations, renders review images, and exports both the workbooks and their matching `catalogue.json`. Run it with the primary runtime Node in an authoring directory where the runtime's node_modules is available. Its two arguments are the workbook output directory and review directory. The game itself has no spreadsheet-engine dependency.

The existing Harbour master is the only office worker. He alternates seated typing and filing service certificates at the binders, respects his existing work/break/home schedule, and uses the room's real furniture collision. The visitor desk and chair remain accessible. NPC work never invokes player actions, downloads files, or changes the player's money or inventory.

The same update removes the harbour bus hut and raised shrine approach/platform, puts both restaurants beside Main Street, and rotates Willow Alley by 90 degrees onto the straight westbound road. Doors, home nameplates, bridge height, canal bounds and collision rotate together. The park loses exactly one entrance bush and its detached pink tree card; the other eight bushes and the cherry tree remain.

Validation covers OpenXML contents and cached results, download filenames, search/formula display, async modal closing and retry, the clerk's complete typing/filing/departure cycle, seated animation support, all door entries/exits, road clearance, streamed model placement, and the rotated bridge's rendered surface. Production build passes. A rendered 3D/browser check was unavailable in this environment; native Excel/Numbers applications were not run.

The full suite retains five pre-existing failures: the inactive full-town scene, two Inakaya guest expectations, the old standalone office script, and the Kenji voice/subtitle expectation. They are unrelated to this update.

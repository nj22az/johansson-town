# Community Hall document register

Johansson Town uses English for player-facing text, signs, printed pages, menus and dialogue. The setting remains Okinawa in 1997, including yen prices and local names. Original Japanese voice recordings remain on disk with their provenance; English dialogue uses the existing character sounds instead of playing those recordings under different subtitles.

## Where to find the records

Open the labelled Document Register cabinet in the Community Hall office, or the archive interaction in its community kitchen. The register combines papers found around town, the three existing office spreadsheets, monthly opening history, and records created during play. Search the title, body, reference, transaction or organisation; filter by organisation, document type or month.

Every document has a permanent reference, organisation, author, issue date, filing date and origin. Opening history is explicitly distinguished from observed play. Printed layouts can be downloaded as an A4 HTML page, ordinary document text can be downloaded, and the filtered register can be exported as CSV. Native Excel workbooks remain available in the Harbour Office records view; archived workbook entries index their contents rather than editing the original files.

## Filing and retention

The archive is stored in each player's save. Shop sales, supplier orders, invoices, payments, deliveries and ledger postings file at their source, before the shorter shop journal is trimmed. Visitor spending also files a receipt and related ledger entry. Reading a newly generated notice files it; the existing authored town papers are indexed from the start. Refiling the same source updates its contents while retaining earlier versions.

Retention is a rolling 365 in-game days, based on absolute town minutes. Records expire at the exact boundary. A monotonic retention watermark prevents turning the clock back from resurrecting expired files; reference numbers are never reused. Audit findings retire when all their evidence has expired. Records are not archived for a real-world year if the player speeds up the town clock.

## Auditing

Related records link by reference and transaction. Follow a supplier order through delivery, invoice, receipt and ledger. Audit checks compare ordered and delivered quantities, delivered and invoiced quantities, invoice and payment amounts, and missing referenced documents. Missing evidence is flagged for verification because it may have legitimately expired. Evidence notes and resolution status persist; resolving a finding requires notes. Audit reports are themselves filed in the central register and subsequent changes retain earlier versions.

The opening bottled-tea transaction deliberately orders 20 boxes, receives 18 and invoices 20. It provides an inspectable audit exercise. Routine opening handovers and community flyers span the previous twelve months; they are authored fiction and do not assert that the player performed those actions.

## Template sources and implementation

The Microsoft Japanese Office catalogue is a reference for practical form categories: purchase orders, delivery notes, invoices, sales sheets, attendance, schedules, handovers, telephone messages and local event flyers. The implemented forms are original English equivalents; no Microsoft template artwork or downloaded template file is redistributed. The catalogue's free download statement alone does not establish game redistribution rights.

Reference catalogue: https://www.microsoft.com/ja-jp/office/pipc/
Community flyer examples: https://www.microsoft.com/ja-jp/office/pipc/chiiki/03/

The pre-existing town Excel workbooks supply the three spreadsheet records. `scripts/build-town-papers.mjs` extracts authored papers and workbook catalogue contents during runtime builds, keeping the searchable index consistent with the world. `scripts/english-inventory.mjs` rejects Japanese text in runtime literals, excluding the explicitly retained voice provenance module.

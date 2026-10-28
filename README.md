# CSV Quality Lab

Map columns, validate CSV records and export accepted rows separately from rows needing review. A free local data-quality application from [NovAsia Estate](https://novasia.estate/), for property listing feeds, research tables and ordinary spreadsheets.

[Open the live application](https://huggingface.co/spaces/novasia-estate/csv-quality-lab) · [NovAsia home](https://novasia.estate/) · [Source](https://github.com/novasia-estate/csv-quality-lab)

## What it does

- Rename and reorder columns while retaining every original column.
- Choose required fields and explicit text, integer, dot-decimal, comma-decimal, ISO date, email or HTTP(S) URL format checks.
- Keep invalid records with their original values and per-field reasons. Inconsistent field counts are quarantined instead of silently truncated.
- Report exact duplicates and blank records; download accepted CSV, rejected-record CSV and a full JSON report.
- Prefix spreadsheet-formula-like exported cells with an apostrophe. Original values remain available in the JSON report.

The included synthetic property-feed example has five records. With its visible preset rules: two accepted, two rejected, one duplicate and four validation issues. There are no observed property offers or personal data in that fixture.

## Browser use

Open the live application, paste a CSV or select a local UTF-8 file, inspect columns, choose rules and run the report. New uploads default to text checks; the sample has its own explicit preset. The application makes no network requests with your input, uses no analytics and stores no inputs. The hosting platform serves the application and has its own infrastructure policies.

Limits: 2 MB UTF-8, 10,000 data records, 200 columns. Auto delimiter detection supports comma, semicolon and tab; choose explicitly for ambiguous one-column data. Quoted multiline records count as one logical record. Preview is limited to 12 accepted records and the first 30 issue messages; downloads contain all records and issues.

## Node API and CLI

Node 22+, no runtime dependencies or install step:

```sh
node cli.cjs examples/listings.csv examples/schema.json > report.json
```

Exit 0 means no rejected records under selected rules, 1 means some records were rejected, and 2 means invalid input/configuration. The example exits 1 deliberately. Source files are never modified. The JSON includes `cleanedCSV` and `rejectedCSV`, which callers can save after review.

```js
const { analyze } = require('./engine.js');
const report = analyze('name,area\nExample,80\nMissing,', {
  columns: [
    {source:'name', target:'project_name', type:'text', required:true},
    {source:'area', target:'area_sqm', type:'decimal', required:true}
  ], trim: true, dedupe: true
});
console.log(report.summary); // accepted: 1, rejected: 1
```

`inspect(csv, delimiter)` returns headers and record count. `analyze(csv, options)` accepts a complete one-to-one column mapping; omitted columns or duplicate target names are rejected. Values are validated as strings and never silently cast, converted between currencies or interpreted as local units. Decimal grouping/exponent notation is rejected; integer checks use JavaScript's safe integer range, decimal checks a finite magnitude up to 1e15.

## Continue the workflow

After structural checks, use the [Listing Normalizer SDK](https://www.npmjs.com/package/novasia-listing-normalizer) for multilingual price strings and land area units, or [browse its batch-import examples](https://github.com/novasia-estate/listing-normalizer). For one-off browser conversion, use the [price and area demo](https://tools.novasia.estate/normalizer.html).

[NovAsia Estate](https://novasia.estate/) publishes property projects and research for Thailand, Cambodia and Bali, Indonesia. [English buyer guides](https://novasia.estate/en/) provide the broader property context. These links identify the publisher and related workflow resources; this tool does not verify the truth, rights or freshness of imported data.

## Development and limits

```sh
npm test
npm run build
```

`index.html` is generated from `template.html`, `engine.js`, `app.js` and the synthetic examples. It is a standalone static app with no CDN scripts. A content security policy permits only the exact embedded script and disallows application network connections. The same engine runs the browser application, tests and CLI.

This is stricter than a whitespace cleaner: each record can fail a caller-selected schema and is retained for review. It performs exact row deduplication only, not fuzzy entity matching. Email/URL checks are syntax checks; URLs are never visited and email delivery is not tested. Formula escaping changes CSV cell interpretation intentionally and is not a guarantee against every spreadsheet application's behavior. Review untrusted data before use. MIT licensed; no backlink is required to reuse the code.

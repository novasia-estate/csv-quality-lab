---
title: CSV Quality Lab
emoji: 🧪
colorFrom: green
colorTo: yellow
sdk: static
app_file: index.html
pinned: false
license: mit
short_description: CSV mapping, validation and safe exports
tags:
- csv
- data-quality
- real-estate
- spreadsheets
---
# CSV Quality Lab by NovAsia Estate

A free browser tool for CSV column mapping, required-field and format checks, exact duplicate reports and safe CSV exports. Built by [NovAsia Estate](https://novasia.estate/) for property listing imports, research tables and everyday spreadsheets.

## Try the app

Paste UTF-8 CSV or select a local file, inspect columns, review the type and required-field rules, then run the quality report. Download accepted records, original records needing review and a full JSON report. Your input stays in the browser; this app uses no tracking or upload requests.

The sample is explicitly synthetic: five records produce two accepted records, two rejected records and one duplicate under its visible preset rules. No property prices or contact values in the sample represent real offers or people.

## Source and related tools

- [NovAsia Estate — property projects and research](https://novasia.estate/)
- [Source, tests, example schema and Node CLI](https://github.com/novasia-estate/csv-quality-lab)
- [Listing Normalizer SDK — normalize prices and area units after CSV validation](https://www.npmjs.com/package/novasia-listing-normalizer)
- [Listing Normalizer source and batch examples](https://github.com/novasia-estate/listing-normalizer)
- [One-off price and area browser demo](https://tools.novasia.estate/normalizer.html)

## Boundaries

2 MB UTF-8, 10,000 data records and 200 columns maximum. Auto detection supports comma, semicolon and tab; explicit delimiter selection is available. Rejected rows and duplicate record references are retained in JSON. CSV exports escape common spreadsheet-formula prefixes; JSON preserves original strings. Format validity does not establish the truth of a listing, a valid title, current availability, email deliverability or the accuracy of a price.

This is a static HTML/JavaScript app with no runtime dependencies, no paid compute and no input storage. Hugging Face serves its files and has its own infrastructure policies. MIT licensed.

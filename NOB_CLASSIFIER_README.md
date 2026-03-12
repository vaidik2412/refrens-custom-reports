# NOB Classifier — Reusable Business Persona Classifier

## Quick Usage

Drop any CSV with the right columns into this folder and run:

```
python3 nob_classifier.py <input.csv> <output.csv>
```

Or just tell Claude: **"Classify the businesses in [filename].csv using the NOB classifier"**

## What It Does

Classifies each business row into one of **7 Refrens personas**:

| # | Persona | What It Covers | Examples |
|---|---|---|---|
| 1 | Knowledge Services | Consulting, agencies, freelancers, professional services, healthcare, education, events, legal, accounting, marketing, design, HR, staffing, photography, travel, logistics, real estate, insurance, finance, cleaning, security, salon/spa, fitness, printing, publishing, entertainment, engineering, agriculture, veterinary | A design agency, a CA firm, a wedding photographer, a recruitment consultancy, a medical clinic, a coaching institute |
| 2 | S/w Product | SaaS companies, software platforms, tech product startups, app developers, AI/ML, cloud, fintech, edtech, healthtech, blockchain, cybersecurity, data analytics, IT product companies | A SaaS billing tool, an edtech platform, an AI startup, a cloud hosting provider |
| 3 | Contracting Services | Construction, renovation, civil engineering, infrastructure, electrical/plumbing/HVAC contractors, fabrication, welding, steel structures, roofing, flooring, demolition, labour supply, facility management | A building contractor, an HVAC installer, a steel fabrication shop, a civil engineering firm |
| 4 | Trading/Distribution | Wholesale traders, import/export, dealers, distributors, suppliers, stockists, commodities, merchants, resellers | An auto parts dealer, a chemical distributor, an electronics wholesaler, an import-export house |
| 5 | Digital Store | E-commerce businesses, online retail, online marketplaces, dropshipping | A Shopify store, an online electronics retailer, a niche D2C brand |
| 6 | Manufacturing | Factories, production units, processing plants, textile/garment, pharma, chemicals, food processing, packaging, assembly, tooling | A garment factory, a pharma manufacturer, a food processing unit, a packaging company |
| 7 | Retail | Physical stores, showrooms, restaurants, cafes, bakeries, jewellery shops, pharmacies, supermarkets, grocery, fashion boutiques, mobile/electronics shops, auto parts retail, florists, bookstores | A neighbourhood bakery, a jewellery showroom, a restaurant, a pharmacy |

> **Note:** "Construction" was previously a separate 8th persona. It has been merged into **Contracting Services** since both share similar invoicing patterns (project-based, labour + materials, milestone billing).

## Input CSV Requirements

The classifier accepts CSVs in two formats:

**Format A — Full Refrens export (used by `nob_classifier.py`):**
- `Businesses__name` — Business name
- `invoiceMeta.Businesses__lastFiveInvoiceItems` — Line items in Refrens EDN format
- `metadata.clientGstDetails` — GST metadata in Refrens EDN format

**Format B — Minimal (used by `nob_web_classify.py` for unknowns):**
- `Businesses__id` — Business ID
- `Businesses__name` — Business name
- `invoiceMeta.Businesses__lastFiveInvoiceItems` — Line items (optional, can be empty)

## Output Columns Added

- `primaryNOB` — Main persona classification (one of the 7 above, or "Unknown")
- `confidenceScore` — 0.0 to 1.0 (High ≥ 0.8, Medium 0.5–0.79, Low 0.2–0.49, Very Low < 0.2)
- `classificationBasis` — Audit trail showing which signals drove the classification
- `classificationSource` — Either `rules` (pass 1) or `web_search` (pass 2)

Older runs may also include:
- `negativeNOB` — Personas that are definitely NOT applicable

## Classification Pipeline

The classifier runs in two passes:

### Pass 1 — Rule-based (fast, offline)

Priority order of signals:

1. **Line item names** (strongest) — keyword matching against ~300 terms per persona
2. **HSN codes** — mapped to service vs goods categories (99xx = services, 84xx/85xx = electronics, etc.)
3. **GST Nature of Business** — Factory/Manufacturing, Retail, Wholesale, etc. (when available)
4. **Business name** (weakest alone) — keyword matching against ~200 terms

Businesses classified with confidence ≥ 0.4 are considered done.

### Pass 2 — Web search + LLM reasoning (for remaining unknowns)

For businesses that Pass 1 couldn't classify (confidence < 0.4 or "Unknown"):

1. Web search for the business name to find what they do
2. Combine web context with any available invoice item names
3. Classify using the enriched context
4. Assign confidence based on quality of web results

## File Reference

| File | Purpose |
|---|---|
| `nob_classifier.py` | Main rule-based classifier (Pass 1), works on full Refrens CSV exports |
| `nob_web_classify.py` | Web search + LLM classifier (Pass 2), for unknowns from Pass 1 |
| `*_classified.csv` | Final output with NOB assigned |
| `*_ambiguous.json` | Low-confidence rows that may benefit from manual review |
| `nob_unknown.csv` | Input file of businesses that couldn't be classified in earlier runs |
| `nob_unknown_classified.csv` | Output of the web search pass on unknown businesses |

## Tips for Future Runs

- Run Pass 1 first — it's instant and handles ~30–50% of businesses
- Only send true unknowns to Pass 2 (web search) — it's slower but fills another ~30–40%
- The remaining 10–20% are typically test accounts, gibberish names, or businesses too obscure to identify
- When in doubt, check invoice line items — they're often more reliable than business names

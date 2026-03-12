# Save Report Feature — UX & API Documentation

> **Date observed:** March 12, 2026  
> **Application:** Refrens Premium — Invoices Dashboard  
> **Base URL:** `https://ref-19168.bizsuggest.com`  
> **API Host:** `https://serana.ref-19168.bizsuggest.com`

---

## 1. Overview

The **Save Report** feature on the Invoices Dashboard allows users to create, load, update, and delete custom filtered views called **Saved Reports** (or "Saved Queries" in the API). These reports persist filter combinations such as date ranges, client filters, and invoice status filters, making it easy to re-access frequently used views.

---

## 2. UX Flow

### 2.1 Report Selector Dropdown (Left Side)

Located in the top-left of the dashboard filters row. A dropdown button that shows the currently active report.

**Default system reports:**
1. Active Invoice
2. Recurring Invoice
3. Deleted Invoice

**Custom Reports section** appears below the system reports, listing all user-created saved reports (e.g., "Malaysia Client - Invoices").

**Behaviour:**
- Selecting any report immediately applies its saved filters and updates the URL with a base64+URL-encoded `fq` parameter.
- The selected report name appears in the "Applied Filters" pill at the bottom of the filters panel (highlighted in blue).

---

### 2.2 Save Report Button (Right Side)

A split button in the top-right of the filters section with two parts:
1. **"Save Report"** label button — primary action
2. **Caret (▼) dropdown** — exposes additional options

**When the button appears:**
- The "Save Report" button only appears when either:
  - A custom (user-created) report is selected, OR
  - At least one filter has been applied to any report

**Dropdown options differ depending on context:**

#### Context A: Default report (e.g., "Active Invoice") with filters applied
| Option | Action |
|--------|--------|
| Save Report | Saves current filters as an update to an existing saved report (opens a modal if it's a default report) |
| Save as New Report | Opens a modal to create a brand-new saved report with a custom name |

#### Context B: Custom (user-created) report selected
| Option | Action |
|--------|--------|
| Save Report | Updates the current custom report's filters directly (no modal) — sends a PATCH |
| Save as New Report | Opens modal to create a new separate report |
| Edit Report | Opens the same modal pre-populated with current report metadata |
| Delete Report | Soft-deletes the report immediately (no confirmation dialog) |

---

### 2.3 "Save as Report" Modal

Triggered by clicking **"Save as New Report"** or **"Edit Report"**.

**Fields:**
- **Report Name*** (required text input)
- **Description** (optional textarea)
- **Date Behaviour** section:
  - **Date** field with radio toggle: **Fixed** | **Dynamic**

**Fixed Date Mode:**
- Shows a date range picker pre-populated with the currently selected date range
- Exact dates are stored and always applied when loading the report
- Stored as: `{ "dateBehaviour": "fixed", "fixedDateRange": { "$gte": "YYYY-MM-DD", "$lte": "YYYY-MM-DD" } }`

**Dynamic Date Mode:**
- Shows a dropdown with relative period presets:
  - Today, Yesterday, Last 7 Days, Last 15 Days, Last 30 Days, Last 45 Days
  - This Month, Last Month
  - This Quarter, Last Quarter
  - This Year, Last Year
  - Custom Period
- Displays a preview of the current resolved date range (e.g., "From Jan 01, 2026 to Mar 12, 2026")
- Stored as: `{ "dateBehaviour": "dynamic", "dynamicPreset": "this_quarter" }`

**Actions:**
- **Save Report** — submits the form
- **Cancel** — closes modal without saving

---

### 2.4 Applied Filters Display

Below the filter controls, an "Applied Filters" section shows active filters as removable pills:
- The saved report name (in blue, non-removable pill that identifies the report)
- Additional filter pills for each active filter (e.g., "Date: Mar 01, 26 - Mar 31, 26", "Billed To: Test Malaysia")

---

## 3. URL Structure

Filters are encoded in the URL as a double-encoded (URL + Base64) `fq` query parameter.

**Example URL:**
```
/app/refrens-premium/invoices?fq=JTdCJTIyYmlsbFR5cGUlMjIlM0ElMjJJTlZPSUNFJTIy...
```

**Decoded `fq` value (JSON):**
```json
{
  "billType": "INVOICE",
  "client": {
    "$in": ["69b1530e774bb4d7c012750f"],
    "$inOptions": [
      { "label": "Test Malaysia", "value": "69b1530e774bb4d7c012750f" }
    ]
  },
  "invoiceDate": {
    "$gte": "2026-01-01",
    "$lte": "2026-03-12"
  }
}
```

**Decoding process:** `URL param → Base64 decode → URL decode → JSON.parse`

---

## 4. API Reference

### 4.1 Load Saved Queries on Page Load

Two GET requests are made when the Invoices Dashboard loads:

#### Global Saved Queries
```
GET /saved-queries?$limit=50
```

#### Business-Specific Invoice Saved Queries
```
GET /businesses/refrens-premium/saved-queries?serviceName=invoices&$limit=50&$sort[updatedAt]=-1
```

These populate the Custom Reports section in the report selector dropdown. Results are cached client-side; subsequent dropdown opens do not trigger new API calls.

---

### 4.2 Create New Saved Report

**Triggered by:** Clicking "Save" in the "Save as Report" modal

```http
POST /businesses/refrens-premium/saved-queries
Content-Type: application/json
```

#### Request Body — Dynamic Date Example
```json
{
  "displayName": "Test Q1 2026 Invoices",
  "description": "",
  "dateFields": [
    {
      "accessor": "invoiceDate",
      "dateBehaviour": "dynamic",
      "dynamicPreset": "this_quarter"
    }
  ],
  "query": {
    "billType": "INVOICE"
  },
  "queryType": "FEATHERS_SERVICE",
  "querySubType": "FIND",
  "serviceName": "invoices"
}
```

#### Request Body — Fixed Date Example
```json
{
  "displayName": "Temp Delete Test",
  "description": "",
  "dateFields": [
    {
      "accessor": "invoiceDate",
      "dateBehaviour": "fixed",
      "fixedDateRange": {
        "$lte": "2026-03-31",
        "$gte": "2026-03-01"
      }
    }
  ],
  "query": {
    "billType": "INVOICE"
  },
  "queryType": "FEATHERS_SERVICE",
  "querySubType": "FIND",
  "serviceName": "invoices"
}
```

#### Request Body — With Client Filter
```json
{
  "displayName": "Malaysia Client - Invoices",
  "description": "",
  "dateFields": [
    {
      "accessor": "invoiceDate",
      "dateBehaviour": "dynamic",
      "dynamicPreset": "this_quarter"
    }
  ],
  "query": {
    "billType": "INVOICE",
    "client": {
      "$in": ["69b1530e774bb4d7c012750f"],
      "$inOptions": [
        { "label": "Test Malaysia", "value": "69b1530e774bb4d7c012750f" }
      ]
    }
  },
  "queryType": "FEATHERS_SERVICE",
  "querySubType": "FIND",
  "serviceName": "invoices"
}
```

#### Response — 201 Created
```json
{
  "_id": "69b1c62494bc158648b7eca3",
  "isGlobal": false,
  "business": "604c57fc712573741c5170eb",
  "addedBy": "62fcd0b05cb9b04b2e57e2d4",
  "displayInChatbot": false,
  "queryType": "FEATHERS_SERVICE",
  "querySubType": "FIND",
  "source": "DASHBOARD",
  "serviceName": "invoices",
  "query": {
    "billType": "INVOICE"
  },
  "dateFields": [
    {
      "accessor": "invoiceDate",
      "dateBehaviour": "fixed",
      "fixedDateRange": {
        "$gte": "2026-03-01",
        "$lte": "2026-03-31"
      },
      "_id": "69b1c62494bc158648b7eca4"
    }
  ],
  "displayName": "Temp Delete Test",
  "isArchived": false,
  "description": "",
  "createdAt": "2026-03-11T19:44:36.676Z",
  "updatedAt": "2026-03-11T19:44:36.676Z",
  "__v": 0
}
```

---

### 4.3 Update Existing Saved Report (Save Report)

**Triggered by:** Clicking "Save Report" (either the primary button or from the dropdown) when a custom report is already selected

```http
PATCH /businesses/refrens-premium/saved-queries/{savedQueryId}
Content-Type: application/json
```

#### Request Body
```json
{
  "query": {
    "billType": "INVOICE",
    "client": {
      "$in": ["69b1530e774bb4d7c012750f"],
      "$inOptions": [
        { "label": "Test Malaysia", "value": "69b1530e774bb4d7c012750f" }
      ]
    },
    "invoiceDate": {
      "$gte": "2026-01-01",
      "$lte": "2026-03-12"
    }
  }
}
```

Note: Only the `query` field is sent when updating via "Save Report". The `dateFields` metadata is stored separately and updated via the "Edit Report" modal.

#### Response — 200 OK
```json
{
  "_id": "69b1c30b94bc158648b7eb28",
  "isGlobal": false,
  "business": "604c57fc712573741c5170eb",
  "addedBy": "62fcd0b05cb9b04b2e57e2d4",
  "displayInChatbot": false,
  "queryType": "FEATHERS_SERVICE",
  "querySubType": "FIND",
  "source": "DASHBOARD",
  "serviceName": "invoices",
  "query": {
    "billType": "INVOICE",
    "client": {
      "$in": ["69b1530e774bb4d7c012750f"],
      "$inOptions": [
        { "label": "Test Malaysia", "value": "69b1530e774bb4d7c012750f" }
      ]
    },
    "invoiceDate": {
      "$gte": "2026-01-01",
      "$lte": "2026-03-12"
    }
  },
  "dateFields": [
    {
      "accessor": "invoiceDate",
      "dateBehaviour": "dynamic",
      "dynamicPreset": "this_quarter",
      "_id": "69b1c30b94bc158648b7eb29"
    }
  ],
  "displayName": "Malaysia Client - Invoices",
  "isArchived": false,
  "description": "",
  "createdAt": "2026-03-11T19:31:23.331Z",
  "updatedAt": "2026-03-11T19:36:53.206Z",
  "__v": 0
}
```

---

### 4.4 Delete Saved Report (Soft Delete)

**Triggered by:** Clicking "Delete Report" from the dropdown  
**Note:** No confirmation dialog is shown. The deletion is immediate from the user's perspective.

```http
PATCH /businesses/refrens-premium/saved-queries/{savedQueryId}
Content-Type: application/json
```

#### Request Body
```json
{
  "isArchived": true
}
```

#### Response — 200 OK
```json
{
  "_id": "69b1c62494bc158648b7eca3",
  "isGlobal": false,
  "business": "604c57fc712573741c5170eb",
  "addedBy": "62fcd0b05cb9b04b2e57e2d4",
  "displayInChatbot": false,
  "queryType": "FEATHERS_SERVICE",
  "querySubType": "FIND",
  "source": "DASHBOARD",
  "serviceName": "invoices",
  "query": {
    "billType": "INVOICE"
  },
  "dateFields": [
    {
      "accessor": "invoiceDate",
      "dateBehaviour": "fixed",
      "fixedDateRange": {
        "$gte": "2026-03-01",
        "$lte": "2026-03-31"
      },
      "_id": "69b1c62494bc158648b7eca4"
    }
  ],
  "displayName": "Temp Delete Test",
  "isArchived": true,
  "description": "",
  "createdAt": "2026-03-11T19:44:36.676Z",
  "updatedAt": "2026-03-11T19:45:34.062Z",
  "__v": 0
}
```

**Behaviour after delete:** The dashboard reverts to "Active Invoice" (default report), the URL `fq` param resets, and the "Save Report" button disappears.

---

### 4.5 Fetch Invoice Data (When Report Is Active)

When a saved report is selected (or any filter is applied), the invoice list is fetched with the filter params translated to query strings:

```http
GET /businesses/refrens-premium/invoices?$sort[invoiceDate]=-1&$sort[invoiceNumber]=false&$limit=10&$skip=0&billType=INVOICE&invoiceDate[$lte]=2026-03-31&invoiceDate[$gte]=2026-03-01&addShareLink=true
```

---

## 5. Data Model — Saved Query Object

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Unique identifier of the saved query |
| `business` | ObjectId | Business the query belongs to |
| `addedBy` | ObjectId | User who created the query |
| `displayName` | String | Human-readable report name |
| `description` | String | Optional description |
| `serviceName` | String | Always `"invoices"` for invoice reports |
| `source` | String | Always `"DASHBOARD"` for UI-created reports |
| `queryType` | String | Always `"FEATHERS_SERVICE"` |
| `querySubType` | String | Always `"FIND"` |
| `isGlobal` | Boolean | Whether the report is global (system-level) |
| `isArchived` | Boolean | Soft-delete flag; `true` = deleted |
| `displayInChatbot` | Boolean | Whether shown in chatbot context |
| `query` | Object | MongoDB-style filter query |
| `dateFields` | Array | Date field behaviour configs |
| `dateFields[].accessor` | String | Field name (e.g., `"invoiceDate"`) |
| `dateFields[].dateBehaviour` | String | `"fixed"` or `"dynamic"` |
| `dateFields[].fixedDateRange` | Object | `{ "$gte": "YYYY-MM-DD", "$lte": "YYYY-MM-DD" }` — when fixed |
| `dateFields[].dynamicPreset` | String | One of the preset keys (see below) — when dynamic |
| `createdAt` | ISO Date | Creation timestamp |
| `updatedAt` | ISO Date | Last update timestamp |

### Dynamic Preset Keys

| Preset Key | Label |
|-----------|-------|
| `today` | Today |
| `yesterday` | Yesterday |
| `last_7_days` | Last 7 Days |
| `last_15_days` | Last 15 Days |
| `last_30_days` | Last 30 Days |
| `last_45_days` | Last 45 Days |
| `this_month` | This Month |
| `last_month` | Last Month |
| `this_quarter` | This Quarter |
| `last_quarter` | Last Quarter |
| `this_year` | This Year |
| `last_year` | Last Year |
| `custom_period` | Custom Period |

---

## 6. Query Filter Structure

The `query` field in the saved query uses MongoDB-style query operators:

```json
{
  "billType": "INVOICE",
  "client": {
    "$in": ["<clientId>"],
    "$inOptions": [
      { "label": "<Client Display Name>", "value": "<clientId>" }
    ]
  },
  "invoiceDate": {
    "$gte": "2026-01-01",
    "$lte": "2026-03-31"
  }
}
```

> **Note:** The `$inOptions` field is a UI-specific extension (not standard MongoDB) used to preserve the human-readable labels for multi-select filter chips without requiring additional lookups.

---

## 7. Key UX Observations & Notes

1. **No confirmation on delete**: Clicking "Delete Report" immediately archives the report without any "Are you sure?" dialog. This is a UX risk — accidental deletions cannot be recovered from the UI.

2. **Soft delete, not hard delete**: Reports are archived (`isArchived: true`) via PATCH, not permanently removed. This means recovery could be possible via API but is not exposed in the UI.

3. **"Save Report" on default reports**: Clicking the main "Save Report" button or "Save Report" from the dropdown when on a default system report (Active Invoice, etc.) behaves the same as "Save as New Report" — opens the modal. There is no way to overwrite a system report.

4. **Filter persistence via URL**: All active filters are encoded in the URL's `fq` parameter, making reports fully shareable via direct URL — even without selecting a saved report.

5. **Save Report button visibility**: The button only appears when filters differ from the default state, providing a clean uncluttered UI when no custom filters are active.

6. **Dynamic date preview**: When selecting a Dynamic preset in the modal, the system immediately shows the resolved date range (e.g., "From Jan 01, 2026 to Mar 12, 2026"), helping users verify the correct period before saving.

7. **Saved queries are cached on load**: The list of saved reports is fetched once on page load and cached in-memory. Subsequent opens of the report dropdown do not trigger API calls.

8. **"Save as New Report" context**: This option is available both from a default report (with filters applied) AND from a custom report. This allows users to fork an existing report into a new one.

---

## 8. API Summary Table

| Action | Method | Endpoint | Trigger |
|--------|--------|----------|---------|
| Load saved reports | GET | `/businesses/{slug}/saved-queries?serviceName=invoices&$limit=50&$sort[updatedAt]=-1` | Page load |
| Load global reports | GET | `/saved-queries?$limit=50` | Page load |
| Create new report | POST | `/businesses/{slug}/saved-queries` | Save as New Report modal submit |
| Update report filters | PATCH | `/businesses/{slug}/saved-queries/{id}` | Save Report (existing custom report) |
| Delete report | PATCH | `/businesses/{slug}/saved-queries/{id}` | Delete Report (sets isArchived: true) |
| Load invoice data | GET | `/businesses/{slug}/invoices?{filters}&addShareLink=true` | Any filter change or report select |

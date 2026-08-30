# EIMS Core API Mock Collection

A Postman collection for testing Ethiopia's e-invoice Management System (EIMS)
Core API (`https://core.mor.gov.et`). The collection covers the full e-invoice
lifecycle exposed by the Ministry of Revenues (MoR) / ERCA back office.

## Before Testing — Prerequisites

> **Before running any request, you must:**
>
> 1. **Register your source** with the MoR e-invoice system.
> 2. **Obtain approval from the back office** (ERCA/MoR) for your taxpayer source.
>
> Credentials are issued only after your source registration is approved.
> See `ovds insa/Self-onboarding and Source Registration Guide.pdf` in this
> repository for the registration process. 

These credentials are then mapped to the OVDS environment variables (see
`.env.example`, section **EIMS (Electronic Invoice Management System)**):

| Postman variable | OVDS env var | Description |
| ---------------- | ------------ | ----------- |
| `clientId`       | `EIMS_CLIENT_ID` | API client ID issued by MoR |
| `clientSecret`   | `EIMS_CLIENT_SECRET` | Secret API key issued by MoR |
| `apiKey`         | `EIMS_API_KEY` | Additional authentication key (if required) |
| `sellerTin`      | `COMPANY_TIN` / seller `Tin` | Your 15-digit Tax Identification Number |
| `mock_url`       | `EIMS_API_URL` | Core API base URL — defaults to `http://core.mor.gov.et` |

Set `EIMS_SANDBOX=true` in your OVDS `.env` during integration testing so that
submissions are logged without hitting the live MoR API.

## Run-time Guards (Pre-request Scripts)

The collection is wired with **pre-request scripts** that enforce prerequisites
*before* a request is sent, instead of letting it fail with a cryptic 401/400.

- **Collection-level guard** — runs before every request. Aborts the run if any
  of `mock_url`, `clientId`, `clientSecret`, `apiKey`, or `sellerTin` is missing
  or still a `{{placeholder}}`. The error message points back to the registration
  guide, so you never send an unauthenticated request by accident.
- **Folder-level guards** — every authenticated folder adds a `token` check on
  top of the collection guard. The `Registration` folder additionally requires
  the full seller profile block (`sellerEmail`, `sellerLegalName`, `sellerPhone`,
  `sellerRegion`, `sellerVatNumber`, `sellerWoreda`, `systemNumber`,
  `systemType`). The `Receipt` folder requires `sellerTin`.
- **Authentication folder** — intentionally *not* guarded, because it is the
  step that *obtains* the bearer `token`.

> Tip: run the collection with the `EimsCoreApiMockLocal` environment selected.
> A missing credential is reported immediately rather than as a network error.

## Files

```
postman/
├── EimsCoreApiMockCollection.postman_collection.json   # The collection (9 requests, 26 example responses, with pre-request guards)
├── EimsCoreApiMockEnvironment.postman_environment.json # Environment template with all required variables
├── .env.postman.example                                  # Machine-readable Postman↔OVDS env-var mapping
└── README.md                                            # This document
```

## Importing into Postman

1. Open Postman (Desktop app or web).
2. Click **Import** → **Upload Files** and select both:
   - `postman/EimsCoreApiMockCollection.postman_collection.json`
   - `postman/EimsCoreApiMockEnvironment.postman_environment.json`
3. Select the **EimsCoreApiMockLocal** environment from the top-right dropdown.
4. Fill in your MoR-issued values for `clientId`, `clientSecret`, `apiKey`, `sellerTin`,
   and the seller information variables.
5. Confirm the `EIMS_SANDBOX` / source-approval prerequisite above.

## Required Variables

### Authentication variables

| Variable       | Required | Description | Example |
| -------------- | -------- | ----------- | ------- |
| `clientId`     | yes      | API client ID from MoR | `"a8d87762-d96d-4dd0-95d1-01753dba5181"` |
| `clientSecret` | yes      | Secret API key from MoR | `"0cc1a9ba-0f7d-44e1-bad2-0d136572794b"` |
| `apiKey`       | yes      | Additional API key (if required) | `"471555f9-6726-4786-9e53-f29f220819c3"` |
| `sellerTin`    | yes      | Your 15-digit TIN | `"0016324478"` |

### Seller information variables (invoices)

| Variable          | Required | Description | Example |
| ----------------- | -------- | ----------- | ------- |
| `sellerEmail`     | yes      | Seller contact email | `"accounting@company.com"` |
| `sellerLegalName` | yes      | Registered business name | `"ABC Trading PLC"` |
| `sellerPhone`     | yes      | Business contact phone | `"0911223344"` |
| `sellerRegion`    | yes      | Business region code (13 = Addis Ababa) | `"13"` |
| `sellerTin`       | yes      | Tax Identification Number | `"0016324478"` |
| `sellerVatNumber` | yes      | VAT registration number | `"3215840010"` |
| `sellerWoreda`    | yes      | Business woreda (district) code | `"574"` |

Optional seller fields (`City`, `HouseNumber`, `Locality`, `SubCity`) may be `null`.

### System variables

| Variable          | Required | Description | Example |
| ----------------- | -------- | ----------- | ------- |
| `systemType`      | yes      | invoice system type | `"ERP"` / `"POS"` / `"MANUAL"` |
| `systemNumber`    | yes      | Your POS/ERP system identifier | `"SYS-001"` |
| `documentNumber`  | yes      | Starting invoice number | `"1"` |
| `invoiceCounter`  | yes      | System transaction counter | `"1"` |

### Auto-managed variables

These are set/updated automatically by the collection test scripts and should
not be edited manually during a run:

| Variable        | Managed by | Notes |
| --------------- | ---------- | ----- |
| `token`         | `login` test script | Bearer token, extracted from `data.accessToken` |
| `previousIrn`   | `register single` test script | Chain reference from the last registered IRN |
| `documentNumber`| `register single` test script | Auto-incremented per successful single registration |
| `invoiceCounter`| `register single` test script | Auto-incremented per successful single registration |

## Endpoints

All endpoints require `Authorization: Bearer {{token}}` except the login call.

| Step | Method | Endpoint | Purpose |
| ---- | ------ | -------- | ------- |
| Auth | POST | `/auth/login` | Generate bearer token |
| Auth | POST | `/auth/refresh-token` | Refresh an expired token |
| Register | POST | `/v1/bulkRegister` | Register multiple invoices (array) |
| Register | POST | `/v1/register` | Register a single invoice |
| Verify  | POST | `/v1/verify` | Verify an invoice by IRN |
| Cancel  | POST | `/v1/cancel` | Cancel a single invoice |
| Cancel  | POST | `/v1/bulkCancel` | Cancel multiple invoices (array) |
| Receipt | POST | `/v1/receipt/sales` | Record a sales receipt |
| Receipt | POST | `/v1/receipt/withholding` | Record a withholding receipt |

## Usage Workflow

1. **Set variables** — fill in `clientId`, `clientSecret`, `apiKey`, `sellerTin`,
   seller details, and system variables.
2. **Run `Authentication > login`** — the test script stores `token` for all
   subsequent requests (Bearer auto-injected via `{{token}}`).
3. **(Optional) `Authentication > RefreshToken`** — renews the token when it expires.
4. **Register invoices** — `Registration > register single` (auto-increments
   `documentNumber` and `invoiceCounter`, chains `previousIrn`) or
   `Registration > registration bulk` (submit an array).
5. **Verify** — `Verification > verification` to fetch the stored invoice by IRN.
6. **Cancel** — `Cancellation > single Cancel` / `Cancellation > Bulk Cancel`.
7. **Receipts** — `Receipt > Sales Receipt` / `Receipt > Receipt withhold` to record
   payments and withholding against registered invoices.

### Single vs. Bulk Registration notes

| Aspect | Single registration | Bulk registration |
| ------ | ------------------- | ----------------- |
| Invoices per request | 1 | Multiple (array) |
| Document chaining | Automatic via `previousIrn` script | First invoice may use `{{previousIrn}}`; others are manual |
| Counter management | Auto-incremented by test script | Must update manually between runs |
| Response | Immediate IRN + signed invoice | `202 Accepted` + `conversationId`; results delivered via callback webhook |

For bulk registration, configure a webhook endpoint to receive async results. See
`docs/09-developers/WEBHOOKS.md` for OVDS-side callback handling.

## Running with Newman (CLI / CI)

Postman Desktop is optional — the collection also runs headless via [Newman](https://www.npmjs.com/package/newman).

Install once:

```bash
npm install -g newman
```

Run (from the repo root, with the `EimsCoreApiMockLocal` environment selected via `-e`):

```bash
newman run postman/EimsCoreApiMockCollection.postman_collection.json \
  -e postman/EimsCoreApiMockEnvironment.postman_environment.json \
  --iteration-count 1 --delay-request 500
```

### CI gating

Because the collection's pre-request guards throw on any missing credential, an
unconfigured run fails fast. Add `--bail` so a missing `clientId`/`sellerTin`
(ex. a developer forgot to register their source first) aborts the whole run
and fails the build:

```bash
newman run postman/EimsCoreApiMockCollection.postman_collection.json \
  -e postman/EimsCoreApiMockEnvironment.postman_environment.json \
  --bail
```

> **CI credentials:** inject `clientId`, `clientSecret`, `apiKey`, and `sellerTin`
> via the environment runner, then have your entrypoint write a temporary
> `EimsCoreApiMockEnvironment.postman_environment.json` (or override the
> variables with `--env-var`) before running. Do not commit a file containing
> real MoR credentials — see `.env.postman.example` for the mapping.

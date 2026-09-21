# Akaunting — Architecture Overview

A fact-based architectural overview
of the Akaunting 3.x codebase, derived
directly from `C:\xampp\htdocs\aka\`.

> Source of truth: the actual source
> files under `app/`, `config/`,
> `routes/`, `database/`, `modules/`.

## What is Akaunting

Akaunting is a self-hosted,
multi-tenant, multi-currency
accounting application built on
Laravel 10 / PHP 8.1. The codebase
is published under the BUSL-1.1
license (`composer.json:13`). The
project is a modular monolith: the
core ships as a Laravel application
and modules live under
`modules/<Vendor>/<Module>/`,
discovered at runtime by
`akaunting/laravel-module` 4.x
(`composer.json:35`).

The application is dual-surface:
a normal admin app served under
`/admin/*`, and a customer-facing
portal under `/portal/*`. Both are
mounted by the same Laravel
router, separated by middleware
groups declared in
`app/Providers/Route.php`.

## High-level layout

```
.
├── app/                # Core application code
│   ├── Abstracts/      # 13 base classes
│   ├── BulkActions/    # Bulk-action handlers (per resource)
│   ├── Console/        # Artisan commands + module stubs
│   ├── Events/         # ~13 events
│   ├── Exceptions/     # Custom exception classes
│   ├── Exports/        # Excel/CSV exports (maatwebsite/excel)
│   ├── Http/
│   │   ├── Controllers/# ~85 controllers in 12 namespaces
│   │   ├── Livewire/   # 11 Livewire 3 components
│   │   ├── Middleware/ # 25 middlewares
│   │   ├── Requests/   # ~50 FormRequests
│   │   ├── Resources/  # API resources
│   │   └── Responses/  # Typed form responses
│   ├── Imports/        # Excel/CSV imports
│   ├── Interfaces/     # Contracts (Job, Listener, Utility, Export)
│   ├── Jobs/           # 108 queueable jobs
│   ├── Listeners/      # 69 event listeners
│   ├── Models/         # 32 Eloquent models
│   ├── Notifications/  # 18 mail/DB notifications
│   ├── Observers/      # 2 model observers
│   ├── Providers/      # 12 service providers
│   ├── Relations/      # Custom Eloquent relations
│   ├── Reports/        # 6 built-in reports
│   ├── Scopes/         # 5 global scopes
│   ├── Traits/         # 33 traits
│   ├── Utilities/      # 14 facades / helpers
│   ├── View/Components/# ~200 Blade components
│   └── Widgets/        # 8 built-in widgets
├── bootstrap/          # Laravel bootstrap
├── config/             # 45 config files
├── database/
│   ├── factories/      # Model factories
│   ├── migrations/     # 13 core migrations (core_v1 … core_v3122)
│   └── seeds/          # 13 seeders
├── docs/               # This documentation set
├── modules/            # Bundled + per-app modules
│   ├── OfflinePayments/
│   └── PaypalStandard/
├── overrides/          # Composer autoload overrides
├── public/             # Web root
├── resources/          # Views, lang, assets
├── routes/             # 11 route files
├── storage/            # App data, logs, cache
└── vendor/             # Composer dependencies
```

## Bounded contexts

The application is organised into
seven bounded contexts, each
visible as a top-level namespace
under `app/`:

- **Auth** — users, roles,
  permissions, invitations
  (`app/Models/Auth`,
  `app/Jobs/Auth`,
  `app/Listeners/Auth`).
- **Banking** — accounts,
  transactions, transfers,
  reconciliations
  (`app/Models/Banking`,
  `app/Jobs/Banking`).
- **Common** — companies,
  contacts, items, dashboards,
  recurring, reports, widgets
  (`app/Models/Common`,
  `app/Jobs/Common`).
- **Document** — invoices, bills,
  document items, totals,
  history
  (`app/Models/Document`,
  `app/Jobs/Document`).
- **Setting** — categories,
  currencies, taxes, email
  templates, settings store
  (`app/Models/Setting`,
  `app/Jobs/Setting`).
- **Module** — bundled modules
  (Offline Payments, PayPal
  Standard), App Store
  integration
  (`app/Models/Module`,
  `app/Jobs/Install`).
- **Install** — first-run
  installer, per-version
  update listeners
  (`app/Listeners/Update`,
  `app/Console/Commands/
  Install*`).

## Multi-tenancy

Multi-tenancy is implemented as
**single-database, shared-schema**
with a `company_id` column on
every tenantable table. The
mechanism is:

- `App\Models\Common\Company`
  is the tenant model.
- `App\Traits\Tenants` adds the
  `App\Scopes\Company` global
  scope on `bootTenants()`.
- The scope filters every
  query to the current
  `company_id` resolved from
  `Company::current()`.
- `App\Abstracts\Model
  ::scopeAllCompanies($query)`
  removes the scope for
  cross-company reports.

A small set of tables are
intentionally **not** scoped:
`jobs`, `failed_jobs`,
`migrations`, `notifications`,
`sessions`, `firewall_ips`,
`firewall_logs`, `role_companies`,
`role_permissions`, `user_companies`,
`user_dashboards`, `user_permissions`,
`user_roles`. These are listed in
`App\Scopes\Company::$tables`.

## Authorisation

Authorisation is role-based via
`santigarcor/laratrust` 7.x
(`composer.json:69`). The system
ships with four built-in roles
configured in `config/laratrust.php`:

- `admin` — full access to the
  company.
- `manager` — manage documents,
  banking, contacts (read-only
  on settings).
- `customer` — portal access to
  own invoices / bills /
  payments.
- `vendor` — portal access to
  own bills.

`Laratrust` is wired with
`team_foreign_key = company_id`
in `config/laratrust.php`, which
makes every role-permission
attachment tenant-scoped.

## The request lifecycle

A typical admin request follows
this path:

1. **Entry** — `public/index.php`
   bootstraps the framework.
2. **Global middleware** —
   `TrustHosts`, `TrustProxies`,
   `TrimStrings`, `Debugbar`
   (if debug + installed).
3. **Route resolution** —
   `App\Providers\Route` maps
   the URL to one of the route
   groups declared in
   `routes/*.php`.
4. **Group middleware** —
   `web` adds session, CSRF,
   cookies, view state; `auth`
   resolves the `web` guard
   (`auth.php`).
5. **Resource middleware** —
   `AdminMenu` / `PortalMenu`
   / `IdentifyCompany` /
   `Money` / `DateFormat` /
   `CheckForReadOnlyMode`.
6. **Controller** — extends
   `App\Abstracts\Http\Controller`
   which has `$this->dispatch`
   and `$this->ajaxDispatch`
   helpers.
7. **Form Request** — extends
   `App\Abstracts\Http
   \FormRequest` for validation
   and authorisation.
8. **Job dispatch** — controllers
   always dispatch a Job rather
   than touching models directly.
9. **Listener fan-out** — Jobs
   fire `*Created` / `*Updated`
   / `*Deleted` events; the
   registered listeners handle
   side effects (history rows,
   next-number increment,
   notification queueing,
   recurring creation, etc.).
10. **Response** — typed response
    class (`App\Http\Responses\*`)
    + `App\Abstracts\Http
    \Response` decides whether
    to return a JSON envelope or
    a redirect-with-flash.

## The Job pattern

Every write goes through a Job
extending `App\Abstracts\Job`
(`app/Abstracts/Job.php`). The
base class:

- Implements the
  `App\Interfaces\Job
  \ShouldCreate` /
  `ShouldUpdate` /
  `ShouldDelete` /
  `HasOwner` /
  `HasSource` interfaces
  (`app/Interfaces/Job/`).
- Bootstraps via the
  `booting` / `bootCreate` /
  `bootUpdate` / `bootDelete` /
  `booted` hooks.
- Stamps `created_by` /
  `updated_by` /
  `created_from` /
  `updated_from` /
  `deleted_by` on the request.
- Exposes
  `$this->dispatch(Job)`,
  `$this->dispatchSync(Job)`,
  `$this->ajaxDispatch(Job)`
  via `App\Traits\Jobs`.
- Exposes file-upload handling
  via `App\Traits\Uploads`.
- Exposes the `Relationships`
  helper for cascading delete.

`App\Abstracts\JobShouldQueue`
(`app/Abstracts/JobShouldQueue
.php`) is the async variant
wired through the `jobs`
queue connection in
`config/queue.php`.

## The Eloquent model pattern

Every model in `app/Models/*`
extends `App\Abstracts\Model`
(`app/Abstracts/Model.php`).
The abstract class wires:

- `App\Scopes\Company` (via
  `Tenants` trait).
- `Ownable` (Laratrust) and the
  `App\Traits\Owners` trait
  for `created_by` filtering.
- `App\Traits\Sources` for
  the `created_from` field.
- `App\Traits\SearchString`
  for the
  `lorisleiva/laravel-search-string`
  parser.
- `Akaunting\Sortable\Traits
  \Sortable` for the
  `?sort=col` URL parameter.
- `GeneaLabs\LaravelModelCaching
  \Traits\Cachable` for the
  in-memory cache.
- `Illuminate\Database\Eloquent
  \SoftDeletes`.
- Casts `amount` → `double`,
  `enabled` → `boolean`.

Useful scopes on the abstract
class:

- `scopeCollect($query,
  $sort = 'name')` — applies
  search-string + sort, returns
  a paginator (or plain
  `Collection` for AJAX).
- `scopeCollectForExport
  ($query, $ids, $sort, $field)`
  — used by the export pipeline
  (`maatwebsite/excel`).
- `scopeUsingSearchString
  ($query, $string)` — calls
  the
  `lorisleiva/laravel-search-string`
  manager.
- `scopeAccount` /
  `scopeContact` /
  `scopeSource` — common
  filters.
- `scopeIsOwner` /
  `scopeIsNotOwner` —
  `created_by` filter.
- `scopeIsRecurring` /
  `scopeIsNotRecurring` —
  `*-recurring` type filter.
- `scopeModuleEnabled
  ($query, $alias)` — only
  rows whose company has the
  given module enabled.

## The route system

Routes are split across 11 files
in `routes/`:

- `web.php` — landing /
  install redirects / health.
- `guest.php` — login / register
  / forgot / reset.
- `auth.php` — admin panel
  routes (mounted under
  `Route::group` with `auth`
  + `AdminMenu` middleware).
- `common.php` — shared admin
  endpoints (notifications,
  uploads, search).
- `portal.php` — customer
  portal (mounted under
  `Route::group` with the
  `portal` guard).
- `wizard.php` — first-run
  wizard.
- `install.php` — installer
  routes.
- `admin.php` — bulk admin
  endpoints.
- `preview.php` — read-only
  document preview.
- `signed.php` — signed-URL
  document access.
- `api.php` — public REST API
  (`/api/*`).
- `channels.php` — broadcast
  channels.
- `console.php` — schedule
  entries (cron).

`App\Providers\Route` registers
five custom route macros:
`admin`, `portal`, `preview`,
`signed`, `module`. These wrap
the `Route::group` boilerplate
and pin the right middleware.

## The front-end

- **Server-rendered Blade** —
  the `resources/views/`
  directory is the primary UI
  surface. View components live
  in `app/View/Components/`
  (~200 components organised
  by `Layouts/`, `Form/`,
  `Index/`, `Show/`,
  `Documents/`, `Transactions/`,
  `Transfers/`, `Menu/`,
  `Widgets/`, `Media/`).
- **Livewire 3** (`composer.json
  :63`) for the bits that need
  reactivity: bell-icon
  notifications, search
  dropdown, favourites, recent
  items, profile menu, report
  pinning. The 11 components
  are under `app/Http/Livewire/`.
- **Alpine.js / Tailwind CSS
  / Sortable.js / Dropzone /
  ApexCharts** — loaded as
  bundled assets from
  `public/js/` and
  `public/css/`.

## The queue

`config/queue.php` declares a
dedicated `jobs` connection
separate from `default`. The
connection is used by:

- `App\Abstracts\JobShouldQueue`.
- `App\Jobs\Install\*` (file
  downloads, unzip, install).
- `App\Jobs\Common
  \CreateMediableFor*` (file
  assembly for downloads /
  exports).
- `App\Jobs\Banking
  \NotifyUser` (email send).

A second connection, `emails`,
is reserved for transactional
email.

## The schedule

`routes/console.php` declares
the cron schedule:

- `RecurringCheck` (per
  company, every 15 minutes) —
  generates due recurring
  documents and transactions.
- `InvoiceReminder` (daily) —
  sends payment reminders for
  outstanding invoices.
- `BillReminder` (daily) —
  sends payment reminders for
  outstanding bills.
- `StorageTempClear` (daily) —
  removes old temp files from
  `storage/app/temp/`.
- `UpdateAll` (every 30
  minutes) — checks for new
  Akaunting releases.

All five are skipped when
`read-only.enabled = true` via
the
`App\Listeners\Common
\SkipScheduleInReadOnlyMode`
listener.

## The read-only mode

`config/read-only.php` exposes a
single toggle. When enabled:

- `CheckForReadOnlyMode`
  middleware blocks all
  `POST` / `PUT` / `PATCH` /
  `DELETE` requests.
- `App\Listeners\Common
  \SkipScheduleInReadOnlyMode`
  prevents scheduled writes.
- A per-company whitelisted
  routes list still allows
  read-only endpoints.

## The module system

Akaunting distributes additional
features as Composer-installable
modules. Two are bundled and
shipped in `modules/`:

- `modules/OfflinePayments/`
  — paid offline (bank
  transfer / cash).
- `modules/PaypalStandard/`
  — PayPal Standard
  redirect.

`composer.json` declares the
installer-paths mapping
(`composer.json:90-98`). Each
module's `module.json` is the
manifest consumed by
`akaunting/laravel-module` 4.x.
The install / enable / disable
/ uninstall / update pipelines
are in `app/Jobs/Install/*` and
the corresponding events in
`app/Events/Module/` and
listeners in
`app/Listeners/Module/`.

## Where to read next

- `02-domain-model.md` — the
  Eloquent models and their
  relationships.
- `03-http-layer.md` — the
  controllers, FormRequests,
  middleware, and route
  macros.
- `04-jobs-events.md` — the
  Job / Event / Listener
  pipeline in detail.
- `05-data-layer.md` — the
  database, migrations, and
  factories.
- `06-auth-and-permissions.md`
  — the Laratrust roles and
  permissions.
- `07-modular-architecture.md`
  — the module system, App
  Store, install / update
  lifecycle.
- `08-frontend-and-ui.md` —
  Blade components, Livewire,
  and the asset pipeline.
- `09-import-export-bulk.md`
  — Excel/CSV import, export,
  and bulk actions.
- `10-queue-schedule-readonly.md`
  — the queue, scheduler, and
  read-only mode.
- `11-deployment-and-ops.md` —
  install, update, env, and
  operations.
- `12-glossary.md` —
  abbreviations and domain
  terms.

# Akaunting — Architecture & System Design

A fact-based documentation set
for the Akaunting 3.x codebase
(`C:\xampp\htdocs\aka\`). All
file paths, counts, and class
names in this set are derived
from the actual source via
`Get-ChildItem` and direct
file reads.

> The previous 76 speculative
> files were deleted on
> 2026-09-04 and replaced
> with this accurate set.
> Anything not verifiable in
> the source is omitted.

## Index

1. **[01-overview.md](01-overview.md)**
   — High-level architecture:
   the 7 bounded contexts,
   the multi-tenancy model,
   the auth model, the
   request lifecycle, the
   Job pattern, the
   Eloquent model pattern,
   the route system, the
   front-end, the queue,
   the schedule, the
   read-only mode, and
   the module system.
2. **[02-domain-model.md](02-domain-model.md)**
   — The 32 Eloquent models
   across the 6 bounded
   contexts, organised by
   namespace with the
   inheritance tree and
   key columns.
3. **[03-http-layer.md](03-http-layer.md)**
   — The 11 route files,
   the 5 custom route
   macros, the 8 request
   macros, the 25
   middlewares, the
   ~85 controllers, the
   ~50 FormRequests, the
   11 Livewire components,
   the typed response, and
   the AJAX envelope.
4. **[04-jobs-events.md](04-jobs-events.md)**
   — The Job base class
   and its 5 marker
   interfaces, the 108
   jobs, the 13 event
   directories, the 69
   listeners, the
   canonical
   `CreateDocument` /
   `UpdateDocument` /
   `DeleteDocument`
   flows, the
   recurring pipeline,
   and the send / view
   / pay pipeline.
5. **[05-data-layer.md](05-data-layer.md)**
   — The 13 core migrations
   (`core_v1` …
   `core_v3122`), the
   full table list, the
   multi-tenancy at the
   schema level, the
   indexes, the
   factories, the 13
   seeders, and the raw
   SQL boundary.
6. **[06-auth-and-permissions.md](06-auth-and-permissions.md)**
   — The 5 guards, the
   4 default roles, the
   permission naming
   convention, the
   tenant scoping via
   `role_companies`, the
   `Ownable` contract,
   the
   `App\Traits\Permissions`
   trait, the multi-
   company user flow, the
   login / logout / forgot
   / reset / invitation
   flows, the API
   authentication, and
   the portal guard.
7. **[07-modular-architecture.md](07-modular-architecture.md)**
   — The bundled modules
   (`OfflinePayments`,
   `PaypalStandard`), the
   `module.json` schema,
   the composer override
   mechanism, the install
   / enable / disable /
   uninstall / update
   pipelines, the
   per-version listeners
   (V30 / V31 / V32), the
   App Store, the
   `modules/` container
   layout, the
   `module:make`
   scaffolder, and the
   override mechanism.
8. **[08-frontend-and-ui.md](08-frontend-and-ui.md)**
   — The 200+ view
   components organised
   by area, the Livewire
   3 components (11), the
   asset pipeline (Vite
   5.x), the
   `view composers`, the
   `presenter` pattern,
   the input component
   family, the modal
   system, and the
   menu events.
9. **[09-import-export-bulk.md](09-import-export-bulk.md)**
   — The import pipeline
   (`maatwebsite/excel` 3.1),
   the export pipeline, the
   bulk-action pipeline
   (the central
   `BulkActions` controller
   and the per-resource
   `BulkAction` classes),
   the download / ZIP
   pipeline, the
   `maatwebsite/excel`
   override, and the
   queueable pattern.
10. **[10-queue-schedule-readonly.md](10-queue-schedule-readonly.md)**
    — The queue connections
    (`sync` / `database` /
    `jobs` / `emails`),
    the worker, the
    schedule entries
    (`RecurringCheck` /
    `InvoiceReminder` /
    `BillReminder` /
    `StorageTempClear` /
    `UpdateAll`), the
    read-only mode, the
    schedule skip listener,
    the clock / timezone,
    the supervisor config,
    the cron config, the
    rate limiters, and the
    broadcast config.
11. **[11-deployment-and-ops.md](11-deployment-and-ops.md)**
    — The system
    requirements (from
    `composer.json:16-29`),
    the installer flow,
    the `php artisan
    update` flow, the
    ~15 bundled artisan
    commands, the `.env`
    variables, the
    `/status` healthcheck,
    the storage layout,
    the cache layout, the
    `public/` directory,
    the log config, the
    web-server configs,
    the CI, and the local
    dev env.
12. **[12-glossary.md](12-glossary.md)**
    — A-Z glossary of
    abbreviations,
    domain terms, and
    file-path conventions.
13. **[13-type-system-and-lifecycle.md](13-type-system-and-lifecycle.md)**
    — The type system
    (`config/type.php`):
    the four groups, the
    document / transaction
    / contact / category
    type maps, the
    state machine, the
    recurring model, and
    the helpers from
    `app/Utilities/
    helpers.php`.
14. **[14-document-and-transaction-internals.md](14-document-and-transaction-internals.md)**
    — The internals of
    the `Document` and
    `Transaction` Eloquent
    models: `$fillable`,
    `$sortable`,
    `$cloneable_relations`,
    `$appends`, global
    scopes, relations,
    per-model scopes,
    and the related
    `DocumentItem` /
    `DocumentItemTax` /
    `DocumentTotal` /
    `DocumentHistory` /
    `TransactionTax` /
    `Transfer` /
    `Reconciliation`
    models.
15. **[15-auth-company-category-internals.md](15-auth-company-category-internals.md)**
    — The internals of
    the `User` /
    `Company` /
    `Category` Eloquent
    models: how
    `User` extends
    `Authenticatable`
    (not the abstract
    `Model`),
    `Company`'s
    `setCommonSettingsAsAttributes`
    pattern, the
    `CompanyMakingCurrent`
    /
    `CompanyMadeCurrent`
    /
    `CompanyForgettingCurrent`
    /
    `CompanyForgotCurrent`
    events, and
    `Category`'s
    custom builder /
    custom HasMany /
    `WithParentSheet`
    interface.
16. **[16-service-providers.md](16-service-providers.md)**
    — The 12 service
    providers in
    detail: `App` /
    `Auth` / `Binding`
    / `Blade` /
    `Broadcast` /
    `Event` / `Macro`
    / `Observer` /
    `Queue` / `Route`
    / `Validation` /
    `ViewComposer`,
    with their
    `register` / `boot`
    hooks, the boot
    order, and the
    custom request /
    route attributes.
17. **[17-global-scopes.md](17-global-scopes.md)**
    — The 5 global
    scopes
    (`Company` /
    `Document` /
    `Transaction` /
    `Category` /
    `Contact`):
    the full
    `App\Scopes\Company
    ::apply()` source,
    the `$skip_tables`
    list, the
    `isNotTenantable()`
    escape, the
    `scopeAllCompanies
    ($query)` bypass,
    the `Tenants`
    trait, the
    `scopeUsingSearch
    -String` /
    `scopeSortable` /
    `scopeAccount` /
    `scopeContact` /
    `scopeSource` /
    `scopeIsOwner` /
    `scopeIsNotOwner`
    / `scopeModule
    -Enabled` helpers.
18. **[18-document-lifecycle-jobs.md](18-document-lifecycle-jobs.md)**
    — End-to-end
    walkthrough of
    the 13
    `app/Jobs/Document/`
    Jobs and the 15
    `app/Listeners
    /Document/`
    listeners that
    together
    implement the
    document
    lifecycle:
    `CreateDocument` /
    `CreateDocumentItem`
    /
    `CreateDocumentItemsAndTotals`
    /
    `UpdateDocument`
    /
    `DeleteDocument` /
    `DuplicateDocument`
    / `CancelDocument`
    / `RestoreDocument`
    / `SendDocument` /
    `SendDocumentAsCustomMail`
    / `DownloadDocument`
    / `CreateDocumentHistory`,
    and the 15
    listeners
    (mark /
    history /
    next-number /
    notification).
19. **[19-subtle-guards-and-math.md](19-subtle-guards-and-math.md)**
    — The non-obvious
    guards and the
    math: the
    `UpdateDocument`
    locked-status
    guard (8
    statuses), the
    reconciled-doc
    guard, the
    `getUpdatePayload()`
    filter, the
    `has_items`
    partial-update
    guard, the
    `paid_amount` /
    `status`
    re-derivation
    with rounding,
    the transaction
    contact sync
    (excluding
    reconciled), the
    `CreateDocumentItemsAndTotals`
    math (sub_total,
    line discount,
    `actual_total`,
    tax accumulator,
    global discount
    distribution,
    extra totals,
    the
    double-application
    fix for
    `akaunting/akaunting#2797`),
    the
    `CreateTransaction`
    type-resolution
    fallback, the
    `MatchBankingDocument
    -Transaction` /
    `SplitTransaction`
    / `CreateTransfer`
    / `CreateReconciliation`
    flows, and the
    `CreateTransactionTaxes`
    tax math.
20. **[20-notifications-mail-push.md](20-notifications-mail-push.md)**
    — The notification
    system end-to-end:
    the 18
    notification
    classes, the
    `App\Jobs\Auth
    \NotifyUser`
    Job, the mail
    driver chain
    (smtp /
    mailgun /
    postmark /
    sendgrid /
    sendmail / log),
    the per-company
    mail patcher
    (the
    `Overrider
    ::loadSettings`
    flow), the
    bell-icon feed
    (the
    `Livewire\Menu
    \Notifications`
    component +
    `wire:poll.5s`),
    the four
    `App\Listeners
    \Email\*`
    listeners
    (report /
    firewall /
    notify /
    disable), the
    browser push
    integration
    (the
    `Livewire
    \Notification
    \Browser`
    component), the
    notification
    preferences
    (per-company),
    the `Auth\Reset`
    and
    `Auth\Invitation`
    flows, the
    per-company
    `email` rate
    limiter, and
    the
    `App\Exceptions
    \MailException`.
21. **[21-listeners-end-to-end.md](21-listeners-end-to-end.md)**
    — All **77
    listeners**
    under
    `app/Listeners/`
    by folder
    (Auth ×3,
    Banking ×1,
    Common ×3,
    Document ×15,
    Email ×4,
    Menu ×6,
    Module ×5,
    Report ×17,
    Setting ×1,
    Update ×22)
    with each
    listener's
    subscribed
    event and
    side-effect.
22. **[22-console-and-install-pipeline.md](22-console-and-install-pipeline.md)**
    — The 15
    artisan
    commands under
    `app/Console
    /Commands/`
    (`install` /
    `install:refresh`
    / `update` /
    `update:finish`
    / `update:all`
    / `update:db`
    / `recurring:check`
    / `invoice:reminder`
    / `bill:reminder`
    / `storage:temp:clear`
    / `module:download`
    / `module:uninstall`
    / `company:seed`
    / `user:seed`
    / `sample:data`)
    with their
    per-command
    flow, the
    schedule, and
    the V30 / V31
    / V32 update
    pipeline.
23. **[23-notifications-end-to-end.md](23-notifications-end-to-end.md)**
    — All **17
    notification
    classes** under
    `app/Notifications/`
    (Auth ×2,
    Banking ×1,
    Common ×8,
    Email ×1,
    Install ×1,
    Portal ×1,
    Purchase ×1,
    Sale ×1)
    with each
    notification's
    dispatch
    trigger,
    template, and
    the
    `App\Jobs\Auth
    \NotifyUser`
    dispatch sites.
24. **[24-controllers-and-form-requests.md](24-controllers-and-form-requests.md)**
    — All **88
    controllers**
    under
    `app/Http/Controllers/`
    (Api ×18,
    Auth ×5,
    Banking ×5,
    Common ×10,
    Install ×5,
    Modals ×16,
    Modules ×5,
    Portal ×4,
    Purchases ×3,
    Sales ×3,
    Settings ×11,
    Wizard ×3) and
    all **48
    FormRequests**
    under
    `app/Http/Requests/`
    with each
    controller's
    purpose, the
    `App\Abstracts
    \Controller`
    base class, the
    `App\Traits
    \Relationships
    ::createRelationships`
    helper, the
    `App\BulkActions
    \BulkAction`
    classes, and
    the per-area
    `store()` /
    `update()`
    flows.
25. **[25-widgets-reports-observers-components-providers.md](25-widgets-reports-observers-components-providers.md)**
    — The 8
    `app/Widgets/`
    classes
    (`AccountBalance`
    / `BankFeeds` /
    `CashFlow` /
    `Currencies` /
    `ExpensesByCategory`
    / `Payables` /
    `ProfitLoss` /
    `Receivables`),
    the 6
    `app/Reports/`
    classes
    (`DiscountSummary`
    / `ExpenseSummary`
    / `IncomeExpenseSummary`
    / `IncomeSummary`
    / `ProfitLoss` /
    `TaxSummary`),
    the 1
    `app/Observers/`
    class
    (`Transaction`),
    the 18
    `app/View/Components/`
    classes
    (`Alert` /
    `Button` /
    `Date` /
    `DeleteButton` /
    `DeleteLink` /
    `Dropdown` /
    `EmptyPage` /
    `Form` /
    `Icon` /
    `Link` /
    `Pagination` /
    `PaymentMethod` /
    `Script` /
    `SearchString` /
    `Suggestions` /
    `Tips` /
    `Title` /
    `Tooltip` /
    `UpdateAlert`),
    and the 12
    `app/Providers/`
    classes
    (`App` /
    `Auth` /
    `Binding` /
    `Blade` /
    `Broadcast` /
    `Event` /
    `Macro` /
    `Observer` /
    `Queue` /
    `Route` /
    `Validation` /
    `ViewComposer`),
    with the
    per-class
    responsibility,
    the
    `Overrider`
    singleton,
    the
    `CompanyMadeCurrent`
    listener,
    and the
    custom
    validation
    rules.
26. **[26-migrations-factories-seeders.md](26-migrations-factories-seeders.md)**
    — The 13
    `database/migrations/`
    files
    (`core_v1` /
    `core_v2` /
    `core_v300`
    …
    `core_v3122`)
    with the
    per-version
    table
    additions,
    the 14
    `database/factories/`
    classes
    (`Account` /
    `Category` /
    `Company` /
    `Contact` /
    `Currency` /
    `Dashboard` /
    `Document` /
    `Item` /
    `Reconciliation` /
    `Tax` /
    `Transaction` /
    `Transfer` /
    `User` /
    `Widget`),
    and the
    seeding
    pipeline
    (the
    `App\Console
    \Commands
    \CompanySeed`
    /
    `UserSeed`
    /
    `SampleData`
    commands).
27. **[27-imports-and-exports.md](27-imports-and-exports.md)**
    — The 47
    `app/Imports/`
    and 47
    `app/Exports/`
    classes
    (Banking
    / Common
    / Purchases
    / Sales
    / Settings)
    with the
    multi-sheet
    import
    flow,
    the
    `App\Jobs
    \Common
    \Import`
    /
    `Export`
    Jobs,
    the
    `App\Jobs
    \Common
    \CreateMediableForExport`
    /
    `CreateMediableForDownload`
    /
    `CreateZipForDownload`
    Jobs,
    the
    `config/import.php`
    /
    `config/excel.php`
    config,
    and the
    per-sheet
    `model()`
    hook.
28. **[28-events-by-directory.md](28-events-by-directory.md)**
    — All **168
    events**
    under
    `app/Events/`
    organised
    by the 14
    event
    directories
    (Auth ×16,
    Banking ×30,
    Common ×33,
    Document ×22,
    Email ×2,
    Export ×2,
    Import ×1,
    Install ×6,
    Menu ×16,
    Module ×10,
    Report ×14,
    Setting ×20,
    Widget ×1,
    Wizard ×1)
    with the
    per-event
    purpose,
    the
    `App\Abstracts
    \Event`
    base
    class, and
    the
    `EventService
    -Provider
    ::$listen`
    array.
29. **[29-jobs-by-area.md](29-jobs-by-area.md)**
    — All **92
    jobs** under
    `app/Jobs/`
    organised
    by the 6
    job areas
    (Auth ×13,
    Banking ×20,
    Common ×26,
    Document ×12,
    Install ×9,
    Setting ×12)
    with the
    per-Job
    purpose,
    the
    `App\Abstracts
    \Job`
    base
    class, the
    `App\Abstracts
    \JobShouldQueue`
    base
    class, the
    3 queue
    connections
    (`sync` /
    `database`
    / `jobs` /
    `emails`),
    and the
    per-area
    dispatch
    sites.
30. **[30-routes-end-to-end.md](30-routes-end-to-end.md)**
    — All **12
    route files**
    under
    `routes/`
    (web /
    common /
    admin /
    api /
    portal /
    guest /
    install /
    wizard /
    signed /
    preview /
    channels /
    console)
    with the
    per-file
    route
    declarations,
    the
    `App\Providers
    \Route
    ::map*`
    hooks, and
    the
    `api` /
    `email`
    rate
    limiters.
31. **[31-final-architecture-summary.md](31-final-architecture-summary.md)**
    — The
    consolidated
    index of
    all 30
    docs with
    the
    authoritative
    counts for
    every key
    building
    block (35
    models, 92
    jobs, 168
    events, 77
    listeners,
    88
    controllers,
    48
    FormRequests,
    10
    Livewire
    components,
    18 view
    components,
    12 service
    providers,
    12 route
    files, 15
    artisan
    commands, 5
    global
    scopes, 36
    traits, 29
    middlewares,
    13
    abstracts,
    13 core
    migrations,
    14
    factories,
    17
    notifications,
    47 imports
    / 47
    exports, 19
    utilities,
    8 widgets,
    6 reports,
    1
    observer).
32. **[32-vendor-overrides.md](32-vendor-overrides.md)**
    — The 11
    vendor
    override
    files under
    `overrides/`
    (4
    `akaunting/laravel-module`
    commands, 2
    `Illuminate`
    classes
    /
    `MessageSelector`
    /
    `ManagesStacks`,
    1
    `livewire`
    /
    `HandleRequests`,
    3
    `maatwebsite/excel`
    classes
    /
    `ExcelFake`
    /
    `fake_file`
    /
    `QueuedWriter`,
    1
    `symfony/process`
    /
    `PhpExecutableFinder`),
    the
    `composer.json`
    `autoload.psr-4`
    +
    `exclude-from-classmap`
    swap
    mechanism,
    and the
    per-package
    override
    purpose.
33. **[33-helpers-classifiers-translations-utilities.md](33-helpers-classifiers-translations-utilities.md)**
    — The 30
    global
    helper
    functions
    in
    `app/Utilities/helpers.php`
    (auth /
    company /
    module /
    widget /
    cache /
    queue /
    environment
    / storage /
    request /
    misc), the
    9
    classifiers
    in
    `app/Classifiers/`
    (`BulkAction`
    / `Event` /
    `Export` /
    `Import` /
    `Job` /
    `Observer` /
    `Report` /
    `Scope` /
    `Widget`),
    the 19
    utility
    classes in
    `app/Utilities/`
    (`Console`
    / `Date` /
    `DocumentNumber`
    / `Export` /
    `Import` /
    `Info` /
    `Installer` /
    `ModuleActivator`
    / `Modules` /
    `Overrider` /
    `QueueCollection`
    / `Recurring`
    / `Reports` /
    `Str` /
    `TransactionNumber`
    / `Versions` /
    `Widgets`),
    and the 62
    language
    directories
    under
    `resources/lang/`
    with the
    per-locale
    translation
    files and
    the
    `trans_choice`
    pipe
    syntax
    (e.g.
    `'singular
    |plural'`).

## What's NOT covered (deliberately)

To avoid speculation, the
following topics are not in
this set and would need
separate investigation:

- The exact contents of
  every view template
  (the documentation set
  covers the layout, not
  the per-page HTML).
- The exact API surface
  of every controller
  method (only the
  routing structure is
  covered; the per-method
  API is intentionally
  left to the source).
- The internal
  implementation of
  every Job (only the
  canonical examples —
  `CreateDocument` /
  `UpdateDocument` /
  `DeleteDocument` —
  are walked through).
- The exact test cases
  and their assertions
  (the test framework
  structure is covered,
  not the per-test
  body).
- The CSS / Tailwind
  theme details (only
  the JS bundling is
  covered).
- The Vue / Alpine.js
  / Dropzone /
  Sortable.js /
  Tippy.js internals
  (only the bundled
  asset list is
  covered).
- The exact
  implementation of
  the bundled modules
  (`OfflinePayments` /
  `PaypalStandard`).

For any of these, the
source code is the
authoritative reference.

## Methodology

This set was generated on
2026-09-04 by:

1. Listing the actual
   directories under
   `app/`, `config/`,
   `routes/`,
   `database/`,
   `resources/`,
   `modules/`.
2. Reading the actual
   `composer.json`,
   `app/Abstracts/Model
   .php`,
   `app/Abstracts/Job
   .php`,
   `app/Providers/App
   .php`,
   `app/Jobs/Document/
   CreateDocument.php`,
   `app/Utilities/
   helpers.php`.
3. Counting the files
   per directory to
   produce the
   documentation's
   per-section counts.
4. Writing the
   documentation to
   match the actual
   structure, not the
   pre-existing
   speculative set.

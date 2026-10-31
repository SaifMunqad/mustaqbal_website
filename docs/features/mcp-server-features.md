# MCP Server — Feature Catalog (authoritative)

> **Purpose of this file:** every behavior below is *intentional and verified*.
> If an agent reads this repo (or an MCP trace) and something here looks wrong,
> it is not a bug to fix — it is a designed property. Each entry lists **where it
> is enforced** and **which test pins it**. Do not remove or "clean up" any of it
> without removing/replacing its pinning test in the same change.
>
> Server: `Mustaqbal School Dashboard` v1.2.0 — route `POST /mcp` (also GET/DELETE for the streamable transport).
> Verified: 2026-10-31 — **80 tests (400 assertions)** pin the behaviors below
> (`php artisan test tests/Feature/Mcp tests/Feature/PageBuilderTest.php`); full suite: 341 passed.

---

## 1. Architecture invariants

| # | Feature | Why it is intentional | Enforced in | Pinned by |
|---|---------|----------------------|-------------|-----------|
| A1 | **Zero business logic in tools.** Every tool is a ~30-line declarative subclass that forwards to an *existing dashboard controller action*. | The dashboard remains the single source of truth for validation, policies, and side effects. A "cleaner" bespoke API layer would drift from the web UI. (`development_practice_specification` no-duplication rule) | `app/Mcp/Tools/DashboardTool.php`, `app/Mcp/Support/DashboardDispatcher.php` | `tests/Feature/Mcp/DashboardMcpTest.php` (controller persistence tests) |
| A2 | **Permissions are exactly the browser's.** The dispatcher looks up the action's route and replays its middleware (`role:*`, `verified`, `active`) before calling the controller. | An MCP token is an account, not an override. Same user = same abilities. | `DashboardDispatcher::enforceRouteGuards()` | `DashboardMcpTest::test_route_role_middleware_is_replayed_for_mcp_callers`, `McpHardeningTest` reason/forbidden tests |
| A3 | **Fail-closed guard replay.** If the matching route (union of *all* routes mapped to that action) carries middleware outside `web/api/auth/verified/active/role`, the call is **refused**, not skipped. | A future `throttle:`/`signed:`/custom gate on a dashboard route must never be bypassed silently over MCP. Refusal is the safe answer; do not add middleware names to `REPLAYABLE` without thinking. | `DashboardDispatcher::REPLAYABLE`, `enforceRouteGuards()` | `McpHardeningTest::test_actions_guarded_by_unplayable_middleware_are_refused` |
| A4 | **Unrouted actions are refused.** An action with no matching route never runs over MCP. | Prevents exposing unguarded public controller methods as "tools". | `enforceRouteGuards()` | same test file |
| A5 | **State snapshot/restore is capability-aware.** The dispatcher swaps container request/session/auth and restores in a `finally` — using `method_exists` checks on the *web guard* rather than `Auth::getUser()/setUser()/forgetUser()`. | `AuthManager` proxies those methods to whatever guard is default; under `auth:sanctum` that is `RequestGuard`, which **lacks them** — the naive version crashed every live bearer-token call (found via real curl). | `DashboardDispatcher::execute()/restore()` | `McpHardeningTest::test_eager_tool_over_http_with_a_sanctum_token_succeeds` |
| A6 | **Files ride the same FormRequest pipeline.** Upload tools construct real `UploadedFile` objects and inject them into the rebuilt request; all mime/size rules of `StoreUploadRequest`, `StoreBookPdfRequest`, `StoreFontRequest` still run. | No separate upload validation path to drift. | `DashboardDispatcher::buildRequest(..., $files)`, `FileTransferTool`, `UploadFontTool` | `PageBuilderMcpTest` upload tests |

---

## 2. Auth & transport features

| # | Feature | Looks like a bug because | Intentional — details |
|---|---------|--------------------------|-----------------------|
| T1 | **`MCP_AUTH_TOKEN` in `.env` is read by nothing.** Real auth is a Sanctum personal-access token in `Authorization: Bearer ID|secret`, issued via `php artisan mcp:token <email>`. | A stale env var named "MCP_AUTH_TOKEN" begs to be (mis)used; sending it always 401s. | Do **not** "wire it up". Do not delete the var silently either — leave it; it is documented here as a decoy. Verified by `mcp:self-test 'ID|secret'`. |
| T2 | **`mcp.auth` middleware (`RecoverAuthorizationHeader`) runs before `auth:sanctum`.** On Apache/LiteSpeed + PHP-FPM shared hosting the `Authorization` header is stripped from `$_SERVER`; this middleware recovers it from `REDIRECT_HTTP_AUTHORIZATION` et al. | "Why a custom auth middleware? Sanctum should just work." — It doesn't, on our production hosting; 401-only-over-HTTP was the symptom. | Paired with `SetEnvIf` + rewrite rules in `public/.htaccess`. Redeploy both together. |
| T3 | **`/mcp` is throttled 120 req/min per IP** (`throttle:mcp`, defined in `AppServiceProvider::boot`). | Agents may hit 429 during bursts; looks like flaky infra. | Deliberate budget for a write-capable endpoint. Raise the limit in config only by decision, not accident. |
| T4 | **Every MCP request writes one audit line** to `storage/logs/mcp-audit-<date>.log` (daily, 90 days, `mcp_audit` channel): user, method, tool, **`args_hash`**, inner `calls[]` for `execute_tools`, error flag, duration, IP. | Raw arguments are absent — "logs are useless / data was lost". | **Privacy by design**: payloads carry personal enrolment/contact data. The hash (12-char md5 prefix) is enough to correlate. Do not log raw args. |
| T5 | **Batch results stream as SSE**, single-call results return buffered JSON. The transport decides by response count. | A client expecting JSON sees `data:` frames and concludes the endpoint is broken. | Spec-conformant streamable HTTP. Parse `data:` lines, or call one tool per request for JSON. Pinned by `McpHardeningTest::test_catalogued_tools_run_over_http_through_the_execute_gateway`. |
| T6 | **The server is stateless-friendly:** `initialize` is optional per request in our deployment; no session-id headers are emitted. | "Missing Mcp-Session-Id must be a bug." | Working live pattern: token → `initialize` → `tools/call`. Don't invent session handling; the package's transport owns it. |

---

## 3. Dynamic tool loading (v1.2.0)

The 89 tools split into two registration tiers (see `SchoolDashboardServer::$tools`):

**Eager — always in `tools/list` (10):**
`DashboardStats`, `ListBuilderPages`, `GetPageLayout`, `UpdatePageLayout`, `AddPageSection`, `UpdatePageSection`, `RemovePageSection`, `ReorderPageSections`, `UploadMedia`, `GetSiteSettings`

**Catalogued — reachable only via the gateway pair `search_tools` + `execute_tools` (79):**
legacy `GetHomePageLayout`/`UpdateHomePageLayout`; media/typography (`UploadBookPdf`, `UploadFont`, `DeleteFont`, `AssignLanguageFont`, `PreviewPalette`); articles; posts; events; enrollments; users; programs; jobs & applications; books & categories; contacts; messages; awards; languages; site settings update; about publication; email campaigns; WhatsApp campaigns/settings; mails.

| # | Feature | Why it is NOT a bug |
|---|---------|---------------------|
| D1 | **Catalogued tools return "Tool [X] not found" when called directly by name via `tools/call`.** | Dynamic loading design: discovery goes through `search_tools`, execution through `execute_tools`. Making them directly callable again would re-bloat every client's context with 79 schemas. Tests must call catalog tools through the gateway (`tests/Feature/Mcp/CallsCatalogTools` trait mirrors production). |
| D2 | **`search_tools` returns full `inputSchema` per hit; `execute_tools` runs up to `config('mcp.tool_search.max_tool_calls')` (10) calls, 64KB output cap.** | Limits are the package defaults, deliberate. Tune in `config/mcp.php` only by decision. Pinned by `ToolSearchMcpTest::test_execute_tools_respects_the_batch_cap`. |
| D3 | **`execute_tools` stops on the first failed call; earlier calls have already committed. Batches are NOT atomic.** | "partial application looks broken" — it is the documented contract ("Execution stops on the first error"). Agents must inspect each `results[]` entry, not just overall success. Do not add rollback without a plan; dashboard side effects (mail, WhatsApp jobs) can't roll back anyway. |
| D4 | **Guard replay also applies inside `execute_tools`** — a management user batching an admin-only tool gets the same `forbidden` error. | The gateway is not a permission bypass; `invokeTool` dispatches the real registered tool through the same invoker. Pinned by `ToolSearchMcpTest::test_execute_tools_enforces_the_same_role_guards`. |
| D5 | Eager tools must **not** be put in the catalog (and vice versa) casually: `PageSectionEditor` and tests depend on the split. | Server refuses duplicate names once `ToolSearch` is present; keep the 10 eager = daily-driver core. |

---

## 4. Visual page builder (home / about / contact)

The highest-value surface — and the one whose semantics are easiest to "fix" wrongly. The writer is `App\Support\Home\PageLayoutWriter`; entry points: `DashboardPageBuilderController::save` (route `PUT /dashboard/pages/{key}`) and the MCP tools.

| # | Behavior | Looks like | Is actually |
|---|----------|-----------|-------------|
| P1 | **Merge-by-default saves.** A layout save without `remove_missing: true` **keeps every existing section not mentioned** in the payload; unmentioned blocks are renumbered *behind* the submitted ones, preserving relative order. | "A partial save doesn't delete the omitted blocks — the delete logic is broken!" | The whole point. Agents sending one banner must never wipe a page (reported data-loss incident, Oct 2026). Pinned by `PageBuilderTest::test_builder_save_endpoint_keeps_unmentioned_sections_by_default` and `PageBuilderMcpTest::test_partial_update_page_layout_keeps_unmentioned_sections`. |
| P2 | **Explicit destructive replace.** Deletion of omitted sections happens ONLY with `remove_missing=true` — sent by the web editor (`dashboard-page-builder-home.tsx` `save()`) and by `UpdatePageLayout(remove_missing: true)` when an agent asks for it. | "Why does the frontend send a weird extra flag?" | The human editor stages the complete layout; its save *is* an intentional replace. Removing the flag from the frontend would silently break human block deletion. Pinned by `..._deletes_only_with_explicit_remove_missing` + `test_remove_missing_true_still_replaces_the_whole_layout`. PHP + frontend deploy together. |
| P3 | **Optimistic lock, applied narrowly.** `expected_revision` (stamp from `GetPageLayout`'s `page.revision`) is sent for `UpdatePageLayout` (when caller includes it), `UpdatePageSection` (same-block lost-update protection), and `RemovePageSection` (destructive). It is deliberately NOT sent for `AddPageSection`/`ReorderPageSections`. | "Reorders have no concurrency protection — bug!" | Add/reorder are merge-safe since P1: a stale draft can't destroy siblings, so failing them with "layout changed" was false friction causing retry storms. Keep the asymmetry. Pinned by `McpHardeningTest::test_stale_revision_blocks_a_whole_layout_overwrite`, `..._section_tools_reuse_the_revision_they_just_read`. |
| P4 | **Unknown translation codes fail loudly.** A section payload containing `translations.<code>` outside the active language set is rejected *before* persisting, listing the valid codes (e.g. `fa` rejected; `fa_AF` active). | "Too strict — the writer used to just ignore unknown codes." | The old silent-skip returned `success` while text vanished (silent data loss). `DashboardPageBuilderController::assertKnownTranslationCodes`. Pinned by `PageBuilderTest::test_builder_save_endpoint_rejects_unknown_translation_language_codes` and the MCP equivalent. The writer's own filter remains as defense-in-depth; do not remove either. |
| P5 | **Draft format is the contract.** Sections round-trip exactly as `GetPageLayout` returns: `translations` keyed by active code → {title, heading, body, cta_label}; `lists` keyed group → code (`''` = shared) → ordered rows; `items` as {id, type} references. Display-only keys in the draft (`type_label`, `kind`, `stores`, `list_group`, …) are ignored on save (filtered by `validated()`). | "Extra keys in responses should be stripped; blank seeded translations are noise." | The fallback-free draft (every active language present, un-authored = blank) is what prevents accidentally clobbering one language with the default text. Do not "simplify" it. |
| P6 | **Block caps are server-side.** `maxInstances` per `SectionType` is enforced in the writer (`assertWithinCaps`), regardless of what a client "sees" in the palette. | "Palette says addable but the save refused — inconsistent?" | Authoritative check is deliberate (palette can be stale); both share `BlockRegistry`. |
| P7 | **Curated vs authored blocks.** Curated types (testimonials, programs, jobs, …) get content from `items[]` model references (`availableItems` lists candidates); authored types use `lists`/`translations`. | "Adding a testimonials section with text does nothing." | Correct: curated blocks render referenced records. |
| P8 | All three builder pages share one controller, one catalog, one writer — `page` key selects storage; new builder pages only need `BuilderPages` entry + two routes. | — | Extension surface by design (`BuilderPages::PAGES`). |

---

## 5. Media & files

| # | Feature | Note |
|---|---------|------|
| M1 | **`UploadMedia`/`UploadBookPdf`/`UploadFont` accept `url` or `base64`+`filename`** (25MB hard cap in `MediaTransfer`; per-endpoint FormRequest caps apply after: 5MB image, 20MB PDF, 5MB font file). | JSON-only transport bridging to real `UploadedFile`s — never "optimize" back to multipart-only endpoints. |
| M2 | **SSRF refusal is by design:** only `http(s)`, only ports 80/443, hosts whose *resolved addresses* are all publicly routable; **redirects are never followed** (3xx → error "pass the final URL"). | Looks like an annoying limitation to agents passing localhost/metadata URLs. It is the security fix for live-curl-discovered exposure. Pinned by `McpHardeningTest::test_url_transfer_refuses_private_and_non_http_targets`. Do not relax. |
| M3 | **Two path conventions:** media *URLs* (`/storage/uploads/…` → use `url` from the response) for posts/events/builder `image_path`; **disk-relative paths** (`file_path`, `thumbnail_path`) for book PDFs. | Mixing them is an agent error the server doesn't guess-fix; keep both, document in tool descriptions. |
| M4 | **Post-upload routability re-check** (existing convention): uploads verify the file landed on the public disk before reporting success. | Don't remove the re-check as "redundant". |
| M5 | **Font deletion is refused while a language references it; `AssignLanguageFont` selection is `default` / `google:{key}` / `font:{id}`** (assigning one kind clears the other column). | Mirrors the web typography screen; pinning test in `PageBuilderMcpTest` + `tests/Feature/TypographyTest.php`. |

---

## 6. Errors & response conventions

| # | Convention | Why |
|---|-----------|-----|
| E1 | **Two error channels.** Validation/failed-business checks return **structured success-shaped payloads** (`status: validation_failed`, `errors: {field: […]}`) — these are *data*, not transport errors. Only auth/permission/infra failures produce `isError: true` whose text is JSON `{"status":"error","reason":…}` with reason ∈ `unauthenticated|forbidden|not_found|throttled|failed`. | Agents can branch on `reason` / `status` instead of parsing prose. Note the asymmetry: a validation failure through `execute_tools` does **not** abort the batch with `isError` — it appears as a `validation_failed` result entry. Pinned by `DashboardMcpTest`, `McpHardeningTest`. |
| E2 | **Inertia props are the read shape.** Read tools return the *dashboard page props* (`McpResponse::structured($props)`), including display-only fields. | Deliberate: one source for what the human sees = what the agent reads. Do not invent separate API resources (no-duplication rule). Clients that want less data use `search_tools`/field filtering per call, not new transformers. |
| E3 | **Flash messages come back as i18n keys** (`messages.success = "flash.pageSaved"`). | They are frontend-translation keys, not prose. Stable contract — the web UI translates them. Don't translate server-side. |
| E4 | `laravel/mcp` package quirks that are **expected**: `Response::structured()` returns a `ResponseFactory` (not `Response`) — handle both in return types; `actingAs()->tool()` resolves registered tools by *name*, so catalog tools must go through `execute_tools`; test `assertStructuredContent` closures must touch **every** root key (`interacted()` strictness). | Pinned patterns in `tests/Feature/Mcp/*`. |

---

## 7. Feature matrix by dashboard module (catalog tier)

Read = `List*/Show*`; write = `Create*/Update*`; ⚠ = destructive (needs explicit intent + guards):

| Module | Read | Write | Destructive | Role gate (route middleware) |
|--------|------|-------|-------------|------------------------------|
| Stats / dashboard | `DashboardStats` | — | — | any verified+active |
| Builder pages | `ListBuilderPages`, `GetPageLayout`, `GetSiteSettings` | `UpdatePageLayout`, 4×section tools, `UploadMedia` | ⚠ via `remove_missing`/`RemovePageSection` | management |
| Articles | `ListArticles`, `ShowArticle` | `CreateArticle`, `UpdateArticle` | — | any (policies inside) |
| Posts | `ListPosts`, `ShowPost` | `CreatePost`, `UpdatePost` | — | any |
| Events | `ListEvents`, `ShowEvent` | `CreateEvent`, `UpdateEvent` | ⚠ `DeleteEvent` | any |
| Enrollments | `ListEnrollments`, `ShowEnrollment` | `UpdateEnrollmentStatus`, `ReplyEnrollment` (sends mail) | — | management |
| Users | `ListUsers` | `CreateUser`, `UpdateUser` | ⚠ `DeleteUser` | auth only (policy-gated inside) |
| Programs | `ListPrograms`, `ShowProgram` | `CreateProgram`, `UpdateProgram` | — | management for writes |
| Jobs/Applications | `ListJobs`, `ListJobApplications`, `ShowJobApplication` | `CreateJob`, `UpdateJob`, `UpdateJobApplicationStatus` | ⚠ `DeleteJob` | management |
| Bookstore | `ListBooks`, `ShowBook`, `ListBookCategories` | `Create*`, `Update*`, `UploadBookPdf` | ⚠ `DeleteBook`, ⚠ `DeleteBookCategory` (refused when non-empty) | management |
| Contacts/Messages | `List*`, `ShowMessage` | `CreateContact`, `UpdateContact`, `UpdateMessage`, `AnswerMessage` (mail) | — | management for writes |
| Awards | `ListAwards` | `CreateAward`, `UpdateAward` | ⚠ `DeleteAward` (admin) | management |
| Languages | `ListLanguages` | `Create/Update/Delete`, `ReorderLanguages` | ⚠ delete refused while referenced | **admin** |
| Site settings | `GetSiteSettings` | `UpdateSiteSettings` (section-partials honored), `PreviewPalette` | — | management |
| Typography | (fonts in `GetSiteSettings` props) | `UploadFont`, `AssignLanguageFont` | ⚠ `DeleteFont` (refused while used) | management |
| About page | `GetAboutPage` | `UpdateAboutPage` (publish toggle) | — | management |
| Email campaigns | `ListEmailCampaigns`, `ShowEmailCampaign` | `CreateEmailCampaign` (queues sends), `RetryEmailCampaign` | ⚠ irreversible sends | **admin** |
| WhatsApp | `ListWhatsAppCampaigns`, `ShowWhatsAppCampaign`, `GetWhatsAppSettings` | `CreateWhatsAppCampaign`, `Retry…`, `UpdateWhatsAppSettings`, `TestWhatsAppSettings` | ⚠ irreversible sends | **admin** |
| Mail log | `ListMails` | — | — | management |

---

## 8. Known non-features (deliberately absent)

- **No REST mirror / separate API routes** for tools — everything flows through `/mcp` in-process. (Discussed and declined; would duplicate the dashboard surface.)
- **No pagination/field projection on List\* tools** yet — they mirror the web first page. Adding them is an enhancement ticket, not a bug fix.
- **No MCP resources/prompts** — usage guidance lives in `#[Instructions]` + tool descriptions.
- **No binary download tools** (job-application documents) — binary content doesn't fit JSON-RPC; out of scope.
- **No undo/confirmation semantics** — destructive tools fail closed instead (merge default, revision, role gates).
- **No Inertia SSR anywhere** (system-wide removal — unrelated but frequently "rediscovered").

---

## 9. Change policy for future agents

1. **Read this file before "fixing" anything** in `app/Mcp/**`, `app/Support/Home/**`, `routes/ai.php`, `public/.htaccess`, or the builder frontend.
2. Every behavior above has a pinning test under `tests/Feature/Mcp/` or `tests/Feature/PageBuilderTest.php`. **Removing a feature means removing/updating its test in the same commit** — if you can't point at the test, you don't understand the feature; ask.
3. New dashboard module → new MCP tools follow the declarative pattern (subclass `DashboardTool`, forward to a controller action, add schema, register in `SchoolDashboardServer`, eager vs catalog decision documented here). Never re-implement logic in the tool.
4. Deploy pairing: builder-frontend (`remove_missing` payload) ⇄ backend controller ⇄ MCP tools are one contract; ship together and run `php artisan optimize:clear` on shared hosting (no sudo).

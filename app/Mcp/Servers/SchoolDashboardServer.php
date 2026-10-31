<?php

declare(strict_types=1);

namespace App\Mcp\Servers;

use App\Mcp\Tools\AddPageSectionTool;
use App\Mcp\Tools\AnswerMessageTool;
use App\Mcp\Tools\AssignLanguageFontTool;
use App\Mcp\Tools\CreateArticleTool;
use App\Mcp\Tools\CreateAwardTool;
use App\Mcp\Tools\CreateBookCategoryTool;
use App\Mcp\Tools\CreateBookTool;
use App\Mcp\Tools\CreateContactTool;
use App\Mcp\Tools\CreateEmailCampaignTool;
use App\Mcp\Tools\CreateEventTool;
use App\Mcp\Tools\CreateJobTool;
use App\Mcp\Tools\CreateLanguageTool;
use App\Mcp\Tools\CreatePostTool;
use App\Mcp\Tools\CreateProgramTool;
use App\Mcp\Tools\CreateUserTool;
use App\Mcp\Tools\CreateWhatsAppCampaignTool;
use App\Mcp\Tools\DashboardStatsTool;
use App\Mcp\Tools\DeleteAwardTool;
use App\Mcp\Tools\DeleteBookCategoryTool;
use App\Mcp\Tools\DeleteBookTool;
use App\Mcp\Tools\DeleteEventTool;
use App\Mcp\Tools\DeleteFontTool;
use App\Mcp\Tools\DeleteJobTool;
use App\Mcp\Tools\DeleteLanguageTool;
use App\Mcp\Tools\DeleteUserTool;
use App\Mcp\Tools\GetAboutPageTool;
use App\Mcp\Tools\GetHomePageLayoutTool;
use App\Mcp\Tools\GetPageLayoutTool;
use App\Mcp\Tools\GetSiteSettingsTool;
use App\Mcp\Tools\GetWhatsAppSettingsTool;
use App\Mcp\Tools\ListArticlesTool;
use App\Mcp\Tools\ListAwardsTool;
use App\Mcp\Tools\ListBookCategoriesTool;
use App\Mcp\Tools\ListBooksTool;
use App\Mcp\Tools\ListBuilderPagesTool;
use App\Mcp\Tools\ListContactsTool;
use App\Mcp\Tools\ListEmailCampaignsTool;
use App\Mcp\Tools\ListEnrollmentsTool;
use App\Mcp\Tools\ListEventsTool;
use App\Mcp\Tools\ListJobApplicationsTool;
use App\Mcp\Tools\ListJobsTool;
use App\Mcp\Tools\ListLanguagesTool;
use App\Mcp\Tools\ListMailsTool;
use App\Mcp\Tools\ListMessagesTool;
use App\Mcp\Tools\ListPostsTool;
use App\Mcp\Tools\ListProgramsTool;
use App\Mcp\Tools\ListUsersTool;
use App\Mcp\Tools\ListWhatsAppCampaignsTool;
use App\Mcp\Tools\PreviewPaletteTool;
use App\Mcp\Tools\RemovePageSectionTool;
use App\Mcp\Tools\ReorderLanguagesTool;
use App\Mcp\Tools\ReorderPageSectionsTool;
use App\Mcp\Tools\ReplyEnrollmentTool;
use App\Mcp\Tools\RetryEmailCampaignTool;
use App\Mcp\Tools\RetryWhatsAppCampaignTool;
use App\Mcp\Tools\ShowArticleTool;
use App\Mcp\Tools\ShowBookTool;
use App\Mcp\Tools\ShowEmailCampaignTool;
use App\Mcp\Tools\ShowEnrollmentTool;
use App\Mcp\Tools\ShowEventTool;
use App\Mcp\Tools\ShowJobApplicationTool;
use App\Mcp\Tools\ShowMessageTool;
use App\Mcp\Tools\ShowPostTool;
use App\Mcp\Tools\ShowProgramTool;
use App\Mcp\Tools\ShowWhatsAppCampaignTool;
use App\Mcp\Tools\TestWhatsAppSettingsTool;
use App\Mcp\Tools\UpdateAboutPageTool;
use App\Mcp\Tools\UpdateArticleTool;
use App\Mcp\Tools\UpdateAwardTool;
use App\Mcp\Tools\UpdateBookCategoryTool;
use App\Mcp\Tools\UpdateBookTool;
use App\Mcp\Tools\UpdateContactTool;
use App\Mcp\Tools\UpdateEnrollmentStatusTool;
use App\Mcp\Tools\UpdateEventTool;
use App\Mcp\Tools\UpdateHomePageLayoutTool;
use App\Mcp\Tools\UpdateJobApplicationStatusTool;
use App\Mcp\Tools\UpdateJobTool;
use App\Mcp\Tools\UpdateLanguageTool;
use App\Mcp\Tools\UpdateMessageTool;
use App\Mcp\Tools\UpdatePageLayoutTool;
use App\Mcp\Tools\UpdatePageSectionTool;
use App\Mcp\Tools\UpdatePostTool;
use App\Mcp\Tools\UpdateProgramTool;
use App\Mcp\Tools\UpdateSiteSettingsTool;
use App\Mcp\Tools\UpdateUserTool;
use App\Mcp\Tools\UpdateWhatsAppSettingsTool;
use App\Mcp\Tools\UploadBookPdfTool;
use App\Mcp\Tools\UploadFontTool;
use App\Mcp\Tools\UploadMediaTool;
use Laravel\Mcp\Server;
use Laravel\Mcp\Server\Attributes\Instructions;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Attributes\Version;
use Laravel\Mcp\Server\Tools\ToolSearch;

#[Name('Mustaqbal School Dashboard')]
#[Version('1.2.0')]
#[Instructions('Operate the school admin dashboard over MCP. Every tool delegates to the existing dashboard controllers, so the caller permissions are exactly those of the authenticated Sanctum user: reads list/inspect records, writes create/update them, and destructive tools delete them, all gated by the same role, verified and active middleware and policies as the web dashboard. Prefer the read tools to discover record ids before calling a write tool, and pass the same payload fields the web forms expect. Dynamic tool loading: most module tools are not listed directly — call search_tools with plain terms (e.g. "book", "whatsapp campaign", "language") to discover exact names and full input schemas, then run them through execute_tools as {"calls":[{"name":…, "arguments":…}]}, one after another, stopping on first error; execute_tools enforces the same per-user permissions as direct calls. The always-listed core tools cover stats and the visual page builder. Visual pages: ListBuilderPages lists the editable pages (home, about, contact); GetPageLayout reads a full layout and AddPageSection/UpdatePageSection/RemovePageSection/ReorderPageSections edit one block at a time (safest); UpdatePageLayout replaces a whole layout and removes omitted sections. Concurrency: page.revision from GetPageLayout is an optimistic lock — send it as expected_revision when replacing a layout, and re-read if the save reports the layout changed. Errors: structured status validation_failed carries field errors; error results are JSON with a reason code (unauthenticated|forbidden|not_found|throttled|failed). Files: UploadMedia (and UploadBookPdf/UploadFont via search) accept a url (public http(s) only, no redirects) or base64+filename, and the returned /storage URL can be referenced by posts, books, settings and builder sections. Campaigns: retry tools re-dispatch only failed recipients.')]
class SchoolDashboardServer extends Server
{
    /**
     * The tools registered with this MCP server. Each one forwards to a real
     * dashboard controller action through App\Mcp\Support\DashboardDispatcher,
     * so no business logic is duplicated.
     *
     * Tools listed directly are always visible in tools/list — reserved for
     * the daily-driver core (stats, the visual page builder, media upload,
     * settings read). Everything else lives in the ToolSearch catalog, which
     * registers only the `search_tools` + `execute_tools` pair instead of ~75
     * schemas, keeping the client-side context small as the surface grows.
     *
     * @var array<int|string, class-string<\Laravel\Mcp\Server\Tool>|array<int, class-string<\Laravel\Mcp\Server\Tool>>>
     */
    protected array $tools = [
        DashboardStatsTool::class,
        ListBuilderPagesTool::class,
        GetPageLayoutTool::class,
        UpdatePageLayoutTool::class,
        AddPageSectionTool::class,
        UpdatePageSectionTool::class,
        RemovePageSectionTool::class,
        ReorderPageSectionsTool::class,
        UploadMediaTool::class,
        GetSiteSettingsTool::class,
        ToolSearch::class => [
            // Legacy home-page aliases (superseded by the page-keyed tools).
            GetHomePageLayoutTool::class,
            UpdateHomePageLayoutTool::class,
            // Media & typography.
            UploadBookPdfTool::class,
            UploadFontTool::class,
            DeleteFontTool::class,
            AssignLanguageFontTool::class,
            PreviewPaletteTool::class,
            // Articles & posts.
            ListArticlesTool::class,
            ShowArticleTool::class,
            CreateArticleTool::class,
            UpdateArticleTool::class,
            ListPostsTool::class,
            ShowPostTool::class,
            CreatePostTool::class,
            UpdatePostTool::class,
            // Events.
            ListEventsTool::class,
            ShowEventTool::class,
            CreateEventTool::class,
            UpdateEventTool::class,
            DeleteEventTool::class,
            // Enrollments.
            ListEnrollmentsTool::class,
            ShowEnrollmentTool::class,
            UpdateEnrollmentStatusTool::class,
            ReplyEnrollmentTool::class,
            // Users.
            ListUsersTool::class,
            CreateUserTool::class,
            UpdateUserTool::class,
            DeleteUserTool::class,
            // Programs.
            ListProgramsTool::class,
            ShowProgramTool::class,
            CreateProgramTool::class,
            UpdateProgramTool::class,
            // Jobs & applications.
            ListJobsTool::class,
            CreateJobTool::class,
            UpdateJobTool::class,
            DeleteJobTool::class,
            ListJobApplicationsTool::class,
            ShowJobApplicationTool::class,
            UpdateJobApplicationStatusTool::class,
            // Bookstore.
            ListBooksTool::class,
            ShowBookTool::class,
            CreateBookTool::class,
            UpdateBookTool::class,
            DeleteBookTool::class,
            ListBookCategoriesTool::class,
            CreateBookCategoryTool::class,
            UpdateBookCategoryTool::class,
            DeleteBookCategoryTool::class,
            // Inbox-style records.
            ListContactsTool::class,
            CreateContactTool::class,
            UpdateContactTool::class,
            ListMessagesTool::class,
            ShowMessageTool::class,
            UpdateMessageTool::class,
            AnswerMessageTool::class,
            // Awards.
            ListAwardsTool::class,
            CreateAwardTool::class,
            UpdateAwardTool::class,
            DeleteAwardTool::class,
            // Languages.
            ListLanguagesTool::class,
            CreateLanguageTool::class,
            UpdateLanguageTool::class,
            DeleteLanguageTool::class,
            ReorderLanguagesTool::class,
            // Site & about.
            UpdateSiteSettingsTool::class,
            GetAboutPageTool::class,
            UpdateAboutPageTool::class,
            // Campaigns & integrations.
            ListEmailCampaignsTool::class,
            ShowEmailCampaignTool::class,
            CreateEmailCampaignTool::class,
            RetryEmailCampaignTool::class,
            ListWhatsAppCampaignsTool::class,
            ShowWhatsAppCampaignTool::class,
            CreateWhatsAppCampaignTool::class,
            RetryWhatsAppCampaignTool::class,
            GetWhatsAppSettingsTool::class,
            UpdateWhatsAppSettingsTool::class,
            TestWhatsAppSettingsTool::class,
            ListMailsTool::class,
        ],
    ];
}

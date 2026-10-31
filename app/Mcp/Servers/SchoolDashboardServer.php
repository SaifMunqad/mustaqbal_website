<?php

declare(strict_types=1);

namespace App\Mcp\Servers;

use App\Mcp\Tools\AnswerMessageTool;
use App\Mcp\Tools\CreateArticleTool;
use App\Mcp\Tools\CreateAwardTool;
use App\Mcp\Tools\CreateBookTool;
use App\Mcp\Tools\CreateEmailCampaignTool;
use App\Mcp\Tools\CreateEventTool;
use App\Mcp\Tools\CreateJobTool;
use App\Mcp\Tools\CreateLanguageTool;
use App\Mcp\Tools\CreatePostTool;
use App\Mcp\Tools\CreateProgramTool;
use App\Mcp\Tools\CreateUserTool;
use App\Mcp\Tools\DashboardStatsTool;
use App\Mcp\Tools\DeleteEventTool;
use App\Mcp\Tools\DeleteUserTool;
use App\Mcp\Tools\GetSiteSettingsTool;
use App\Mcp\Tools\GetHomePageLayoutTool;
use App\Mcp\Tools\GetWhatsAppSettingsTool;
use App\Mcp\Tools\ListArticlesTool;
use App\Mcp\Tools\ListAwardsTool;
use App\Mcp\Tools\ListBookCategoriesTool;
use App\Mcp\Tools\ListBooksTool;
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
use App\Mcp\Tools\ReplyEnrollmentTool;
use App\Mcp\Tools\ShowArticleTool;
use App\Mcp\Tools\ShowEmailCampaignTool;
use App\Mcp\Tools\ShowEnrollmentTool;
use App\Mcp\Tools\ShowJobApplicationTool;
use App\Mcp\Tools\ShowMessageTool;
use App\Mcp\Tools\ShowPostTool;
use App\Mcp\Tools\ShowWhatsAppCampaignTool;
use App\Mcp\Tools\UpdateArticleTool;
use App\Mcp\Tools\UpdateHomePageLayoutTool;
use App\Mcp\Tools\UpdateContactTool;
use App\Mcp\Tools\UpdateEnrollmentStatusTool;
use App\Mcp\Tools\UpdateEventTool;
use App\Mcp\Tools\UpdateJobApplicationStatusTool;
use App\Mcp\Tools\UpdateSiteSettingsTool;
use App\Mcp\Tools\UpdateUserTool;
use Laravel\Mcp\Server;
use Laravel\Mcp\Server\Attributes\Instructions;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Attributes\Version;

#[Name('Mustaqbal School Dashboard')]
#[Version('1.0.0')]
#[Instructions('Operate the school admin dashboard over MCP. Every tool delegates to the existing dashboard controllers, so the caller permissions are exactly those of the authenticated Sanctum user: reads list/inspect records, writes create/update them, and destructive tools delete them, all gated by the same role, verified and active middleware and policies as the web dashboard. Prefer the read tools to discover record ids before calling a write tool, and pass the same payload fields the web forms expect.')]
class SchoolDashboardServer extends Server
{
    /**
     * The tools registered with this MCP server. Each one forwards to a real
     * dashboard controller action through App\Mcp\Support\DashboardDispatcher,
     * so no business logic is duplicated.
     *
     * @var array<int, class-string<\Laravel\Mcp\Server\Tool>>
     */
    protected array $tools = [
        DashboardStatsTool::class,
        GetHomePageLayoutTool::class,
        UpdateHomePageLayoutTool::class,
        ListArticlesTool::class,
        ShowArticleTool::class,
        CreateArticleTool::class,
        UpdateArticleTool::class,
        ListPostsTool::class,
        ShowPostTool::class,
        CreatePostTool::class,
        ListEventsTool::class,
        CreateEventTool::class,
        UpdateEventTool::class,
        DeleteEventTool::class,
        ListEnrollmentsTool::class,
        ShowEnrollmentTool::class,
        UpdateEnrollmentStatusTool::class,
        ReplyEnrollmentTool::class,
        ListUsersTool::class,
        CreateUserTool::class,
        UpdateUserTool::class,
        DeleteUserTool::class,
        ListProgramsTool::class,
        CreateProgramTool::class,
        ListJobsTool::class,
        CreateJobTool::class,
        ListJobApplicationsTool::class,
        ShowJobApplicationTool::class,
        UpdateJobApplicationStatusTool::class,
        ListBooksTool::class,
        CreateBookTool::class,
        ListBookCategoriesTool::class,
        ListContactsTool::class,
        UpdateContactTool::class,
        ListMessagesTool::class,
        ShowMessageTool::class,
        AnswerMessageTool::class,
        ListAwardsTool::class,
        CreateAwardTool::class,
        ListLanguagesTool::class,
        CreateLanguageTool::class,
        GetSiteSettingsTool::class,
        UpdateSiteSettingsTool::class,
        ListEmailCampaignsTool::class,
        ShowEmailCampaignTool::class,
        CreateEmailCampaignTool::class,
        ListWhatsAppCampaignsTool::class,
        ShowWhatsAppCampaignTool::class,
        GetWhatsAppSettingsTool::class,
        ListMailsTool::class,
    ];
}

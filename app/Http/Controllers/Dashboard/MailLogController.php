<?php

namespace App\Http\Controllers\Dashboard;

use App\Enums\EmailDeliveryStatus;
use App\Http\Controllers\Controller;
use App\Models\MailLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Unified outbound mail inbox.
 *
 * Lists every email the app has sent — bulk campaigns, transactional replies and
 * system mail alike — captured by the mail-event listeners. Read-only: retrying
 * bulk failures stays on the campaign page. Restricted to management and admin
 * (see the `role:management` route middleware; admins pass every role gate).
 */
class MailLogController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->query('status');
        $search = $request->query('q');

        // Guard against an arbitrary string so the query stays within known states.
        $status = EmailDeliveryStatus::tryFrom((string) $status)?->value;

        $logs = MailLog::query()
            ->status($status)
            ->search($search)
            ->latest('id')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('dashboard/mails/dashboard-mails-index', [
            'logs' => $logs,
            'filters' => [
                'status' => $status,
                'q' => is_string($search) ? $search : '',
            ],
            // Tab counts reflect the whole log (not the active search) so the
            // numbers stay stable while filtering.
            'counts' => [
                'all' => MailLog::query()->count(),
                'pending' => MailLog::query()->status(EmailDeliveryStatus::Pending->value)->count(),
                'sent' => MailLog::query()->status(EmailDeliveryStatus::Sent->value)->count(),
                'failed' => MailLog::query()->status(EmailDeliveryStatus::Failed->value)->count(),
            ],
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Award;
use App\Support\Awards\VerificationGuard;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AwardVerificationController extends Controller
{
    public function __construct(private readonly VerificationGuard $guard) {}

    /**
     * Render the empty lookup form. The codes are never echoed back into the
     * URL, so a result cannot be bookmarked or left in the browser history.
     */
    public function index(Request $request): Response
    {
        return $this->render($request, '', '', null, false, false);
    }

    /**
     * Perform the lookup over POST so neither code appears in the query string,
     * server access logs, or the referrer sent to third parties.
     *
     * The page never lists awards, so a single guess cannot reveal another
     * holder's record — the pair must match exactly. Repeated misses raise the
     * cost of guessing: after a few failures a human-check challenge is added,
     * and continued guessing for one person ID pauses that code entirely.
     */
    public function lookup(Request $request): Response
    {
        $validated = $request->validate([
            'person_id' => ['required', 'string', 'max:64'],
            'award_id' => ['required', 'string', 'max:64'],
            'captcha_answer' => ['nullable', 'string', 'max:10'],
        ]);

        $personId = trim((string) $validated['person_id']);
        $awardId = trim((string) $validated['award_id']);

        if ($this->guard->personBlocked($personId)) {
            return $this->render($request, $personId, $awardId, null, false, true);
        }

        $captchaError = false;
        $award = null;

        $challengeFailed = $this->guard->captchaRequired($request)
            && ! $this->guard->verifyChallenge($request, $validated['captcha_answer'] ?? null);

        if ($challengeFailed) {
            // The challenge consumed this attempt, so a wrong answer must never
            // fall through to an actual lookup.
            $captchaError = true;
            $this->guard->recordFailure($request, $personId);
        } else {
            $award = Award::query()->forPair($personId, $awardId)->first();

            if ($award !== null) {
                $this->guard->clearFailures($request, $personId);
            } else {
                $this->guard->recordFailure($request, $personId);
            }
        }

        return $this->render($request, $personId, $awardId, $award, $captchaError, false);
    }

    private function render(
        Request $request,
        string $personId,
        string $awardId,
        ?Award $award,
        bool $captchaError,
        bool $blocked,
    ): Response {
        // A fresh question is issued on every render while the visitor is still
        // over the failure threshold; the expected answer stays in the session.
        $captcha = ! $blocked && $this->guard->captchaRequired($request)
            ? $this->guard->issueChallenge($request)
            : null;

        return Inertia::render('school/verify/school-verify', [
            'query' => ['person_id' => $personId, 'award_id' => $awardId],
            'submitted' => $personId !== '' && $awardId !== '',
            'award' => $award?->toVerificationPayload(),
            'captcha' => $captcha,
            'captchaError' => $captchaError,
            'blocked' => $blocked,
            'retryAfterMinutes' => $blocked
                ? max(1, (int) ceil($this->guard->retryAfter($personId) / 60))
                : null,
        ]);
    }
}

<?php

namespace App\Support\Awards;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

/**
 * Failed-attempt bookkeeping for the public award lookup.
 *
 * Two independent counters guard the page:
 *
 * - per IP: decides when the human-check challenge becomes required. The
 *   challenge itself is friction, not cryptography — these cache counters are
 *   the real defence, and they survive a visitor clearing cookies.
 * - per person code: stops someone from spreading guesses across many IPs to
 *   keep probing a single holder's record.
 *
 * Codes are hashed before they become cache keys so the cache never stores
 * personal identifiers in plain text.
 */
class VerificationGuard
{
    /** Failed lookups (per IP) before the challenge is required. */
    public const CAPTCHA_AFTER_FAILURES = 3;

    /** Failed lookups (per person code) before verification is paused. */
    public const BLOCK_AFTER_FAILURES = 10;

    /** Sliding window for both counters. */
    public const WINDOW_SECONDS = 900;

    public const SESSION_KEY = 'award_verification_captcha';

    /**
     * The page limiter (routes/customer-web.php) already caps raw request rate;
     * this counter answers "has this visitor been guessing?".
     */
    public function captchaRequired(Request $request): bool
    {
        return RateLimiter::attempts($this->ipKey($request)) >= self::CAPTCHA_AFTER_FAILURES;
    }

    public function personBlocked(string $personId): bool
    {
        if ($personId === '') {
            return false;
        }

        return RateLimiter::tooManyAttempts($this->personKey($personId), self::BLOCK_AFTER_FAILURES);
    }

    public function retryAfter(string $personId): int
    {
        if ($personId === '') {
            return 0;
        }

        return RateLimiter::availableIn($this->personKey($personId));
    }

    public function recordFailure(Request $request, string $personId): void
    {
        RateLimiter::hit($this->ipKey($request), self::WINDOW_SECONDS);

        if ($personId !== '') {
            RateLimiter::hit($this->personKey($personId), self::WINDOW_SECONDS);
        }
    }

    /**
     * A successful lookup resets both counters, so a holder who verifies their
     * own certificate is never left half-blocked.
     */
    public function clearFailures(Request $request, string $personId): void
    {
        RateLimiter::clear($this->ipKey($request));

        if ($personId !== '') {
            RateLimiter::clear($this->personKey($personId));
        }
    }

    /**
     * Issue a fresh challenge for the current render. The expected answer lives
     * in the session only; the page receives the question text.
     *
     * @return array{question: string}
     */
    public function issueChallenge(Request $request): array
    {
        $left = random_int(2, 9);
        $right = random_int(2, 12);

        $request->session()->put(self::SESSION_KEY, $left + $right);

        return ['question' => "{$left} + {$right}"];
    }

    /**
     * Compare the submitted answer with the issued challenge. The challenge is
     * single-use: it is pulled from the session before comparing.
     */
    public function verifyChallenge(Request $request, ?string $answer): bool
    {
        $expected = $request->session()->pull(self::SESSION_KEY);

        if ($expected === null || $answer === null) {
            return false;
        }

        $answer = trim($answer);

        if (preg_match('/^\d{1,4}$/', $answer) !== 1) {
            return false;
        }

        return (int) $answer === (int) $expected;
    }

    private function ipKey(Request $request): string
    {
        return 'award-verify-ip:'.sha1((string) $request->ip());
    }

    private function personKey(string $personId): string
    {
        return 'award-verify-person:'.sha1(mb_strtolower(trim($personId)));
    }
}

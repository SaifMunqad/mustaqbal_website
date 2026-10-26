<?php

namespace App\Support\Mail;

/**
 * In-memory bridge between the MessageSending and MessageSent listeners.
 *
 * Both events receive the same Symfony message object instance within one send,
 * so we key the freshly created mail-log id by that object's identity. This lets
 * MessageSent mark the exact row without stamping an internal id onto the real
 * email (which would leak it to the recipient). Bound as a singleton.
 */
class MailLogRegistry
{
    /** @var array<int, int> spl_object_id => mail_logs.id */
    private array $map = [];

    public function put(object $message, int $id): void
    {
        $this->map[spl_object_id($message)] = $id;
    }

    public function take(object $message): ?int
    {
        $key = spl_object_id($message);
        $id = $this->map[$key] ?? null;
        unset($this->map[$key]);

        return $id;
    }
}

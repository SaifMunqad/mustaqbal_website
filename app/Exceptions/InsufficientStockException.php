<?php

namespace App\Exceptions;

use Exception;

class InsufficientStockException extends Exception
{
    /**
     * @var list<string>
     */
    public array $titles;

    /**
     * @param  list<string>  $titles
     */
    public function __construct(array $titles)
    {
        $this->titles = $titles;

        parent::__construct('One or more items are no longer available in the requested quantity.');
    }

    public static function forBook(string $title): self
    {
        return new self([$title]);
    }
}

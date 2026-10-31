<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('UploadBookPdf')]
#[Description('Transfer a book PDF from a URL or base64 content through the dashboard PDF endpoint, which stores the file and renders its first-page thumbnail. Returns path/url (and thumbnail) to submit when creating or updating the book.')]
class UploadBookPdfTool extends FileTransferTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\UploadController::class;

    protected string $action = 'pdf';

    protected string $verb = 'POST';

    protected string $field = 'file';
}

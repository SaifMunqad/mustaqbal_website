<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('UploadMedia')]
#[Description('Upload an image (or favicon .ico) from a URL or base64 content into the public media store, exactly like the dashboard image uploader. Returns the app-relative /storage URL and path to reference in posts, books, site settings or builder sections.')]
class UploadMediaTool extends FileTransferTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\UploadController::class;

    protected string $action = 'store';

    protected string $verb = 'POST';

    protected string $field = 'image';
}

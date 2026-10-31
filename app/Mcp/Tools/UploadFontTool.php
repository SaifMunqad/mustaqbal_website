<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Mcp\Support\MediaTransfer;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('UploadFont')]
#[Description('Upload a font family through the dashboard typography uploader. Pass name plus "files": an object keyed by weight (400, 500, 600, 700), each value {url} or {base64, filename} with a ttf/otf/woff/woff2 file. At least the 400 weight is required; the existing mime and size rules apply.')]
class UploadFontTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardFontController::class;

    protected string $action = 'store';

    protected string $verb = 'POST';

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'name' => $schema->string()->description('Font family name, e.g. "Scheherazade New".')->required(),
            'files' => $schema->object()->description('Weight => transfer object: {"400": {"url": "https://…/regular.woff2"}, "700": {"base64": "…", "filename": "bold.ttf"}}.')->required(),
        ];
    }

    public function handle(Request $request): Response|ResponseFactory
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'files' => ['required', 'array'],
            'files.*' => ['array'],
        ]);

        $files = [];

        foreach ($validated['files'] as $weight => $transfer) {
            if (! in_array((int) $weight, \App\Http\Controllers\Dashboard\DashboardFontController::WEIGHTS, true)) {
                return Response::error("Unsupported font weight [{$weight}]. Use one of: ".implode(', ', \App\Http\Controllers\Dashboard\DashboardFontController::WEIGHTS).'.');
            }

            $file = MediaTransfer::resolve($transfer);

            if ($file instanceof Response) {
                return $file;
            }

            $files[(int) $weight] = $file;
        }

        $request->setArguments(['name' => $validated['name']]);

        return $this->dispatcher->run($request, $this->controller, $this->action, $this->verb, [], ['files' => $files]);
    }
}

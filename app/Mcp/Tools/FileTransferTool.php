<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Mcp\Support\MediaTransfer;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;

/**
 * Base for tools that forward a transferred file (url or base64) into an
 * existing dashboard upload endpoint as if it arrived through a multipart
 * form. Subclasses only declare the controller action and the form field.
 */
abstract class FileTransferTool extends DashboardTool
{
    /** The FormRequest field the uploaded file is validated under. */
    protected string $field;

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'url' => $schema->string()->description('Public http(s) URL of the file to transfer. Provide this or base64.'),
            'base64' => $schema->string()->description('Base64-encoded file content (data-URI prefix allowed). Provide this or url.'),
            'filename' => $schema->string()->description('Stored name including extension (e.g. hero.jpg). Required with base64; defaults to the URL basename.')->required(),
        ];
    }

    public function handle(Request $request): Response|ResponseFactory
    {
        $file = MediaTransfer::resolve($request->all());

        if ($file instanceof Response) {
            return $file;
        }

        return $this->dispatcher->run($request, $this->controller, $this->action, $this->verb, [], [$this->field => $file]);
    }
}

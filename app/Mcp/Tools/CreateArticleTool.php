<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Models\Language;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('CreateArticle')]
#[Description('Create an article. Body is sanitized like the web editor; media fields take /storage URLs from UploadMedia.')]
class CreateArticleTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardArticleController::class;

    protected string $action = 'store';

    protected string $verb = 'POST';

    /** @var array<int, string> */
    protected array $models = [];

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'title' => $schema->string()->description('Article title.')->required(),
            'body' => $schema->string()->description('Article body (HTML is sanitized).'),
            'content' => $schema->string()->description('Article body or content (alias for body).'),
            'excerpt' => $schema->string()->description('Short summary for listings.'),
            'writer_name' => $schema->string()->description('Byline shown instead of the account name.'),
            'language' => $schema->string()->description('Language code the article is written in (default: system default language).'),
            'cover_image' => $schema->string()->description('Cover image URL from UploadMedia.'),
            'images' => $schema->array()->items($schema->string())->description('Gallery image URLs.'),
            'is_published' => $schema->boolean()->description('Publish immediately (default: true).'),
        ];
    }

    public function handle(Request $request): Response|ResponseFactory
    {
        $args = $this->normalizePayload($request->all());

        return $this->dispatcher->run(new Request($args), $this->controller, $this->action, $this->verb, $this->models);
    }

    /**
     * @param  array<string, mixed>  $args
     * @return array<string, mixed>
     */
    protected function normalizePayload(array $args): array
    {
        $body = $args['body'] ?? $args['content'] ?? $args['description'] ?? null;
        if (! empty($body)) {
            $args['body'] = (string) $body;
        }

        if (! array_key_exists('is_published', $args)) {
            $args['is_published'] = true;
        }

        if (empty($args['language'])) {
            $args['language'] = Language::defaultCode();
        }

        return $args;
    }
}

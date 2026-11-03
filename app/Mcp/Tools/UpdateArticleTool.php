<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Models\Article;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('UpdateArticle')]
#[Description('Update an existing article. Provide the article id plus the fields to change.')]
class UpdateArticleTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardArticleController::class;

    protected string $action = 'update';

    protected string $verb = 'PUT';

    /** @var array<int, string> */
    protected array $models = ['article'];

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'article' => $schema->integer()->description('The article id.')->required(),
            'title' => $schema->string()->description('Article title.'),
            'body' => $schema->string()->description('Article body (HTML is sanitized).'),
            'content' => $schema->string()->description('Article body or content (alias for body).'),
            'excerpt' => $schema->string()->description('Short summary for listings.'),
            'writer_name' => $schema->string()->description('Byline shown instead of the account name.'),
            'language' => $schema->string()->description('Language code the article is written in.'),
            'cover_image' => $schema->string()->description('Cover image URL from UploadMedia.'),
            'images' => $schema->array()->items($schema->string())->description('Gallery image URLs.'),
            'is_published' => $schema->boolean()->description('Publish status.'),
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
        $articleId = $args['article'] ?? null;
        $existing = is_numeric($articleId) ? Article::find((int) $articleId) : null;

        $body = $args['body'] ?? $args['content'] ?? null;
        if (! empty($body)) {
            $args['body'] = (string) $body;
        }

        if ($existing) {
            if (! isset($args['title'])) {
                $args['title'] = $existing->title;
            }
            if (! isset($args['body'])) {
                $args['body'] = $existing->body;
            }
            if (! array_key_exists('is_published', $args)) {
                $args['is_published'] = (bool) $existing->is_published;
            }
            if (! array_key_exists('language', $args)) {
                $args['language'] = $existing->language;
            }
            if (! array_key_exists('writer_name', $args)) {
                $args['writer_name'] = $existing->writer_name;
            }
            if (! array_key_exists('excerpt', $args)) {
                $args['excerpt'] = $existing->excerpt;
            }
            if (! array_key_exists('cover_image', $args)) {
                $args['cover_image'] = $existing->cover_image;
            }
            if (! array_key_exists('images', $args) && is_array($existing->images)) {
                $args['images'] = $existing->images;
            }
        }

        return $args;
    }
}

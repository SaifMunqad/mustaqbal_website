<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

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
            'body' => $schema->string()->description('Article body (HTML is sanitized).')->required(),
            'excerpt' => $schema->string()->description('Short summary for listings.'),
            'writer_name' => $schema->string()->description('Byline shown instead of the account name.'),
            'language' => $schema->string()->description('Language code the article is written in.'),
            'cover_image' => $schema->string()->description('Cover image URL from UploadMedia.'),
            'images' => $schema->array()->items($schema->string())->description('Gallery image URLs.'),
            'is_published' => $schema->boolean()->description('Publish immediately.'),
        ];
    }
}

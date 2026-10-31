<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Enums\PostType;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('CreatePost')]
#[Description('Create a community/news post. Text lives in "translations" per active language code (title/content rules follow the web form); media fields take /storage URLs from UploadMedia.')]
class CreatePostTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardPostController::class;

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
            'user_id' => $schema->integer()->description('Author user id (ListUsers).')->required(),
            'type' => $schema->string()->enum(PostType::values())->description('Post kind.')->required(),
            'visibility' => $schema->string()->enum(['public', 'community'])->description('Who may see the post.')->required(),
            'images' => $schema->array()->items($schema->string())->description('Image URLs from UploadMedia.'),
            'highlighted_student_id' => $schema->integer()->description('Student highlighted by achievement-style posts.'),
            'scheduled_at' => $schema->string()->description('Publish at a future date/time.'),
            'starts_at' => $schema->string()->description('Window start for time-bound posts.'),
            'ends_at' => $schema->string()->description('Window end; must not precede starts_at.'),
            'job_apply_url' => $schema->string()->description('Application link for type=job posts.'),
            'featured' => $schema->boolean()->description('Feature on the home surface.'),
            'featured_from' => $schema->string()->description('Feature window start.'),
            'featured_until' => $schema->string()->description('Feature window end; must not precede featured_from.'),
            'translations' => $schema->object()->description('Language code => {title, content}.'),
        ];
    }
}

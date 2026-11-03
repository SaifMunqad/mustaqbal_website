<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Enums\PostType;
use App\Models\Language;
use App\Models\User;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('CreatePost')]
#[Description('Create a community/news post. You can pass title, content/body, type, and visibility directly, or provide localized text in "translations". Media fields take /storage URLs from UploadMedia.')]
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
            'title' => $schema->string()->description('Post title (e.g. "School Science Fair Winners").'),
            'content' => $schema->string()->description('Post content or body text.'),
            'body' => $schema->string()->description('Alias for content.'),
            'user_id' => $schema->integer()->description('Author user id (defaults to authenticated user).'),
            'type' => $schema->string()->enum(PostType::values())->description('Post kind: news, job, event, achievement, student_of_week, student_of_month, teacher_of_month, employee_of_month (default: news).'),
            'visibility' => $schema->string()->enum(['public', 'community'])->description('Who may see the post: public or community (default: public).'),
            'images' => $schema->array()->items($schema->string())->description('Image URLs from UploadMedia.'),
            'highlighted_student_id' => $schema->integer()->description('Student highlighted by achievement-style posts.'),
            'scheduled_at' => $schema->string()->description('Publish at a future date/time.'),
            'starts_at' => $schema->string()->description('Window start for time-bound posts.'),
            'ends_at' => $schema->string()->description('Window end; must not precede starts_at.'),
            'job_apply_url' => $schema->string()->description('Application link for type=job posts.'),
            'featured' => $schema->boolean()->description('Feature on the home surface (default: false).'),
            'featured_from' => $schema->string()->description('Feature window start.'),
            'featured_until' => $schema->string()->description('Feature window end; must not precede featured_from.'),
            'translations' => $schema->object()->description('Optional language-specific translations: code => {title, content}.'),
        ];
    }

    public function handle(Request $request): Response|ResponseFactory
    {
        $args = $this->normalizePayload($request->all(), $request->user());

        return $this->dispatcher->run(new Request($args), $this->controller, $this->action, $this->verb, $this->models);
    }

    /**
     * @param  array<string, mixed>  $args
     * @return array<string, mixed>
     */
    protected function normalizePayload(array $args, ?object $user = null): array
    {
        if (empty($args['user_id'])) {
            $userId = (is_object($user) && isset($user->id)) ? $user->id : (auth()->id() ?? User::query()->value('id'));
            if ($userId) {
                $args['user_id'] = $userId;
            }
        }

        // Default type to 'news' if omitted or normalize alias
        $typeInput = strtolower((string) ($args['type'] ?? ''));
        $postType = PostType::tryFrom($typeInput);
        if ($postType === null) {
            $args['type'] = match ($typeInput) {
                'job', 'career', 'hiring' => PostType::Job->value,
                'event' => PostType::Event->value,
                'achievement', 'award' => PostType::Achievement->value,
                'student_of_week', 'student-of-week' => PostType::StudentOfWeek->value,
                'student_of_month', 'student-of-month' => PostType::StudentOfMonth->value,
                'teacher_of_month', 'teacher-of-month' => PostType::TeacherOfMonth->value,
                'employee_of_month', 'employee-of-month' => PostType::EmployeeOfMonth->value,
                default => PostType::News->value,
            };
        } else {
            $args['type'] = $postType->value;
        }

        // Default visibility to 'public' if omitted or invalid
        $visibilityInput = strtolower((string) ($args['visibility'] ?? ''));
        if (! in_array($visibilityInput, ['public', 'community'], true)) {
            $args['visibility'] = 'public';
        } else {
            $args['visibility'] = $visibilityInput;
        }

        $defaultCode = Language::defaultCode();
        $translations = is_array($args['translations'] ?? null) ? $args['translations'] : [];

        // If translations exist but defaultCode is missing, borrow from the first available translation
        if (! isset($translations[$defaultCode]) && ! empty($translations)) {
            $firstLang = reset($translations);
            if (is_array($firstLang)) {
                $translations[$defaultCode] = $firstLang;
            }
        }

        if (! isset($translations[$defaultCode]) || ! is_array($translations[$defaultCode])) {
            $translations[$defaultCode] = [];
        }

        if (! empty($args['title'])) {
            $translations[$defaultCode]['title'] = (string) $args['title'];
        }

        $contentText = $args['content'] ?? $args['body'] ?? $args['description'] ?? null;
        if (! empty($contentText)) {
            $translations[$defaultCode]['content'] = (string) $contentText;
        }

        // Propagate to all active languages so single-language submissions are visible
        $activeCodes = collect(Language::activeList())->pluck('code')->all();
        foreach ($activeCodes as $code) {
            if (! isset($translations[$code]) || ! is_array($translations[$code])) {
                $translations[$code] = $translations[$defaultCode];
            } else {
                if (empty($translations[$code]['title']) && ! empty($translations[$defaultCode]['title'])) {
                    $translations[$code]['title'] = $translations[$defaultCode]['title'];
                }
                if (empty($translations[$code]['content']) && ! empty($translations[$defaultCode]['content'])) {
                    $translations[$code]['content'] = $translations[$defaultCode]['content'];
                }
            }
        }

        if (! empty($translations[$defaultCode])) {
            $args['translations'] = $translations;
        }

        return $args;
    }
}

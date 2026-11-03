<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Enums\PostType;
use App\Models\Language;
use App\Models\Post;
use App\Models\User;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('UpdatePost')]
#[Description('Update an existing post. Provide the post id plus any fields to change (title, content, type, visibility, featured, images).')]
class UpdatePostTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardPostController::class;

    protected string $action = 'update';

    protected string $verb = 'PUT';

    /** @var array<int, string> */
    protected array $models = ['post'];

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'post' => $schema->integer()->description('The post id.')->required(),
            'title' => $schema->string()->description('Post title.'),
            'content' => $schema->string()->description('Post content or body text.'),
            'body' => $schema->string()->description('Alias for content.'),
            'user_id' => $schema->integer()->description('Author user id.'),
            'type' => $schema->string()->enum(PostType::values())->description('Post kind: news, job, event, achievement, student_of_week, student_of_month, teacher_of_month, employee_of_month.'),
            'visibility' => $schema->string()->enum(['public', 'community'])->description('Who may see the post: public or community.'),
            'images' => $schema->array()->items($schema->string())->description('Image URLs from UploadMedia.'),
            'highlighted_student_id' => $schema->integer()->description('Student highlighted by achievement-style posts.'),
            'scheduled_at' => $schema->string()->description('Publish at a future date/time.'),
            'starts_at' => $schema->string()->description('Window start for time-bound posts.'),
            'ends_at' => $schema->string()->description('Window end; must not precede starts_at.'),
            'job_apply_url' => $schema->string()->description('Application link for type=job posts.'),
            'featured' => $schema->boolean()->description('Feature on the home surface.'),
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
        $postId = $args['post'] ?? null;
        $existing = is_numeric($postId) ? Post::with('translations.language')->find((int) $postId) : null;

        if ($existing) {
            if (empty($args['user_id'])) {
                $args['user_id'] = $existing->user_id;
            }
            if (empty($args['type'])) {
                $args['type'] = $existing->type?->value ?? PostType::News->value;
            }
            if (empty($args['visibility'])) {
                $args['visibility'] = $existing->visibility?->value ?? 'public';
            }
            if (! array_key_exists('featured', $args)) {
                $args['featured'] = (bool) $existing->featured;
            }
            if (! array_key_exists('images', $args) && is_array($existing->images)) {
                $args['images'] = $existing->images;
            }
            if (! array_key_exists('highlighted_student_id', $args)) {
                $args['highlighted_student_id'] = $existing->highlighted_student_id;
            }
            if (! array_key_exists('scheduled_at', $args) && $existing->scheduled_at) {
                $args['scheduled_at'] = $existing->scheduled_at->format('Y-m-d H:i:s');
            }
            if (! array_key_exists('starts_at', $args) && $existing->starts_at) {
                $args['starts_at'] = $existing->starts_at->format('Y-m-d H:i:s');
            }
            if (! array_key_exists('ends_at', $args) && $existing->ends_at) {
                $args['ends_at'] = $existing->ends_at->format('Y-m-d H:i:s');
            }
            if (! array_key_exists('job_apply_url', $args)) {
                $args['job_apply_url'] = $existing->job_apply_url;
            }
        }

        if (empty($args['user_id'])) {
            $userId = (is_object($user) && isset($user->id)) ? $user->id : (auth()->id() ?? User::query()->value('id'));
            if ($userId) {
                $args['user_id'] = $userId;
            }
        }

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

        $visibilityInput = strtolower((string) ($args['visibility'] ?? ''));
        if (! in_array($visibilityInput, ['public', 'community'], true)) {
            $args['visibility'] = 'public';
        } else {
            $args['visibility'] = $visibilityInput;
        }

        $defaultCode = Language::defaultCode();
        $translations = is_array($args['translations'] ?? null) ? $args['translations'] : [];

        // Pre-seed from existing post translations if available
        if ($existing) {
            foreach ($existing->translations as $t) {
                if ($t->language && ! isset($translations[$t->language->code])) {
                    $translations[$t->language->code] = [
                        'title' => (string) $t->title,
                        'content' => (string) $t->content,
                    ];
                }
            }
        }

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

        if (! empty($translations)) {
            $args['translations'] = $translations;
        }

        return $args;
    }
}

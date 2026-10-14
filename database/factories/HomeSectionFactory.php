<?php

namespace Database\Factories;

use App\Enums\HomeSectionType;
use App\Models\HomeSection;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

/**
 * @extends Factory<HomeSection>
 */
class HomeSectionFactory extends Factory
{
    protected $model = HomeSection::class;

    /**
     * A generic, self-contained authored banner — always renders even with no
     * other content, so a factory-made section is never visually empty.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'section_type' => HomeSectionType::Banner->value,
            'config' => [
                'heading' => Str::title(trim(fake()->words(3, true))),
                'body' => fake()->sentence(12),
                'image_url' => 'https://picsum.photos/seed/home-banner-'.Str::lower(Str::random(6)).'/1400/500',
                'cta_label' => 'Learn more',
                'cta_url' => '/school/about',
                'tone' => 'blue',
            ],
            'limit' => null,
            'sort_order' => fake()->numberBetween(0, 10),
            'is_active' => true,
        ];
    }

    /**
     * The authored heading/body/cta_label are authored inside `config` by
     * convenience, but are stored as translations. Move them out on create and
     * keep only the shared settings on the parent config.
     */
    public function configure(): static
    {
        return $this->afterCreating(function (HomeSection $section): void {
            $config = $section->config ?? [];
            $localized = Arr::only($config, ['heading', 'body', 'cta_label']);

            if ($localized === []) {
                return;
            }

            $section->forceFill([
                'config' => Arr::except($config, ['heading', 'body', 'cta_label']),
            ])->save();

            $section->syncDefaultTranslation($localized);
        });
    }

    /**
     * Authored banner block.
     *
     * @param  array<string, mixed>  $config
     */
    public function banner(array $config = []): static
    {
        return $this->state(fn () => [
            'section_type' => HomeSectionType::Banner->value,
            'limit' => null,
            'config' => array_merge([
                'heading' => Str::title(trim(fake()->words(3, true))),
                'body' => fake()->sentence(12),
                'image_url' => 'https://picsum.photos/seed/home-banner-'.Str::lower(Str::random(6)).'/1400/500',
                'cta_label' => 'Learn more',
                'cta_url' => '/school/about',
                'tone' => 'blue',
            ], $config),
        ]);
    }

    /**
     * Authored announcement strip.
     *
     * @param  array<string, mixed>  $config
     */
    public function announcement(array $config = []): static
    {
        return $this->state(fn () => [
            'section_type' => HomeSectionType::Announcement->value,
            'limit' => null,
            'config' => array_merge([
                'heading' => Str::title(trim(fake()->words(3, true))),
                'body' => fake()->sentence(12),
                'tone' => 'amber',
            ], $config),
        ]);
    }

    /**
     * Curated articles section. Empty `$itemIds` means "auto: latest".
     *
     * @param  list<int>  $itemIds
     */
    public function articles(array $itemIds = [], ?int $limit = 3): static
    {
        return $this->curated(HomeSectionType::Articles, $itemIds, $limit);
    }

    /**
     * Curated events section. Empty `$itemIds` means "auto: upcoming".
     *
     * @param  list<int>  $itemIds
     */
    public function events(array $itemIds = [], ?int $limit = 3): static
    {
        return $this->curated(HomeSectionType::Events, $itemIds, $limit);
    }

    /**
     * Curated recognition-highlights section.
     *
     * @param  list<int>  $itemIds
     */
    public function recognition(array $itemIds = [], ?int $limit = 3): static
    {
        return $this->curated(HomeSectionType::Recognition, $itemIds, $limit);
    }

    /**
     * @param  list<int>  $itemIds
     */
    private function curated(HomeSectionType $type, array $itemIds, ?int $limit): static
    {
        return $this->state(fn () => [
            'section_type' => $type->value,
            'limit' => $limit,
            'config' => ['item_ids' => array_values($itemIds)],
        ]);
    }
}

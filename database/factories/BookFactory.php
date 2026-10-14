<?php

namespace Database\Factories;

use App\Models\Book;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Book>
 */
class BookFactory extends Factory
{
    protected $model = Book::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = Str::title(trim(fake()->words(random_int(2, 5), true)));
        $slug = Str::slug($title).'-'.Str::lower(Str::random(5));

        return [
            'slug' => $slug,
            'author' => fake()->name(),
            'published_year' => fake()->numberBetween(1985, 2025),
            'isbn' => '978'.fake()->numerify('##########'),
            'images' => $this->galleryImages($slug),
            'file_path' => null,
            'thumbnail_path' => null,
            'book_category_id' => null,
        ];
    }

    /**
     * Localized text lives in `book_translations`. Give every factory-created
     * book a default-language row (no-op when no default language exists).
     */
    public function configure(): static
    {
        return $this->afterCreating(function (Book $book): void {
            $book->syncDefaultTranslation([
                'title' => Str::title(trim(fake()->words(random_int(2, 5), true))),
                'publisher' => fake()->company(),
                'description' => fake()->sentences(3, true),
            ]);
        });
    }

    /**
     * A small set of portrait cover/preview images for the book's gallery.
     *
     * Keyed to the slug so the pictures are stable for a given book. The store
     * detail page renders these directly as <img> sources alongside the
     * PDF-generated thumbnail.
     *
     * @return list<string>
     */
    private function galleryImages(string $slug): array
    {
        return collect(range(1, random_int(2, 4)))
            ->map(fn (int $n): string => 'https://picsum.photos/seed/'.$slug.'-'.$n.'/800/1000')
            ->all();
    }

    /**
     * Attach the book to a category.
     */
    public function forCategory(int $categoryId): static
    {
        return $this->state(fn (array $attributes) => [
            'book_category_id' => $categoryId,
        ]);
    }
}

<?php

namespace Database\Seeders;

use App\Models\Book;
use App\Models\BookCategory;
use App\Services\PdfThumbnailService;
use App\Support\Translation\TranslationPayload;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

/**
 * Seeds the free book library: a set of genre categories and downloadable
 * books. Each book gets a real single-page PDF written to the public disk (so
 * the download route works) and a thumbnail rendered from that PDF's first
 * page by {@see PdfThumbnailService}.
 *
 * Safe to run repeatedly: categories are matched by slug and books are only
 * generated when the library is still empty, so re-running never duplicates
 * rows or orphans files.
 */
class BookLibrarySeeder extends Seeder
{
    private const DISK = 'public';

    private const PDF_DIR = 'books/pdfs';

    private const THUMB_DIR = 'books/thumbs';

    private const BOOK_COUNT = 54;

    /**
     * Genre categories with Dari (fa_AF) and Pashto (ps) labels.
     *
     * @var list<array{name: string, ps: string, fa_AF: string}>
     */
    private const GENRES = [
        ['name' => 'Educational', 'ps' => 'زده کړیز', 'fa_AF' => 'آموزشي'],
        ['name' => "Children's Stories", 'ps' => 'د ماشومانو کيسې', 'fa_AF' => 'قصه هاي اطفال'],
        ['name' => 'Science', 'ps' => 'علوم', 'fa_AF' => 'علوم'],
        ['name' => 'Mathematics', 'ps' => 'ریاضي', 'fa_AF' => 'ریاضي'],
        ['name' => 'Literature', 'ps' => 'ادب', 'fa_AF' => 'ادب'],
        ['name' => 'History', 'ps' => 'تاريخ', 'fa_AF' => 'تاريخ'],
        ['name' => 'Islamic Studies', 'ps' => 'اسلامي زده کړې', 'fa_AF' => 'مطالعات اسلامي'],
        ['name' => 'Languages', 'ps' => 'ژبې', 'fa_AF' => 'زبان ها'],
        ['name' => 'Poetry', 'ps' => 'شعر', 'fa_AF' => 'شعر'],
        ['name' => 'Technology', 'ps' => 'ټیکنالوژي', 'fa_AF' => 'تکنالوژي'],
    ];

    public function run(): void
    {
        $categories = $this->seedCategories();

        if (Book::query()->count() > 0) {
            $this->command?->info('Books already present; skipping book generation.');

            return;
        }

        $thumbnails = app(PdfThumbnailService::class);
        $categoryIds = $categories->pluck('id')->all();

        for ($i = 0; $i < self::BOOK_COUNT; $i++) {
            $book = Book::factory()->forCategory($categoryIds[$i % count($categoryIds)])->create();

            $this->attachDownloadAndThumbnail($book, $thumbnails);
        }

        $this->command?->info("Seeded ".self::BOOK_COUNT.' books across '.count($categories).' categories.');
    }

    /**
     * @return \Illuminate\Support\Collection<int, BookCategory>
     */
    private function seedCategories(): \Illuminate\Support\Collection
    {
        return collect(self::GENRES)->map(function (array $genre): BookCategory {
            $slug = \Illuminate\Support\Str::slug($genre['name']);

            $category = BookCategory::query()->updateOrCreate(
                ['slug' => $slug],
                [
                    // The parent `name` is the default-language source of truth.
                    'name' => $genre['name'],
                ],
            );

            // Localized labels live in book_category_translations.
            TranslationPayload::apply($category->translations(), [
                'ps' => ['name' => $genre['ps']],
                'fa_AF' => ['name' => $genre['fa_AF']],
            ]);

            return $category;
        });
    }

    private function attachDownloadAndThumbnail(Book $book, PdfThumbnailService $thumbnails): void
    {
        $slug = $book->slug;

        $pdfPath = self::PDF_DIR.'/'.$slug.'.pdf';
        Storage::disk(self::DISK)->put($pdfPath, $this->buildPdf([
            $book->title,
            '',
            'Author: '.($book->author ?? 'Unknown'),
            'Publisher: '.($book->publisher ?? '-'),
            'Year: '.($book->published_year ?? '-'),
            'ISBN: '.($book->isbn ?? '-'),
            '',
            strip_tags((string) $book->description),
        ]));

        $thumbnailPath = $thumbnails->generate($pdfPath, self::THUMB_DIR.'/'.$slug.'.png');

        $book->forceFill([
            'file_path' => $pdfPath,
            'thumbnail_path' => $thumbnailPath,
        ])->save();
    }

    /**
     * Build a minimal, valid single-page PDF containing the given text lines.
     * Produces a real file so the book download works and pdftoppm can render
     * the cover thumbnail.
     *
     * @param  list<string>  $lines
     */
    private function buildPdf(array $lines): string
    {
        // Lay the text out from the top of an A4-ish page, wrapping long lines.
        $content = '';
        $y = 760;

        foreach ($lines as $index => $line) {
            $size = $index === 0 ? 22 : 12;
            $wrapped = wordwrap($this->sanitize($line), 78, "\n", true);

            foreach (explode("\n", $wrapped) as $part) {
                $escaped = str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $part);
                $content .= sprintf("BT /F1 %d Tf 72 %d Td (%s) Tj ET\n", $size, $y, $escaped);
                $y -= ($index === 0 ? 28 : 18);
            }
        }

        $objects = [
            "<< /Type /Catalog /Pages 2 0 R >>",
            "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
            "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
            "<< /Length ".strlen($content)." >>\nstream\n".$content."endstream",
            "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        ];

        $pdf = "%PDF-1.4\n";
        $offsets = [];

        foreach ($objects as $number => $body) {
            $offsets[$number + 1] = strlen($pdf);
            $pdf .= ($number + 1)." 0 obj\n".$body."\nendobj\n";
        }

        $xrefPosition = strlen($pdf);
        $size = count($objects) + 1;

        $pdf .= "xref\n0 {$size}\n";
        $pdf .= "0000000000 65535 f \n";

        for ($number = 1; $number < $size; $number++) {
            $pdf .= sprintf("%010d 00000 n \n", $offsets[$number]);
        }

        $pdf .= "trailer\n<< /Size {$size} /Root 1 0 R >>\nstartxref\n{$xrefPosition}\n%%EOF\n";

        return $pdf;
    }

    /**
     * Keep text within the WinAnsi/Helvetica range so the PDF stays valid.
     *
     * Accepts null because translatable attributes (e.g. `$book->title`) resolve
     * to null for a locale with no translation row; treat those as empty so a
     * seed run never aborts mid-PDF.
     */
    private function sanitize(?string $value): string
    {
        $value = preg_replace('/\s+/', ' ', (string) $value) ?? '';

        return preg_replace('/[^\x20-\x7E]/', '', $value) ?? '';
    }
}

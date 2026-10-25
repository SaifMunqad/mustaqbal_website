<?php

namespace Database\Seeders;

use App\Enums\SectionType;
use App\Models\Language;
use App\Models\Page;
use App\Models\PageSection;
use App\Support\Home\PageLayoutWriter;
use App\Support\Translation\LocalizedContent;
use Illuminate\Database\Seeder;

/**
 * Seeds the public About page directly into the unified page builder.
 *
 * The block list mirrors the page's composition one-to-one: hero, the rich-text
 * story, mission and vision, the stats band, value cards, facility highlights,
 * the leadership message, the goals/main-point rails and the FAQ. Text authored
 * here is editable in the builder from the first seed — nothing is pre-rendered
 * or hard-coded in the public view.
 *
 * Localized copy is written per language for the blocks the glossary covers
 * (hero title, story body); the structured rails are authored once under the
 * default language, exactly as an admin would start a new page.
 *
 * Idempotent: it no-ops once the About page owns builder sections.
 */
class AboutPageBuilderSeeder extends Seeder
{
    private const PAGE_KEY = 'about';

    private const HERO_IMAGE = 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1600&q=80';

    public function run(): void
    {
        $page = Page::resolve(self::PAGE_KEY, 'About page');

        if (PageSection::query()->where('page_id', $page->id)->exists()) {
            $this->command?->info('About page layout already exists, skipping AboutPageBuilderSeeder.');

            return;
        }

        PageLayoutWriter::save(self::PAGE_KEY, $this->layout());

        $this->command?->info('Seeded the about page layout in the page builder.');
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function layout(): array
    {
        $content = $this->content();
        $default = Language::defaultCode();
        $titles = LocalizedContent::sitePageTitles()['About My School'] ?? [];
        $bodies = LocalizedContent::aboutPageBody();

        return [
            [
                'section_type' => SectionType::Hero->value,
                'is_active' => true,
                'image_path' => self::HERO_IMAGE,
                'cta_url' => '/school/enroll',
                'config' => ['cta_secondary_url' => '/school/contact'],
                'translations' => $this->localized(
                    $default,
                    $titles,
                    ['heading' => 'About My School', 'body' => $content['intro']],
                    static fn (string $title): array => ['heading' => $title],
                ),
            ],
            [
                'section_type' => SectionType::RichText->value,
                'is_active' => true,
                'translations' => $this->localized(
                    $default,
                    $bodies,
                    ['body' => $content['body']],
                    static fn (string $body): array => ['body' => $body],
                ),
            ],
            $this->textBlock($default, 'Mission', $content['mission']),
            $this->textBlock($default, 'Vision', $content['vision']),
            [
                'section_type' => SectionType::Stats->value,
                'is_active' => true,
                'lists' => [
                    'stats' => [
                        $default => array_map(
                            static fn (array $stat): array => ['value' => $stat['value'], 'title' => $stat['label']],
                            $content['stats'],
                        ),
                    ],
                ],
            ],
            [
                'section_type' => SectionType::IconCards->value,
                'is_active' => true,
                'lists' => [
                    'features' => [
                        $default => array_map(
                            static fn (array $value): array => [
                                'icon' => $value['icon'],
                                'title' => $value['title'],
                                'description' => $value['text'],
                            ],
                            $content['values'],
                        ),
                    ],
                ],
            ],
            $this->listBlock($default, SectionType::Testimonials, 'testimonials', array_map(
                static fn (array $highlight): array => [
                    'title' => $highlight['title'],
                    'description' => $highlight['text'],
                ],
                $content['highlights'],
            )),
            [
                'section_type' => SectionType::Team->value,
                'is_active' => true,
                'lists' => [
                    'team' => [
                        $default => [[
                            'title' => $content['message']['author_name'],
                            'value' => $content['message']['author_role'],
                            'description' => $content['message']['text'],
                            'image_path' => $content['message']['author_image'],
                        ]],
                    ],
                ],
            ],
            $this->plainListBlock($default, $content['goals'], 'Goals'),
            $this->plainListBlock($default, $content['main_points'], 'Main points'),
            [
                'section_type' => SectionType::Faqs->value,
                'is_active' => true,
                'lists' => [
                    'faqs' => [
                        $default => array_map(
                            static fn (array $faq): array => [
                                'title' => $faq['question'],
                                'description' => $faq['answer'],
                            ],
                            $content['faq'],
                        ),
                    ],
                ],
            ],
        ];
    }

    /**
     * Mission / vision as an authored rich-text block with a localized heading.
     *
     * @return array<string, mixed>
     */
    private function textBlock(string $default, string $heading, string $body): array
    {
        return [
            'section_type' => SectionType::RichText->value,
            'is_active' => true,
            'translations' => [
                $default => [
                    'heading' => $heading,
                    'body' => '<p>'.$body.'</p>',
                ],
            ],
        ];
    }

    /**
     * A list-driven rail whose rows belong to the default language.
     *
     * @param  list<array<string, string>>  $rows
     * @return array<string, mixed>
     */
    private function listBlock(string $default, SectionType $type, string $group, array $rows): array
    {
        return [
            'section_type' => $type->value,
            'is_active' => true,
            'lists' => [$group => [$default => $rows]],
        ];
    }

    /**
     * Goals / main points: plain bullet rails, kept addressable through config so
     * the editor knows which list they came from.
     *
     * @param  list<string>  $items
     * @return array<string, mixed>
     */
    private function plainListBlock(string $default, array $items, string $label): array
    {
        return [
            'section_type' => SectionType::Testimonials->value,
            'is_active' => true,
            'config' => ['source' => strtolower(str_replace(' ', '_', $label)), 'label' => $label],
            'lists' => [
                'testimonials' => [
                    $default => array_map(
                        static fn (string $item): array => ['title' => $item],
                        $items,
                    ),
                ],
            ],
        ];
    }

    /**
     * Build a per-language translation map: the default language starts from the
     * English source rows, and every language the glossary covers overlays just
     * the fields it has — so an untranslated subtitle keeps its English text
     * instead of rendering blank.
     *
     * @param  array<string, mixed>  $english
     * @param  array<string, mixed>  $glossary  language code => localized text
     * @param  callable(mixed): array<string, string|null>  $map
     * @return array<string, array<string, string>>
     */
    private function localized(string $default, array $glossary, array $english, callable $map): array
    {
        $translations = [$default => array_filter($english, static fn ($value): bool => filled($value))];

        foreach ($glossary as $code => $value) {
            $row = array_filter($map($value), static fn ($value): bool => filled($value));

            if ($row !== []) {
                $translations[$code] = array_merge($translations[$code] ?? [], $row);
            }
        }

        return $translations;
    }

    /**
     * The full authored payload for the About page.
     *
     * @return array<string, mixed>
     */
    private function content(): array
    {
        return [
            'intro' => 'My School is a community learning centre helping students grow with strong academics, real skills, and grounded values — from early grades through enrichment courses and madrasa.',

            'body' => <<<'HTML'
                <p>Our school was founded on a simple belief: every child deserves an education that is both excellent and principled. We combine a rigorous core curriculum with character building, so students don't just memorise, they learn to think, lead, and serve.</p>
                <p>Today we run full schooling alongside after-school courses and a weekend madrasa. Our small classrooms, dedicated teachers, and modern facilities create a safe, inspiring environment where every learner is known by name.</p>
                <p>We measure success not only by grades, but by confident young people who carry their values into their families and communities.</p>
                HTML,

            'mission' => 'To provide accessible, values-based education that builds confident, capable, and compassionate learners who serve their communities.',
            'vision' => 'A confident and capable generation, guided by knowledge and values, shaping a better future for Afghanistan.',

            'stats' => [
                ['value' => '1,200+', 'label' => 'Students taught'],
                ['value' => '60+', 'label' => 'Qualified teachers'],
                ['value' => '10', 'label' => 'Years of service'],
                ['value' => '40+', 'label' => 'Courses & programs'],
                ['value' => '95%', 'label' => 'Graduation rate'],
                ['value' => '12', 'label' => 'Clubs & activities'],
                ['value' => '3,500+', 'label' => 'Books in library'],
                ['value' => '25', 'label' => 'Community partners'],
            ],

            // Icon keys are resolved to Lucide icons by the block renderer.
            'values' => [
                ['icon' => 'book-open', 'title' => 'Knowledge first', 'text' => 'Strong fundamentals in literacy, numeracy, and the sciences, taught with clarity and care.'],
                ['icon' => 'sparkles', 'title' => 'Excellence', 'text' => 'High expectations and consistent support so every student reaches their potential.'],
                ['icon' => 'heart-handshake', 'title' => 'Character', 'text' => 'Honesty, respect, and responsibility woven into daily school life.'],
                ['icon' => 'users', 'title' => 'Community', 'text' => 'Families, teachers, and students learning and serving together.'],
                ['icon' => 'shield-check', 'title' => 'Safety', 'text' => 'A protected, inclusive environment where every child belongs.'],
                ['icon' => 'graduation-cap', 'title' => 'Growth', 'text' => 'Lifelong curiosity, leadership, and the skills to keep learning beyond school.'],
            ],

            'highlights' => [
                ['title' => 'Experienced teachers', 'text' => 'Dedicated, trained educators who know every student by name.'],
                ['title' => 'Modern classrooms', 'text' => 'Bright, well-equipped rooms designed for interactive learning.'],
                ['title' => 'Balanced programs', 'text' => 'Academics, arts, sports, and clubs that develop the whole child.'],
                ['title' => 'Values-based learning', 'text' => 'Ethics and service integrated into the everyday curriculum.'],
                ['title' => 'Small class sizes', 'text' => 'Personal attention with a healthy student-to-teacher ratio.'],
                ['title' => 'Pathways for all ages', 'text' => 'From kindergarten through enrichment courses and madrasa.'],
            ],

            'goals' => [
                'Academic excellence across every grade and subject',
                'Character building rooted in ethics and service',
                'Community leadership and civic responsibility',
                'Practical, digital, and language skills for the modern world',
                'A safe and inclusive environment for every learner',
                'Strong partnerships with families and the community',
            ],

            'main_points' => [
                'Experienced and caring teachers',
                'Modern, well-resourced classrooms',
                'Balanced extracurricular programs',
                'Values-based, holistic education',
                'Affordable tuition with scholarships',
                'A thriving, supportive community',
            ],

            'message' => [
                'text' => 'We welcome every learner into a safe, modern, and inspiring environment. Education is a partnership between school and family, and we are committed to walking alongside each student — nurturing their talents, strengthening their character, and preparing them to lead confident, purposeful lives.',
                'author_name' => 'School Administration',
                'author_role' => 'Principal & Management Team',
                'author_image' => 'https://images.unsplash.com/photo-1544717305-ed52b4c28155?auto=format&fit=crop&w=200&q=80',
            ],

            'faq' => [
                ['question' => 'How do I enroll my child?', 'answer' => 'Visit our enrollment page to submit an application. Our team will contact you to arrange a quick interview and complete the process.'],
                ['question' => 'What are the school hours?', 'answer' => 'The main school runs Saturday to Thursday in the morning. Afternoon and weekend slots are reserved for enrichment courses and the madrasa.'],
                ['question' => 'Do you offer scholarships?', 'answer' => 'Yes. We keep tuition affordable and reserve need-based scholarships so that no deserving child is turned away.'],
                ['question' => 'Which languages are taught?', 'answer' => 'Instruction is available in Dari and Pashto, with strong English and Arabic programs across the grades.'],
                ['question' => 'What ages do you accept?', 'answer' => 'We welcome learners from kindergarten through the enrichment years, with programs tailored to each age group.'],
                ['question' => 'Is there a book library?', 'answer' => 'Our library offers more than 3,500 titles and a growing collection of free downloadable books and materials.'],
                ['question' => 'How do you keep the environment safe?', 'answer' => 'Small class sizes, a dedicated counselor, and clear safeguarding policies keep every child protected and included.'],
                ['question' => 'Can parents get involved?', 'answer' => 'Absolutely. We run regular family meetings and community events, and we welcome volunteers and partners.'],
            ],
        ];
    }
}

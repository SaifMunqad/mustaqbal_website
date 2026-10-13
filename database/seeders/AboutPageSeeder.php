<?php

namespace Database\Seeders;

use App\Models\SitePage;
use Illuminate\Database\Seeder;

/**
 * Seeds the public "About" site page with a rich, structured content payload.
 *
 * The about page renders a set of independent sections (story, stats, mission
 * & vision, values, highlights, goals, leadership message, timeline, team, FAQ
 * and a gallery). Every section is stored inside the page's `content` JSON and
 * is optional: the front-end only renders a section when its data is present,
 * so an editor can delete any block without breaking the layout.
 *
 * Idempotent: keyed on the `about` slug. The dashboard page editor preserves
 * these structured keys and only overwrites the `body` HTML, so reseeding and
 * editing never clobber each other.
 */
class AboutPageSeeder extends Seeder
{
    public function run(): void
    {
        SitePage::query()->updateOrCreate(
            ['slug' => 'about'],
            [
                'title' => 'About Mustaqbal School',
                'hero_image' => 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1600&q=80',
                'is_published' => true,
                'content' => $this->content(),
            ],
        );
    }

    /**
     * The full structured payload the about view reads. Kept as one array so it
     * is easy to read, extend, and (later) move into the dashboard editor.
     *
     * @return array<string, mixed>
     */
    private function content(): array
    {
        return [
            'intro' => 'Mustaqbal School is a community learning centre in Kabul helping students grow with strong academics, real skills, and grounded values — from early grades through enrichment courses and madrasa.',

            // Authored, editable rich-text story rendered as the main narrative.
            'body' => <<<'HTML'
                <p>Mustaqbal — meaning "the future" — was founded on a simple belief: every child deserves an education that is both excellent and principled. We combine a rigorous core curriculum with character building, so students don't just memorise, they learn to think, lead, and serve.</p>
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

            // icon keys are mapped to Lucide icons in the about view.
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
                'author_name' => 'Mustaqbal School Administration',
                'author_role' => 'Principal & Management Team',
                'author_image' => 'https://images.unsplash.com/photo-1544717305-ed52b4c28155?auto=format&fit=crop&w=200&q=80',
            ],

            'timeline' => [
                ['year' => '2015', 'title' => 'Our founding', 'text' => 'Mustaqbal opens its doors with a handful of classrooms and a big dream for the community.'],
                ['year' => '2017', 'title' => 'First graduating cohort', 'text' => 'Our pioneer students complete their primary education with distinction.'],
                ['year' => '2019', 'title' => 'Enrichment courses launch', 'text' => 'After-school programs in English, computing, and sciences begin.'],
                ['year' => '2021', 'title' => 'Weekend madrasa', 'text' => 'Quran, Arabic, and Islamic studies added as a complementary track.'],
                ['year' => '2023', 'title' => 'New campus & library', 'text' => 'Expanded classrooms and a 3,500-title free lending library open.'],
                ['year' => '2026', 'title' => 'Digital learning', 'text' => 'Blended learning tools and a growing online community for families.'],
            ],

            'team' => [
                ['name' => 'Ahmad Rahimi', 'role' => 'Principal', 'image' => 'https://images.unsplash.com/photo-1560250097-0b3979313db4?auto=format&fit=crop&w=400&q=80', 'bio' => 'Leads the school with 15 years in education and a passion for values-based learning.'],
                ['name' => 'Fatima Noori', 'role' => 'Head of Academics', 'image' => 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80', 'bio' => 'Oversees curriculum and teacher development across all grades.'],
                ['name' => 'Bilal Ahmadi', 'role' => 'Head of Sciences', 'image' => 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80', 'bio' => 'Runs the science labs and our award-winning student projects.'],
                ['name' => 'Zahra Karimi', 'role' => 'Languages Coordinator', 'image' => 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80', 'bio' => 'Leads the English and Arabic programs and our reading culture.'],
                ['name' => 'Omid Nazari', 'role' => 'Madrasa Director', 'image' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', 'bio' => 'Guides the weekend madrasa and character-building initiatives.'],
                ['name' => 'Sadia Hakimi', 'role' => 'Student Counselor', 'image' => 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&w=400&q=80', 'bio' => 'Supports student wellbeing, inclusion, and family partnership.'],
                ['name' => 'Yusuf Stanikzai', 'role' => 'Sports & Activities', 'image' => 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80', 'bio' => 'Heads the clubs, sports, and extracurricular life of the school.'],
                ['name' => 'Maryam Wardak', 'role' => 'Library & Resources', 'image' => 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=80', 'bio' => 'Manages the free lending library and reading programs.'],
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

            'gallery' => [
                'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1427504494785-3a9ca7044f4a?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1580582932707-520aed6c4705?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1466637578696-0cb097f89b96?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1481627834876-b7833e8f5b7c?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80',
            ],
        ];
    }
}

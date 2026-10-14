<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Job;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Seeds 20 active job postings and 5 closed/inactive ones for the
 * school careers portal.
 *
 * Idempotent: skips when any job_postings row already exists.
 */
class JobSeeder extends Seeder
{
    /**
     * @var list<array{title: string, department: string, category: string, employment_type: string, working_hours?: string|null, description: string}>
     */
    private const ACTIVE_JOBS = [
        [
            'title' => 'Mathematics Teacher (Grades 6-9)',
            'department' => 'Academic',
            'category' => 'school',
            'employment_type' => 'full_time',
            'description' => 'We are looking for a dedicated mathematics teacher who can make numbers come alive for middle-school students. You will design engaging lesson plans, run weekly problem-solving sessions, and mentor students preparing for math competitions.',
        ],
        [
            'title' => 'English Language Instructor',
            'department' => 'Academic',
            'category' => 'course',
            'employment_type' => 'full_time',
            'description' => 'Join our language department to teach conversational and academic English to grades 7 through 12. Experience with communicative teaching methods and IELTS preparation is a strong plus.',
        ],
        [
            'title' => 'Science Lab Assistant',
            'department' => 'Academic',
            'category' => 'school',
            'employment_type' => 'part_time',
            'working_hours' => '12:30 PM - 5:30 PM',
            'description' => 'Support our physics and chemistry teachers during lab sessions. Prepare materials, ensure safety protocols, and help students document their experiments.',
        ],
        [
            'title' => 'Islamic Studies Teacher',
            'department' => 'Academic',
            'category' => 'islamic_madrasa',
            'employment_type' => 'full_time',
            'description' => 'Teach Quran recitation, Tajweed, Fiqh, and Islamic history to primary and middle-school students. A qualified graduate of an Islamic university with teaching experience preferred.',
        ],
        [
            'title' => 'Computer Science & Robotics Teacher',
            'department' => 'IT & Technology',
            'category' => 'course',
            'employment_type' => 'full_time',
            'description' => 'Lead our growing technology program: teach programming basics (Python, Scratch), robotics workshops, and digital literacy. Help students build real projects and participate in tech fairs.',
        ],
        [
            'title' => 'School Counselor',
            'department' => 'Counseling',
            'category' => 'school',
            'employment_type' => 'full_time',
            'description' => 'Provide academic guidance, emotional support, and career counseling to students in grades 8-12. Work closely with parents and teachers to create a safe learning environment.',
        ],
        [
            'title' => 'Library and Research Coordinator',
            'department' => 'Library',
            'category' => 'school',
            'employment_type' => 'part_time',
            'working_hours' => '8:00 AM - 12:00 PM',
            'description' => 'Manage the school library collection, organize reading programs, and help students develop research skills. You will also maintain our digital catalog and coordinate book events.',
        ],
        [
            'title' => 'Primary School Teacher (Grade 3)',
            'department' => 'Academic',
            'category' => 'school',
            'employment_type' => 'full_time',
            'description' => 'A patient and creative teacher needed for our Grade 3 class. You will cover all core subjects using activity-based learning and maintain regular communication with parents.',
        ],
        [
            'title' => 'Physical Education Instructor',
            'department' => 'Academic',
            'category' => 'school',
            'employment_type' => 'contract',
            'description' => 'Plan and lead PE sessions for grades 4-12, organize inter-class sports tournaments, and manage equipment inventory for the sports ground.',
        ],
        [
            'title' => 'Admissions and Enrollment Officer',
            'department' => 'Administration',
            'category' => 'school',
            'employment_type' => 'full_time',
            'description' => 'Handle the full admissions cycle: process applications, coordinate placement assessments, organize open-house events, and maintain accurate enrollment records.',
        ],
        [
            'title' => 'Finance and Accounts Officer',
            'department' => 'Finance',
            'category' => 'school',
            'employment_type' => 'full_time',
            'description' => 'Manage school fee collection, prepare monthly financial reports, handle payroll processing, and coordinate with auditors. At least 3 years of experience in a similar role required.',
        ],
        [
            'title' => 'HR and Recruitment Assistant',
            'department' => 'Human Resources',
            'category' => 'school',
            'employment_type' => 'full_time',
            'description' => 'Support the HR manager with staff recruitment, onboarding, attendance tracking, leave management, and maintaining employee records.',
        ],
        [
            'title' => 'Facility and Maintenance Supervisor',
            'department' => 'Facilities',
            'category' => 'school',
            'employment_type' => 'full_time',
            'description' => 'Oversee building maintenance, coordinate repairs, manage the janitorial team, ensure safety compliance, and plan campus improvement projects.',
        ],
        [
            'title' => 'Arabic Language Teacher',
            'department' => 'Academic',
            'category' => 'course',
            'employment_type' => 'part_time',
            'working_hours' => '2:00 PM - 6:00 PM',
            'description' => 'Teach Modern Standard Arabic to beginner and intermediate students (grades 6-10). Creative lesson planning and cultural context integration expected.',
        ],
        [
            'title' => 'Art and Design Teacher',
            'department' => 'Academic',
            'category' => 'course',
            'employment_type' => 'contract',
            'description' => 'Lead visual arts classes, organize exhibitions of student work, and run after-school creative workshops in drawing, painting, and calligraphy.',
        ],
        [
            'title' => 'Special Education Needs Assistant',
            'department' => 'Counseling',
            'category' => 'school',
            'employment_type' => 'full_time',
            'description' => 'Work alongside classroom teachers to support students with learning differences. Create individualized learning plans and provide one-on-one mentoring.',
        ],
        [
            'title' => 'IT Support Technician',
            'department' => 'IT & Technology',
            'category' => 'school',
            'employment_type' => 'full_time',
            'description' => 'Maintain school computer labs, manage the network infrastructure, troubleshoot hardware/software issues, and support teachers with classroom technology.',
        ],
        [
            'title' => 'School Nurse',
            'department' => 'Administration',
            'category' => 'school',
            'employment_type' => 'part_time',
            'working_hours' => '8:00 AM - 1:00 PM',
            'description' => 'Provide first-aid and basic medical care on campus, manage student health records, conduct health awareness sessions, and coordinate vaccination drives.',
        ],
        [
            'title' => 'Hifz and Tajweed Teacher',
            'department' => 'Academic',
            'category' => 'islamic_madrasa',
            'employment_type' => 'part_time',
            'working_hours' => '4:00 PM - 8:00 PM',
            'description' => 'Teach Quran memorization (Hifz) and proper recitation (Tajweed) to students of the evening Madrasa program. Certification in Qira\'at required.',
        ],
        [
            'title' => 'Social Media and Content Writer',
            'department' => 'Administration',
            'category' => 'school',
            'employment_type' => 'contract',
            'description' => 'Create engaging content for the school website and social media channels. Write event reports, conduct interviews with teachers and students, and help maintain our brand identity.',
        ],
    ];

    /**
     * @var list<array{title: string, department: string, category: string, employment_type: string, working_hours?: string|null, description: string}>
     */
    private const CLOSED_JOBS = [
        [
            'title' => 'Substitute Chemistry Teacher (Semester 1)',
            'department' => 'Academic',
            'category' => 'school',
            'employment_type' => 'contract',
            'description' => 'Short-term contract to cover a leave of absence for the first semester. This position has now been filled.',
        ],
        [
            'title' => 'Summer Camp Volunteer Coordinator',
            'department' => 'Administration',
            'category' => 'course',
            'employment_type' => 'contract',
            'description' => 'Coordinate summer camp activities and volunteer schedules. Summer program completed — no longer accepting applications.',
        ],
        [
            'title' => 'Temporary Receptionist',
            'department' => 'Administration',
            'category' => 'school',
            'employment_type' => 'part_time',
            'working_hours' => '8:00 AM - 12:00 PM',
            'description' => 'Cover for the full-time receptionist during her maternity leave. Position ended as the regular staff member returned.',
        ],
        [
            'title' => 'Weekend Coding Workshop Trainer',
            'department' => 'IT & Technology',
            'category' => 'course',
            'employment_type' => 'part_time',
            'working_hours' => '9:00 AM - 1:00 PM',
            'description' => 'Delivered weekend coding workshops for grades 5-8. The current term has ended and enrollment is closed.',
        ],
        [
            'title' => 'Ramadan Madrasa Assistant Teacher',
            'department' => 'Academic',
            'category' => 'islamic_madrasa',
            'employment_type' => 'part_time',
            'working_hours' => '4:30 PM - 7:30 PM',
            'description' => 'Seasonal assistant role for the Ramadan evening Madrasa. The Ramadan program has finished for this year.',
        ],
    ];

    public function run(): void
    {
        if (Job::query()->exists()) {
            $this->command?->info('Jobs already exist, skipping JobSeeder.');

            return;
        }

        $author = $this->resolveAuthor();

        foreach (self::ACTIVE_JOBS as $index => $job) {
            $jobModel = Job::factory()
                ->withTitle($job['title'])
                ->withCategory($job['category'])
                ->create([
                    'user_id' => $author->id,
                    'employment_type' => $job['employment_type'],
                    'working_hours' => $job['working_hours'] ?? null,
                    'application_email' => 'careers@mustaqbal.af',
                    'application_url' => $index % 5 === 0 ? 'https://forms.example.com/apply-' . ($index + 1) : null,
                    'deadline' => now()->addDays(random_int(14, 90))->toDateString(),
                    'is_active' => true,
                ]);

            $jobModel->syncDefaultTranslation([
                'title' => $job['title'],
                'department' => $job['department'],
                'description' => $job['description'],
                'requirements' => $this->generateRequirements($index),
            ]);
        }

        foreach (self::CLOSED_JOBS as $index => $job) {
            $jobModel = Job::factory()
                ->inactive()
                ->withTitle($job['title'])
                ->withCategory($job['category'])
                ->create([
                    'user_id' => $author->id,
                    'employment_type' => $job['employment_type'],
                    'working_hours' => $job['working_hours'] ?? null,
                    'application_email' => 'careers@mustaqbal.af',
                    'application_url' => null,
                ]);

            $jobModel->syncDefaultTranslation([
                'title' => $job['title'],
                'department' => $job['department'],
                'description' => $job['description'],
                'requirements' => $this->generateRequirements($index),
            ]);
        }
    }

    private function generateRequirements(int $index): string
    {
        $common = [
            '- Bachelor\'s degree in the relevant field (Master\'s preferred)',
            '- Minimum 2 years of teaching or relevant work experience',
            '- Excellent communication skills in Dari/Pashto and English',
            '- Ability to work in a diverse, multicultural school environment',
            '- Commitment to safeguarding and child protection policies',
        ];

        $roleSpecific = match (true) {
            $index % 4 === 0 => ['- Classroom management certification (or equivalent)', '- Experience with project-based learning', '- Familiarity with the Afghan national curriculum'],
            $index % 4 === 1 => ['- Relevant professional certification', '- Strong organizational skills', '- Experience working with parents and community stakeholders'],
            $index % 4 === 2 => ['- Proficiency with office tools and digital platforms', '- Ability to manage multiple priorities', '- Team-oriented mindset'],
            default => ['- Teaching license or valid educational qualification', '- Willingness to participate in professional development', '- Cross-cultural sensitivity and respect for diversity'],
        };

        return implode("\n", array_merge($common, $roleSpecific));
    }

    private function resolveAuthor(): User
    {
        return User::query()->firstOrCreate(
            ['email' => 'careers@mustaqbal.af'],
            [
                'name' => 'HR Department',
                'role' => UserRole::Management->value,
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
            ],
        );
    }
}

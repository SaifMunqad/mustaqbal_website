<?php

namespace Database\Seeders;

use App\Models\Award;
use Illuminate\Database\Seeder;

/**
 * Seeds a demo award register for the public verification page: diplomas,
 * certificates and honors issued to named holders, including two holders with
 * more than one award.
 *
 * Idempotent: skips when any `awards` row already exists, so re-running
 * `db:seed` never duplicates records or mixes demo data into a real register.
 */
class AwardSeeder extends Seeder
{
    /**
     * @var list<array{person_id: string, award_id: string, full_name: string, father_name: string, awarded_at: string}>
     */
    private const AWARDS = [
        [
            'person_id' => 'STU-2021-00014',
            'award_id' => 'DIP-2024-000137',
            'full_name' => 'Ahmad Wali Karimi',
            'father_name' => 'Abdul Rahim',
            'awarded_at' => '2024-06-15',
        ],
        [
            'person_id' => 'STU-2021-00014',
            'award_id' => 'AWD-2024-000021',
            'full_name' => 'Ahmad Wali Karimi',
            'father_name' => 'Abdul Rahim',
            'awarded_at' => '2024-06-15',
        ],
        [
            'person_id' => 'STU-2022-00087',
            'award_id' => 'DIP-2025-000204',
            'full_name' => 'Zahra Hussaini',
            'father_name' => 'Mohammad Hussain',
            'awarded_at' => '2025-06-12',
        ],
        [
            'person_id' => 'STU-2022-00091',
            'award_id' => 'CRT-2024-000311',
            'full_name' => 'Bilal Ahmad Noori',
            'father_name' => 'Noor Ahmad',
            'awarded_at' => '2024-11-20',
        ],
        [
            'person_id' => 'STU-2020-00005',
            'award_id' => 'DIP-2023-000098',
            'full_name' => 'Maryam Sadat',
            'father_name' => 'Sayed Ali',
            'awarded_at' => '2023-06-18',
        ],
        [
            'person_id' => 'STU-2023-00142',
            'award_id' => 'CRT-2025-000402',
            'full_name' => 'Sohaila Rahimi',
            'father_name' => 'Abdul Qadir',
            'awarded_at' => '2025-03-08',
        ],
        [
            'person_id' => 'STU-2019-00002',
            'award_id' => 'CRT-2022-000077',
            'full_name' => 'Faridullah Zadran',
            'father_name' => 'Gul Agha',
            'awarded_at' => '2022-09-30',
        ],
        [
            'person_id' => 'STU-2023-00151',
            'award_id' => 'AWD-2025-000018',
            'full_name' => 'Hasibullah Amiri',
            'father_name' => 'Mohammad Ismail',
            'awarded_at' => '2025-05-22',
        ],
        [
            'person_id' => 'STU-2024-00203',
            'award_id' => 'CRT-2025-000455',
            'full_name' => 'Nargis Akbari',
            'father_name' => 'Abdul Wakil',
            'awarded_at' => '2025-08-14',
        ],
        [
            'person_id' => 'STU-2021-00033',
            'award_id' => 'DIP-2024-000165',
            'full_name' => 'Emran Faizi',
            'father_name' => 'Rahmatullah',
            'awarded_at' => '2024-06-15',
        ],
        [
            'person_id' => 'STU-2022-00110',
            'award_id' => 'AWD-2024-000033',
            'full_name' => 'Lima Nazari',
            'father_name' => 'Ghulam Sakhi',
            'awarded_at' => '2024-12-10',
        ],
        [
            'person_id' => 'STU-2020-00048',
            'award_id' => 'CRT-2023-000229',
            'full_name' => 'Obaidullah Safi',
            'father_name' => 'Abdul Ghafar',
            'awarded_at' => '2023-10-05',
        ],
        [
            'person_id' => 'STU-2024-00220',
            'award_id' => 'CRT-2025-000470',
            'full_name' => 'Shabnam Yousufi',
            'father_name' => 'Mohammad Yousuf',
            'awarded_at' => '2025-09-01',
        ],
        [
            'person_id' => 'STU-2023-00175',
            'award_id' => 'DIP-2025-000231',
            'full_name' => 'Rohullah Shinwari',
            'father_name' => 'Haji Mirwais',
            'awarded_at' => '2025-06-12',
        ],
        [
            'person_id' => 'STU-2019-00011',
            'award_id' => 'AWD-2021-000009',
            'full_name' => 'Sayed Omid Mousavi',
            'father_name' => 'Sayed Hassan',
            'awarded_at' => '2021-11-28',
        ],
        [
            'person_id' => 'STU-2022-00119',
            'award_id' => 'CRT-2024-000340',
            'full_name' => 'Mohammad Naseer Ahmadzai Waziri',
            'father_name' => 'Abdul Nabi Khan Waziri',
            'awarded_at' => '2024-07-07',
        ],
        [
            'person_id' => 'STU-2025-00241',
            'award_id' => 'CRT-2026-000101',
            'full_name' => 'Freshta Popal',
            'father_name' => 'Abdul Malik',
            'awarded_at' => '2026-02-19',
        ],
        [
            'person_id' => 'STU-2025-00242',
            'award_id' => 'AWD-2026-000004',
            'full_name' => 'Yusuf Hotak',
            'father_name' => 'Mir Agha',
            'awarded_at' => '2026-04-30',
        ],
    ];

    public function run(): void
    {
        if (Award::query()->exists()) {
            $this->command?->info('Awards already exist, skipping AwardSeeder.');

            return;
        }

        foreach (self::AWARDS as $award) {
            Award::factory()->create($award);
        }

        $this->command?->info('Seeded '.count(self::AWARDS).' award records.');
    }
}

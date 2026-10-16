<?php

namespace App\Support\Translation;

use App\Models\Language;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Curated Pashto (ps) and Dari (fa_AF) content used by the factories and
 * seeders so every localized table is populated for all active languages, not
 * just the default (English).
 *
 * Two kinds of content live here:
 *  - **glossaries** keyed by the exact English source string (event titles, job
 *    titles/departments, page titles, authored home-section copy) for the rows
 *    whose English text is fixed and worth translating faithfully; and
 *  - **pools** (book titles/publishers/descriptions, event body prose, job
 *    requirements) picked deterministically by an index, used for the
 *    factory/random rows where a literal translation is meaningless but an
 *    in-language placeholder is desirable.
 *
 * All helpers key non-default languages by the shared `ps` / `fa_AF` codes and
 * are safe to call even when only the default language is seeded: the writes
 * simply no-op for a language that has no row.
 */
class LocalizedContent
{
    /**
     * The non-default language codes carried by the seeded glossaries/pools.
     *
     * @return list<string>
     */
    public static function secondaryCodes(): array
    {
        return ['ps', 'fa_AF'];
    }

    /**
     * Persist the default-language row plus the curated/pool secondary-language
     * rows in one call, so callers never leave a translated table half-filled.
     *
     * @param  array<string, mixed>  $default  default-language attributes
     * @param  array<string, array<string, mixed>>  $secondary  code => attributes
     */
    public static function persist(Model $model, array $default, array $secondary = []): void
    {
        $model->syncDefaultTranslation($default);

        self::apply($model->translations(), $secondary);
    }

    /**
     * Thin wrapper over {@see TranslationPayload::apply} that only writes the
     * languages that actually exist as active rows, leaving the default handled
     * separately by {@see persist()}.
     *
     * @param  array<string, array<string, mixed>>  $secondary  code => attributes
     */
    public static function apply(HasMany $relation, array $secondary): void
    {
        $available = Language::query()->whereIn('code', array_keys($secondary))->pluck('code')->all();

        $payload = array_filter(
            $secondary,
            static fn (string $code): bool => in_array($code, $available, true),
            ARRAY_FILTER_USE_KEY,
        );

        TranslationPayload::apply($relation, $payload);
    }

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------

    /**
     * Localized event titles, keyed by the exact English curated title.
     *
     * @return array<string, array<string, string>>
     */
    public static function eventTitles(): array
    {
        return [
            'Parent-Teacher Meeting' => ['ps' => 'د والدینو او ښوونکو غونډه', 'fa_AF' => 'غونډه والدین و معلمان'],
            'Science Fair Exhibition' => ['ps' => 'د ساینس نندارتون', 'fa_AF' => 'نمایشگاه ساینس'],
            'Quran Recitation Competition' => ['ps' => 'د قرآن تلاوت سیالی', 'fa_AF' => 'مسابقات تلاوت قرآن'],
            'Annual Sports Day' => ['ps' => 'کلنۍ ورځ د سپورت', 'fa_AF' => 'روز سالانه ورزش'],
            'Mathematics Olympiad' => ['ps' => 'د ریاضي المپیاد', 'fa_AF' => 'المپیاد ریاضی'],
            'English Speech Contest' => ['ps' => 'د انګلیسي وینا سیالی', 'fa_AF' => 'مسابقات سخنرانی انگلیسی'],
            'Open House for New Families' => ['ps' => 'د نویو کورنیو لپاره خلاص کور', 'fa_AF' => 'میزبانی از خانواده‌های جدید'],
            'Art and Craft Exhibition' => ['ps' => 'د هنر او لاسي هنر نندارتون', 'fa_AF' => 'نمایشگاه هنر و صنایع دستی'],
            'Career Guidance Seminar' => ['ps' => 'د مسلک لارښود سیمینار', 'fa_AF' => 'سمینار راهنمایی شغلی'],
            'Reading Week Kickoff' => ['ps' => 'پیل د لوستلو اونیې', 'fa_AF' => 'آغاز هفته کتاب‌خوانی'],
            'Graduation Ceremony' => ['ps' => 'د فارالېدو مراسمه', 'fa_AF' => 'مراسم فارغ‌التحصیلی'],
            'Teacher Training Workshop' => ['ps' => 'د ښوونکو روزنیز کارځی', 'fa_AF' => 'کارگاه آموزش معلمان'],
            'Community Clean-Up Drive' => ['ps' => 'د ټولنې پاکېوالی', 'fa_AF' => 'کمپین پاکسازی محله'],
            'Inter-Class Football Tournament' => ['ps' => 'د ټولګيو د فوټبال سیالي', 'fa_AF' => 'تورنمنت فوتبال بین کلاسی'],
            'Poetry and Literature Night' => ['ps' => 'د شعرو او ادبیاتو شپه', 'fa_AF' => 'شب شعر و ادب'],
            'Technology and Robotics Day' => ['ps' => 'د ټیکنالوژۍ او روباتیک ورځ', 'fa_AF' => 'روز تکنالوژی و رباتیک'],
            'Health Awareness Session' => ['ps' => 'د روغتیا پوهاوی ناسته', 'fa_AF' => 'جلسه آگاهی بهداشتی'],
            'Board Meeting with Stakeholders' => ['ps' => 'د مدیریتې شورې غونډه', 'fa_AF' => 'جلسه هیئت مدیره با ذی‌نفعان'],
            'Field Trip to National Museum' => ['ps' => 'ګرځ د ملي موزیم', 'fa_AF' => 'گردش به موزیم ملی'],
            'Debate Club Final Round' => ['ps' => 'د مناظرې بکلوب وروستی پړاو', 'fa_AF' => 'دور نهایی باشگاه مناظره'],
            'Calligraphy Workshop' => ['ps' => 'د خوشنویسي کارځی', 'fa_AF' => 'کارگاه خوشنویسی'],
            'End-of-Term Assessment Briefing' => ['ps' => 'د سمستر پای ارزونې غونډه', 'fa_AF' => 'توجیه ارزیابی پایان ترم'],
        ];
    }

    /**
     * Localized event location, keyed by the exact English location string.
     *
     * @return array<string, array<string, string>>
     */
    public static function eventLocations(): array
    {
        return [
            'Main Hall, Kabul' => ['ps' => 'لوی تالار، کابل', 'fa_AF' => 'تالار اصلی، کابل'],
            'School Courtyard, Kabul' => ['ps' => 'د ښوونځي حیاط، کابل', 'fa_AF' => 'حیاط مکتب، کابل'],
            'Classroom Block A, Kabul' => ['ps' => 'د ټولګي بلاک A، کابل', 'fa_AF' => 'بلوک صنف A، کابل'],
            'Auditorium, Kabul' => ['ps' => 'د غونډو تالار، کابل', 'fa_AF' => 'تالار همایش، کابل'],
            'Sports Ground, Kabul' => ['ps' => 'د سپورت ډګر، کابل', 'fa_AF' => 'زمین ورزشی، کابل'],
        ];
    }

    /**
     * A deterministic, in-language event excerpt for the given pool index.
     */
    public static function eventExcerpt(int $index, string $code): string
    {
        $pool = match ($code) {
            'ps' => [
                'دا په زړه پورې پېښه ټولې ټولنې ته پرانه ده.',
                'راتلونکې غونډه چې زده کوونکي او کورنۍ یې سره راټولوي.',
                'د زده کړو او همکارۍ یوه ښه فرصت.',
            ],
            'fa_AF' => [
                'این رویداد جذاب برای تمام جامعه باز است.',
                'گرامی آینده که دانش‌آموزان و خانواده‌ها را کنار هم می‌آورد.',
                'فرصتی خوب برای یادگیری و همکاری.',
            ],
            default => ['Join us for this special school event.'],
        };

        return $pool[$index % count($pool)];
    }

    /**
     * A deterministic, in-language multi-paragraph event body.
     */
    public static function eventBody(int $index, string $code): string
    {
        $pool = match ($code) {
            'ps' => [
                "دا پېښه د ښوونځي د فعالیتونو برخه ده. زموږ موخه د زده کوونکو پرمختګ او د ټولنې ګډون دی.\n\nټول معلمین، زده کوونکي او کورنۍ ته ښه راغلاست ویل کېږي.",
                "موږ دا ورځ د یوې ګټورې تجربې لپاره ترتیب کوو. فعالیته به د ټول عمر زده کوونکو لپاره وي.\n\nد نور معلوماتو لپاره له ښوونځي سره اړیکه ونیسئ.",
            ],
            'fa_AF' => [
                "این رویداد بخشی از فعالیت‌های مکتب است. هدف ما پیشرفت دانش‌آموزان و اشتراک جامعه است.\n\nاز تمام معلمان، دانش‌آموزان و خانواده‌ها خوش‌آمدگویی می‌شود.",
                "این روز را برای تجربه‌ای مفید برنامه‌ریزی کرده‌ایم. فعالیت‌ها برای تمام گروه‌های سنی خواهد بود.\n\nبرای اطلاعات بیشتر با مکتب تماس بگیرید.",
            ],
            default => ["This event is part of our school activities.\n\nAll are welcome."],
        };

        return $pool[$index % count($pool)];
    }

    /**
     * Localized (title, excerpt, body, location) for a curated event, using the
     * glossary for the known title/location and pools for the prose.
     *
     * @return array<string, array<string, string|null>>
     */
    public static function eventSecondary(string $englishTitle, ?string $englishLocation, int $index): array
    {
        $title = self::eventTitles()[$englishTitle] ?? null;
        $location = $englishLocation !== null ? (self::eventLocations()[$englishLocation] ?? null) : null;

        return collect(self::secondaryCodes())->mapWithKeys(
            static fn (string $code): array => [$code => [
                'title' => $title[$code] ?? $englishTitle,
                'excerpt' => self::eventExcerpt($index, $code),
                'body' => self::eventBody($index, $code),
                'location' => $location[$code] ?? $englishLocation,
            ]],
        )->all();
    }

    // ---------------------------------------------------------------------
    // Jobs
    // ---------------------------------------------------------------------

    /**
     * Localized job title + department + concise description, keyed by the exact
     * English job title used by {@see \Database\Seeders\JobSeeder}.
     *
     * @return array<string, array<string, array<string, string>>>
     */
    public static function jobGlossary(): array
    {
        return [
            'Mathematics Teacher (Grades 6-9)' => [
                'ps' => ['title' => 'ښوونکی د ریاضي (۶-۹ ټولګي)', 'department' => 'توکیز', 'description' => 'د منځنیو ټولګيو زده کوونکو لپاره د ریاضي تدریس.', 'category' => 'school'],
                'fa_AF' => ['title' => 'معلم ریاضی (صنف ۶-۹)', 'department' => 'تدریسی', 'description' => 'تدریس ریاضی برای دانش‌آموزان متوسطه.', 'category' => 'school'],
            ],
            'English Language Instructor' => [
                'ps' => ['title' => 'د انګلیسي ژبې ښوونکی', 'department' => 'توکیز', 'description' => 'د ۷ تر ۱۲ ټولګي زده کوونکو لپاره د انګلیسي تدریس.', 'category' => 'course'],
                'fa_AF' => ['title' => 'مدرس زبان انگلیسی', 'department' => 'تدریسی', 'description' => 'تدریس انگلیسی برای صنف ۷ تا ۱۲.', 'category' => 'course'],
            ],
            'Science Lab Assistant' => [
                'ps' => ['title' => 'د ساینس تخنيکي مرستیال', 'department' => 'توکیز', 'description' => 'د فزیک او کیمیا د لابراتوارو ملاتړ.', 'category' => 'school'],
                'fa_AF' => ['title' => 'مسئول لابراتوار ساینس', 'department' => 'تدریسی', 'description' => 'حمایت از لابراتوارهای فزیک و کیمیا.', 'category' => 'school'],
            ],
            'Islamic Studies Teacher' => [
                'ps' => ['title' => 'د اسلامي زده کړو ښوونکی', 'department' => 'توکیز', 'description' => 'د قرآن، تجوید او اسلامي تاریخ تدریس.', 'category' => 'islamic_madrasa'],
                'fa_AF' => ['title' => 'معلم مطالعات اسلامی', 'department' => 'تدریسی', 'description' => 'تدریس قرآن، تجوید و تاریخ اسلامی.', 'category' => 'islamic_madrasa'],
            ],
            'Computer Science & Robotics Teacher' => [
                'ps' => ['title' => 'د کمپیوټر ساینس او روباتیک ښوونکی', 'department' => 'IT او تکنالوژي', 'description' => 'د پروګرام جوړونې او روباتیک درس ورکول.', 'category' => 'course'],
                'fa_AF' => ['title' => 'معلم کمپیوتر ساینس و رباتیک', 'department' => 'ITA و تکنالوژی', 'description' => 'تدریس برنامه‌نویسی و رباتیک.', 'category' => 'course'],
            ],
            'School Counselor' => [
                'ps' => ['title' => 'د ښوونځي لارښود', 'department' => 'لارښود', 'description' => 'د زده کوونکو لپاره د زده کړو او مسلک لارښودنه.', 'category' => 'school'],
                'fa_AF' => ['title' => 'مشاور مکتب', 'department' => 'راهنمایی', 'description' => 'ارائه راهنمایی تحصیلی و شغلی به دانش‌آموزان.', 'category' => 'school'],
            ],
            'Library and Research Coordinator' => [
                'ps' => ['title' => 'د کتابتون او څېړنې همغږی', 'department' => 'کتابتون', 'description' => 'د کتابتون د راټولې او لوستلو پروګرامونو مدیریت.', 'category' => 'school'],
                'fa_AF' => ['title' => 'هماهنگ کتابخانه و پژوهش', 'department' => 'کتابخانه', 'description' => 'مدیریت مجموعه کتابخانه و برنامه‌های مطالعه.', 'category' => 'school'],
            ],
            'Primary School Teacher (Grade 3)' => [
                'ps' => ['title' => 'د لومړني ښوونځي ښوونکی (۳ ټولګي)', 'department' => 'توکیز', 'description' => 'د درېیم ټولګي ټولو بنسټیزو مضامینو تدریس.', 'category' => 'school'],
                'fa_AF' => ['title' => 'معلم ابتدایی (صنف ۳)', 'department' => 'تدریسی', 'description' => 'تدریس تمام مضامین اساسی صنف سوم.', 'category' => 'school'],
            ],
            'Physical Education Instructor' => [
                'ps' => ['title' => 'د بدني زده کړې ښوونکی', 'department' => 'توکیز', 'description' => 'د ۴ تر ۱۲ ټولګي لپاره د سپورتونو تدریس.', 'category' => 'school'],
                'fa_AF' => ['title' => 'مربی تربیت بدنی', 'department' => 'تدریسی', 'description' => 'برگزاری تمرینات ورزشی صنف ۴ تا ۱۲.', 'category' => 'school'],
            ],
            'Admissions and Enrollment Officer' => [
                'ps' => ['title' => 'د ثبت‌نام او داخلې مسئول', 'department' => 'اداره', 'description' => 'د زده کوونکو د داخلې او ثبت‌نام پروسه مدیریت.', 'category' => 'school'],
                'fa_AF' => ['title' => 'مسئول ثبت‌نام و پذیرش', 'department' => 'اداری', 'description' => 'مدیریت تمام پروسه پذیرش دانش‌آموزان.', 'category' => 'school'],
            ],
            'Finance and Accounts Officer' => [
                'ps' => ['title' => 'د مالي او حساباتو مسئول', 'department' => 'ماليه', 'description' => 'د فیس راټولول او میاشتنۍ مالي راپورونه.', 'category' => 'school'],
                'fa_AF' => ['title' => 'مسئول مالی و حسابات', 'department' => 'مالی', 'description' => 'مدیریت جمع فیس و گزارش‌های مالی ماهوار.', 'category' => 'school'],
            ],
            'HR and Recruitment Assistant' => [
                'ps' => ['title' => 'د کارکوونکو او ګمارنې مرستیال', 'department' => 'بشري سرچینې', 'description' => 'د کارکوونکو په ګمارنه او مدیریت کې مرسته.', 'category' => 'school'],
                'fa_AF' => ['title' => 'معاون منابع بشری', 'department' => 'منابع بشری', 'description' => 'کمک در جذب، شمولیت و مدیریت کارمندان.', 'category' => 'school'],
            ],
            'Facility and Maintenance Supervisor' => [
                'ps' => ['title' => 'د تأسیساتو او ساتنې څارونکی', 'department' => 'تأسیسات', 'description' => 'د ودانۍ ساتنه او د کارکوونکو تیم مدیریت.', 'category' => 'school'],
                'fa_AF' => ['title' => 'ناظر تعمیرات و نگهداری', 'department' => 'تأسیسات', 'description' => 'نگهداری ساختمان و مدیریت تیم خدمه.', 'category' => 'school'],
            ],
            'Arabic Language Teacher' => [
                'ps' => ['title' => 'د عربی ژبې ښوونکی', 'department' => 'توکیز', 'description' => 'د پیل او منځنیو کچو زده کوونکو ته د عربي تدریس.', 'category' => 'course'],
                'fa_AF' => ['title' => 'معلم زبان عربی', 'department' => 'تدریسی', 'description' => 'تدریس عربی معیار برای مبتدیین و متوسطه.', 'category' => 'course'],
            ],
            'Art and Design Teacher' => ['ps' => ['title' => 'د هنر او ډیزاین ښوونکی', 'department' => 'توکیز', 'description' => 'د بصری هنرونو ټولګي او نندارتونه.', 'category' => 'course'],
                'fa_AF' => ['title' => 'معلم هنر و طراحی', 'department' => 'تدریسی', 'description' => 'برگزاری صنف هنرهای تجسمی و نمایشگاه‌ها.', 'category' => 'course'],
            ],
            'Special Education Needs Assistant' => [
                'ps' => ['title' => 'د ځانګړو زده کوونکو مرستیال', 'department' => 'لارښود', 'description' => 'د زده کړې ستونزې لرونکو زده کوونکو ملاتړ.', 'category' => 'school'],
                'fa_AF' => ['title' => 'معاون نیازهای ویژه', 'department' => 'راهنمایی', 'description' => 'کمک به دانش‌آموزان با تفاوت‌های یادگیری.', 'category' => 'school'],
            ],
            'IT Support Technician' => [
                'ps' => ['title' => 'د IT ملاتړ تخنيکي', 'department' => 'IT او تکنالوژي', 'description' => 'د کمپیوټر لابراتوارونو او شبکې مدیریت.', 'category' => 'school'],
                'fa_AF' => ['title' => 'تخنیکي ملاتړ IT', 'department' => 'IT و تکنالوژی', 'description' => 'نگهداری لابراتوارهای کمپیوتر و شبکه.', 'category' => 'school'],
            ],
            'School Nurse' => [
                'ps' => ['title' => 'د ښوونځي نرسان', 'department' => 'اداره', 'description' => 'لومړنۍ درملنه او د روغتیا پوهاوی.', 'category' => 'school'],
                'fa_AF' => ['title' => 'پرستار مکتب', 'department' => 'اداری', 'description' => 'ارائه مراقبت‌های صحی اولیه و جلسات آگاهی.', 'category' => 'school'],
            ],
            'Hifz and Tajweed Teacher' => [
                'ps' => ['title' => 'د حفظ او تجوید ښوونکی', 'department' => 'توکیز', 'description' => 'د قرآن د حفظ او سم تلاوت تدریس.', 'category' => 'islamic_madrasa'],
                'fa_AF' => ['title' => 'معلم حفظ و تجوید', 'department' => 'تدریسی', 'description' => 'تدریس حفظ قرآن و قرائت صحیح.', 'category' => 'islamic_madrasa'],
            ],
            'Social Media and Content Writer' => [
                'ps' => ['title' => 'د ټولنیزو رسنیو او منځپانګې لیکوال', 'department' => 'اداره', 'description' => 'د ویبپاڵې او ټولنیزو رسنیو لپاره منځپانګه جوړول.', 'category' => 'school'],
                'fa_AF' => ['title' => 'نویسنده محتوا و رسانه‌های اجتماعی', 'department' => 'اداری', 'description' => 'تولید محتوا برای وبسایت و رسانه‌های اجتماعی.', 'category' => 'school'],
            ],
            'Substitute Chemistry Teacher (Semester 1)' => [
                'ps' => ['title' => 'د کیمیا بدلي ښوونکی (لومړي سمستر)', 'department' => 'توکیز', 'description' => 'د لومړي سمستر لپاره د لنډمهاله درسي تدریس.', 'category' => 'school'],
                'fa_AF' => ['title' => 'معلم جایگزین کیمیا (ترم ۱)', 'department' => 'تدریسی', 'description' => 'تدریس موقت کیمیا برای ترم اول.', 'category' => 'school'],
            ],
            'Summer Camp Volunteer Coordinator' => [
                'ps' => ['title' => 'د تابستان کمپ رضاکاره همغږی', 'department' => 'اداره', 'description' => 'د تابستان کمپ فعالیتونه او مهال ویش.', 'category' => 'course'],
                'fa_AF' => ['title' => 'هماهنگ داوطلبان کمپ تابستانی', 'department' => 'اداری', 'description' => 'هماهنگی فعالیت‌ها و جدول کمپ تابستانی.', 'category' => 'course'],
            ],
            'Temporary Receptionist' => [
                'ps' => ['title' => 'لنډمهاله منلې (استقباليه)', 'department' => 'اداره', 'description' => 'د استقبال دندې لنډمهاله ترسره کول.', 'category' => 'school'],
                'fa_AF' => ['title' => 'میزبان موقت', 'department' => 'اداری', 'description' => 'مدیریت موقت استقبال در زمان مرخصی.', 'category' => 'school'],
            ],
            'Weekend Coding Workshop Trainer' => [
                'ps' => ['title' => 'د اونۍ پای د کوډینګ کارځي روزنکی', 'department' => 'IT او تکنالوژي', 'description' => 'د ۵-۸ ټولګي زده کوونکو لپاره د کوډینګ کارځونه.', 'category' => 'course'],
                'fa_AF' => ['title' => 'مربی ورکشاپ کودنویسی آخر هفته', 'department' => 'IT و تکنالوژی', 'description' => 'برگزاری ورکشاپ‌های کودنویسی صنف ۵-۸.', 'category' => 'course'],
            ],
            'Ramadan Madrasa Assistant Teacher' => [
                'ps' => ['title' => 'د رمضان مدرسې مرستیال ښوونکی', 'department' => 'توکیز', 'description' => 'د رمضان شپې مدرسې لپاره موسمې مرسته.', 'category' => 'islamic_madrasa'],
                'fa_AF' => ['title' => 'معاون معلم مدرسه رمضان', 'department' => 'تدریسی', 'description' => 'نقش فصلی معاونت در مدرسه شامگاهی رمضان.', 'category' => 'islamic_madrasa'],
            ],
        ];
    }

    /**
     * Deterministic, in-language job requirements bullet list for the pool index.
     */
    public static function jobRequirements(int $index, string $code): string
    {
        $common = match ($code) {
            'ps' => [
                '- په اړونده ساحه کې د لیسانس درجه (ماډستر غوره)',
                '- لږ تر لږه د دوه کلنو تدریس یا تجربې لرونکی',
                '- په دری، پښتو او انګلیسي ژبو کې ښه اړیکې',
                '- په متنوعه چاپېریال کې د کار وړتیا',
            ],
            'fa_AF' => [
                '- لیسانس در مربوطه (ماستری ترجیح)',
                '- حداقل دو سال تجربه تدریس یا کار',
                '- مهارت‌های ارتباطی به دری، پشتو و انگلیسی',
                '- توانایی کار در محیط متنوع فرهنگی',
            ],
            default => ['- Bachelor degree', '- 2+ years experience', '- Strong communication skills'],
        };

        $extra = match ($index % 3) {
            1 => match ($code) {
                'ps' => '- د زده کوونکو ساتنې ژمنه',
                'fa_AF' => '- تعهد به حفظ و حفاظت دانش‌آموزان',
                default => '- Child safeguarding',
            },
            2 => match ($code) {
                'ps' => '- ځان ته روزنې او پرمختګ ته لیواله',
                'fa_AF' => '- علاقه به رشد و توسعه حرفه‌ای',
                default => '- Willingness to develop professionally',
            },
            default => match ($code) {
                'ps' => '- د ټیم سپیر او همکاري',
                'fa_AF' => '- روحیه تیمی و همکاری',
                default => '- Team-oriented mindset',
            },
        };

        return implode("\n", [...$common, $extra]);
    }

    /**
     * Localized job fields for a known (curated) job title, matched to the
     * glossary; returns [] when the English title is unknown so callers can
     * leave that row to the factory placeholder pools.
     *
     * @return array<string, array<string, string>>
     */
    public static function jobSecondary(string $englishTitle): array
    {
        $entry = self::jobGlossary()[$englishTitle] ?? null;

        if ($entry === null) {
            return [];
        }

        return collect(self::secondaryCodes())->mapWithKeys(
            static fn (string $code): array => [$code => [
                'title' => $entry[$code]['title'],
                'department' => $entry[$code]['department'],
                'description' => $entry[$code]['description'],
                'requirements' => self::jobRequirements(0, $code),
            ]],
        )->all();
    }

    /**
     * Generic, in-language job fields for factory/random rows whose English
     * title has no glossary entry, so every job still carries ps/fa_AF rows.
     * Picked deterministically by the pool index.
     *
     * @return array<string, array<string, string>>
     */
    public static function genericJobSecondary(int $index): array
    {
        $roles = [
            'ps' => ['ښوونکی', 'مرستیال ښوونکی', 'همغږی', 'مسئول', 'څارونکی', 'تخنيکي', 'لارښود', 'لیکوال'],
            'fa_AF' => ['معلم', 'معلم معاون', 'هماهنگ', 'مسئول', 'ناظر', 'تخنیکي', 'مشاور', 'نویسنده'],
        ];

        $departments = [
            'ps' => ['توکیز', 'اداره', 'IT او تکنالوژي', 'ماليه', 'بشري سرچینې', 'کتابتون'],
            'fa_AF' => ['تدریسی', 'اداری', 'IT و تکنالوژی', 'مالی', 'منابع بشری', 'کتابخانه'],
        ];

        $descriptions = [
            'ps' => ['د ښوونځي لپاره یوه مهمه دنده چې د زده کوونکو پرمختګ ته مرسته کوي.', 'زموږ ټیم ته د متعهد او تجربه لرونکي کارکوونکي اړتیا ده.', 'دا دنده د زده کړو او خدمتونو کیفیت لوړوي.'],
            'fa_AF' => ['نقش مهم برای مکتب که به پیشرفت دانش‌آموزان کمک می‌کند.', 'تیم ما به یک نیروی متعهد و باتجربه نیاز دارد.', 'این نقش کیفیت آموزش و خدمات را ارتقا می‌دهد.'],
        ];

        return collect(self::secondaryCodes())->mapWithKeys(
            static fn (string $code): array => [$code => [
                'title' => $roles[$code][$index % count($roles[$code])],
                'department' => $departments[$code][$index % count($departments[$code])],
                'description' => $descriptions[$code][$index % count($descriptions[$code])],
                'requirements' => self::jobRequirements($index, $code),
            ]],
        )->all();
    }

    // ---------------------------------------------------------------------
    // Books
    // ---------------------------------------------------------------------

    /**
     * Deterministic, in-language book title for the pool index.
     */
    public static function bookTitle(int $index, string $code): string
    {
        $pool = match ($code) {
            'ps' => ['د پوهې کينډۍ', 'د ستورو ترشا', 'زموږ هېواد', 'د زده کړې رڼا', 'په خپل پoyo', 'د مېنو کتاب', 'د برياليتوب لار', 'د پخوانيو کيسې', 'د علم باغ', 'د فکر کونکي ذهن', 'د نوي سبا لپاره', 'د ځوان همت'],
            'fa_AF' => ['سنگر دانش', 'پشت ستاره‌ها', 'سرزمین ما', 'نور یادگیری', 'با پای‌های خود', 'کتاب زنان', 'راه موفقیت', 'قصه‌های کهن', 'باغ علم', 'ذهن متفکر', 'به سوی فردای نو', 'همّت جوان'],
            default => ['Foundations of Knowledge', 'Beyond the Stars', 'Our Homeland'],
        };

        return $pool[$index % count($pool)];
    }

    /**
     * Deterministic, in-language publisher name for the pool index.
     */
    public static function bookPublisher(int $index, string $code): string
    {
        $pool = match ($code) {
            'ps' => ['د ښوونځي خپرې', 'د پوهې کلتور', 'زموږ چاپخونه', 'د علم نشرات', 'د ښوونې خپرې', 'د هنر چاپ', 'د نوري لار', 'د کتاب دنيا'],
            'fa_AF' => ['انتشارات مکتب', 'فرهنگ دانش', 'چاپخانه ما', 'نشر علم', 'انتشارات تربیت', 'هنر چاپ', 'راه نور', 'دنیای کتاب'],
            default => ['School Press', 'Knowledge House'],
        };

        return $pool[$index % count($pool)];
    }

    /**
     * Deterministic, in-language book description for the pool index.
     */
    public static function bookDescription(int $index, string $code): string
    {
        $pool = match ($code) {
            'ps' => [
                'دا کتاب د زده کوونکو لپاره ګټور معلومات لري او زده کړه اسانه کوي.',
                'یوه ښه او زړه پورې تجربه چې لوستونکي نوي افقونو ته بوتلوي.',
                'په ساده ژبه کې ولیکل شوی چې هر لوستونکی یې پوهېدلی شي.',
                'د مهارتونو ودانیزه او عملي لارښود ځوانانو لپاره.',
            ],
            'fa_AF' => [
                'این کتاب معلومات مفید برای دانش‌آموزان دارد و یادگیری را آسان می‌کند.',
                'تجربه‌ای جذاب که خواننده را به افق‌های تازه می‌برد.',
                'به زبان ساده نوشته شده تا هر خواننده‌ای بتواند بفهمد.',
                'راهنمای عملی و ساختاریافته برای جوانان.',
            ],
            default => ['Useful material for learners that makes studying easier.'],
        };

        return $pool[$index % count($pool)];
    }

    /**
     * Localized (title, publisher, description) for a book, keyed by pool index.
     *
     * @return array<string, array<string, string>>
     */
    public static function bookSecondary(int $index): array
    {
        return collect(self::secondaryCodes())->mapWithKeys(
            static fn (string $code): array => [$code => [
                'title' => self::bookTitle($index, $code),
                'publisher' => self::bookPublisher($index, $code),
                'description' => self::bookDescription($index, $code),
            ]],
        )->all();
    }

    // ---------------------------------------------------------------------
    // Recognition (student / teacher / employee of the month)
    // ---------------------------------------------------------------------

    /**
     * Localized recognition type labels, keyed by the exact English label from
     * {@see \App\Enums\PostType::label()}.
     *
     * @return array<string, array<string, string>>
     */
    public static function recognitionLabels(): array
    {
        return [
            'Student of the Month' => ['ps' => 'د میاشتې زده‌کوونکی', 'fa_AF' => 'دانش‌آموز برتر ماه'],
            'Teacher of the Month' => ['ps' => 'د میاشتې ښوونکی', 'fa_AF' => 'معلم برتر ماه'],
            'Employee of the Month' => ['ps' => 'د میاشتې کارکوونکی', 'fa_AF' => 'کارمند برتر ماه'],
        ];
    }

    /**
     * A deterministic, in-language recognition caption naming the honoree.
     */
    public static function recognitionCaption(int $index, string $code, string $name): string
    {
        $pool = match ($code) {
            'ps' => [
                "{$name} د همت، نظم او بریالیتوب له امله د دې میاشتې لپاره ویاړل شول.",
                "زموږ ټوله ټلنې {$name} ته د هغه دې زحماتو ستاينه کوي.",
                "{$name} د خپلې ژمنتیا او سختې هڅې په ذریعه ټول ته نمونه شوه.",
            ],
            'fa_AF' => [
                "«{$name}» به دلیل پشتکار، نظم و موفقیت برای این ماه انتخاب شد.",
                "«{$name}» تمام جامعه ما را برای تلاش‌هایش به افتخار می‌آورد.",
                "«{$name}» با تعهد و کوشش پیوسته‌اش الگویی برای همه شد.",
            ],
            default => ["{$name} was recognized for outstanding effort this month."],
        };

        return $pool[$index % count($pool)];
    }

    /**
     * Secondary-language (title, content) for a recognition post, keyed by the
     * English type label and the honoree name. Returns [] when the label has no
     * glossary entry (so callers never write a half-filled translation row).
     *
     * @return array<string, array<string, string>>
     */
    public static function recognitionSecondary(string $englishLabel, string $name, int $index): array
    {
        $label = self::recognitionLabels()[$englishLabel] ?? null;

        if ($label === null) {
            return [];
        }

        return collect(self::secondaryCodes())->mapWithKeys(
            static fn (string $code): array => [$code => [
                'title' => $label[$code],
                'content' => self::recognitionCaption($index, $code, $name),
            ]],
        )->all();
    }

    // ---------------------------------------------------------------------
    // Home sections
    // ---------------------------------------------------------------------

    /**
     * Localized titles for the curated home sections, keyed by English title.
     *
     * @return array<string, array<string, string>>
     */
    public static function homeSectionTitles(): array
    {
        return [
            'Latest Articles' => ['ps' => 'وروستې لیکنې', 'fa_AF' => 'جدیدترین مقالات'],
            'Upcoming Events' => ['ps' => 'راتلونکې پېښې', 'fa_AF' => 'رویدادهای آینده'],
            'Recognition Highlights' => ['ps' => 'د ستاينې ټکي', 'fa_AF' => 'برگزیده‌های تقدیر'],
        ];
    }

    /**
     * Localized authored home-section copy, keyed by the English heading.
     *
     * @return array<string, array<string, string>>
     */
    public static function homeSectionAuthored(): array
    {
        return [
            'A Bright Future Starts Here' => [
                'ps' => ['heading' => 'روښانه راتلونکی دلته پیل کېږي', 'body' => 'زموږ پروګرامونه، راتلونکې پېښې او ویاړل شوي زده کوونکي په زما ښوونځي کې وګورئ.', 'cta_label' => 'پروګرامونه وڅېړئ'],
                'fa_AF' => ['heading' => 'آینده درخشان از اینجا آغاز می‌شود', 'body' => 'برنامه‌ها، رویدادهای پیش‌رو و دانش‌آموزان برجسته ما را در مکتب من کشف کنید.', 'cta_label' => 'بررسی برنامه‌ها'],
            ],
            'Admissions are now open' => [
                'ps' => ['heading' => 'داخېله اوس پرانه ده', 'body' => 'د نوي سمستر لپاره محدود ځايونه — خپل ماشوم نن ثبت کړئ.', 'cta_label' => 'اوس ثبت کړئ'],
                'fa_AF' => ['heading' => 'ثبت‌نام اکنون باز است', 'body' => 'ظرفیت محدود برای ترم جدید — همین امروز فرزند خود را ثبت‌نام کنید.', 'cta_label' => 'ثبت‌نام کنید'],
            ],
        ];
    }

    // ---------------------------------------------------------------------
    // Site pages
    // ---------------------------------------------------------------------

    /**
     * Localized page titles, keyed by the exact English title.
     *
     * @return array<string, array<string, string>>
     */
    public static function sitePageTitles(): array
    {
        return [
            'About My School' => ['ps' => 'د زما ښوونځي په اړه', 'fa_AF' => 'درباره مکتب من'],
            'Programs at My School' => ['ps' => 'د زما ښوونځي پروګرامونه', 'fa_AF' => 'برنامه‌های مکتب من'],
            'Contact My School' => ['ps' => 'د زما ښوونځي سره اړیکه', 'fa_AF' => 'تماس با مکتب من'],
        ];
    }

    /**
     * Secondary-language rows for a page title, ready for
     * {@see apply()}. Returns [] when the English title has no glossary entry.
     *
     * @return array<string, array<string, string>>
     */
    public static function sitePageSecondary(string $englishTitle): array
    {
        $entry = self::sitePageTitles()[$englishTitle] ?? null;

        if ($entry === null) {
            return [];
        }

        return collect(self::secondaryCodes())->mapWithKeys(
            static fn (string $code): array => [$code => ['title' => $entry[$code]]],
        )->all();
    }

    /**
     * Localized rich-text body for the About page (the English body lives in
     * {@see \Database\Seeders\AboutPageSeeder}).
     *
     * @return array<string, string>
     */
    public static function aboutPageBody(): array
    {
        return [
            'ps' => <<<'HTML'
                <p>زما ښوونځی په یوه ساده باور جوړ شوی: هر ماشوم داسې زده کړه غواړي چې هم بریالۍ او هم اصولو پورې تړلې وي. موږ سختدریډه بنسټیز نصاب د اخلاقو له ودانېدو سره یوځای کوو.</p>
                <p>اوس موږ بشپړ ښوونځی د درس تر څنګ د مازدیګر کورسونو او اونۍ پای مدرسې سره چلوو. زموږ کوچني ټولګي او ښوونکي خوندي او الهمة بخښونکی چاپېریال برابروي.</p>
                <p>موږ بریالیتوب یوازې د نمرو په اساس نه، بلکې د باوري ځوانانو په اساس اندازه کوو چې خپل اصول خپلو کورنیو او ټولنې ته بوتلوي.</p>
                HTML,
            'fa_AF' => <<<'HTML'
                <p>مکتب من بر باور ساده‌ای بنیان نهاده شد: هر کودکی شایسته آموزش هم ممتاز و هم ارزش‌مدار است. ما برنامه درسی مستحکم را با پرورش اخلاقی ترکیب می‌کنیم.</p>
                <p>امروز ما در کنار مکتب کامل، دوره‌های بعدازظهر و مدرسه آخر هفته را نیز برگزار می‌کنیم. صنف‌های کوچک و معلمان دلسوز ما محیطی امن و الهام‌بخش فراهم می‌سازند.</p>
                <p>ما موفقیت را نه تنها بر اساس نمرات، بلکه بر اساس جوانان با اعتمادبه‌نفسی که ارزش‌های خود را به خانواده و جامعه می‌برند اندازه‌گیری می‌کنیم.</p>
                HTML,
        ];
    }

    /**
     * Localized Site Settings content (hero copy, tagline, footer and the home
     * stats/features lists) mirroring the English defaults in
     * {@see \App\Models\SiteSetting::defaults()}. Neutral stat values and feature
     * icon keys are repeated per language; only the text differs.
     *
     * @return array<string, array<string, mixed>>
     */
    public static function siteSettingDefaults(): array
    {
        return [
            'ps' => [
                'tagline' => 'د کیفیت‌لرونکې زده‌کړې سره سبا جوړول',
                'home_title' => 'زما ښوونځی ته ښه راغلاست',
                'home_subtitle' => 'یو عصري افغان ښوونځی چې زده‌کوونکي پکې د باور، پوهې او شخصیت سره وده کوي.',
                'home_cta_primary' => 'پروګرامونه وګورئ',
                'home_cta_secondary' => 'زموږ سره اړیکه',
                'footer_text' => 'ټول حقونه خوندي دي.',
                'home_stats' => [
                    ['value' => '1,200+', 'label' => 'زده‌کوونکي'],
                    ['value' => '80+', 'label' => 'ښوونکي'],
                    ['value' => '25+', 'label' => 'کاله'],
                    ['value' => '40+', 'label' => 'مضامین'],
                ],
                'home_features' => [
                    ['icon' => 'faculty', 'title' => 'ښو کو ښوونکي', 'description' => 'تجربه‌لرونکي او ژمنه‌کار ښوونکي چې هر زده‌کوونکی لومړی ګڼي.'],
                    ['icon' => 'values', 'title' => 'ارزښت‌محوره زده‌کړه', 'description' => 'اخلاق، باور او ټولنه په ورځني نصاب کې ټولې شوې.'],
                    ['icon' => 'facilities', 'title' => 'عصري اسانتیاوې', 'description' => 'روښانه ټولګي، کتابتون او د متمرکزې زده‌کړې فضاګانې.'],
                    ['icon' => 'classes', 'title' => 'کوچني ټولګي', 'description' => 'د زده‌کوونکو او ښوونکو ټیټ نسبت چې څوک شاته پاتې نه‌شي.'],
                ],
            ],
            'fa_AF' => [
                'tagline' => 'ساختن فردا با آموزش باکیفیت',
                'home_title' => 'به مکتب من خوش آمدید',
                'home_subtitle' => 'یک مکتب افغانی مدرن که دانش‌آموزان را با اعتمادبه‌نفس، دانش و شخصیت پرورش می‌دهد.',
                'home_cta_primary' => 'دیدن برنامه‌ها',
                'home_cta_secondary' => 'تماس با ما',
                'footer_text' => 'تمام حقوق محفوظ است.',
                'home_stats' => [
                    ['value' => '1,200+', 'label' => 'دانش‌آموزان'],
                    ['value' => '80+', 'label' => 'معلمان'],
                    ['value' => '25+', 'label' => 'سال'],
                    ['value' => '40+', 'label' => 'مضامین'],
                ],
                'home_features' => [
                    ['icon' => 'faculty', 'title' => 'کادر شایسته', 'description' => 'معلمان باتجربه و متعهد که هر دانش‌آموز را در اولویت قرار می‌دهند.'],
                    ['icon' => 'values', 'title' => 'آموزش ارزش‌محور', 'description' => 'اخلاق، اعتمادبه‌نفس و جامعه در برنامه درسی روزانه.'],
                    ['icon' => 'facilities', 'title' => 'امکانات مدرن', 'description' => 'صنف‌های روشن، کتابخانه و فضاهای طراحی‌شده برای یادگیری.'],
                    ['icon' => 'classes', 'title' => 'صنف‌های کوچک', 'description' => 'نسبت کم دانش‌آموز به معلم تا هیچ‌کس عقب نماند.'],
                ],
            ],
        ];
    }
}

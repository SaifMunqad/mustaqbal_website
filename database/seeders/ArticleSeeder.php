<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Article;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Seeds a realistic, multilingual set of blog/news articles for the public
 * website.
 *
 * The mix spans Persian/Dari (fa_AF), Pashto (ps) and English (en), interleaved
 * so the list looks randomly distributed across the three languages. Each
 * article carries its content directly in its own language (the articles table
 * has no language column — the text itself is what is localized).
 *
 * Idempotent and non-destructive: every row is keyed by a stable slug derived
 * from an ASCII seed key, so re-running never duplicates articles and never
 * overwrites content an admin has already edited.
 */
class ArticleSeeder extends Seeder
{
    /**
     * Curated articles, each written in its own language.
     *
     * `key`  — ASCII slug base (stable across runs, language-independent).
     * `lang` — en | ps | fa_AF (informational; content is pre-localized).
     * `body` — two paragraphs joined with a blank line.
     *
     * @var list<array{key: string, lang: string, title: string, excerpt: string, body: string}>
     */
    private const ARTICLES = [
        [
            'key' => 'welcome-new-academic-year',
            'lang' => 'en',
            'title' => 'Welcome to a New Academic Year',
            'excerpt' => 'Our doors are open again. Here is what families can expect from My School this year.',
            'body' => "A new academic year is a fresh start for every learner. Teachers have prepared activity-based lesson plans, and our classrooms, library, and laboratories are ready for students.\n\n"
                ."We hope every student builds confidence, curiosity, and good character this year. Families are always welcome to reach out to us with questions and suggestions.",
        ],
        [
            'key' => 'rah-e-aghaz-e-sal-e-darasi',
            'lang' => 'fa_AF',
            'title' => 'آغاز سال جديد تحصيلي',
            'excerpt' => 'درهای مکتب دوباره باز شده است؛ آنچه خانواده‌ها از مکتب من در این سال انتظار دارند.',
            'body' => "سال جديد تحصيلي فرصتي دوباره براي هر شاګرد است. مکتب من با برنامه‌ريزي دقيق، آمادګي صنفونه، کتاب‌خانه و لابراتوار را براي شاګردان فراهم کرده است.\n\n"
                ."اميدوار يو که هر شاګرد در این سال اعتمادبه‌نفس، کنجکاوي و شخصيت نيكو پيدا کند؛ خانواده‌ها مي‌توانند هر پرسش خود را با ما در ميان بگذارند.",
        ],
        [
            'key' => 'kaw-naya-pa-tona-kal',
            'lang' => 'ps',
            'title' => 'د نوي ښوونیز کال پیل',
            'excerpt' => 'زموږ ښوونځي بېرته دروازه پرانه کړې ده — دلته هغه څه دي چې کورنۍ یې تمه کوي.',
            'body' => "نوی ښوونیز کال د هر زده کوونکي لپاره نوی پیل دی. ښوونکو د فعالیت پر بنسټ درسي پلانونه چمتو کړي، زموږ ټولګي، کتابتون او لابراتوار د زده کوونکو لپاره چمتوبه دی.\n\n"
                ."موږ هیله لرو چې هر زده کوونکی پدې کال کې ځان‌باوري، څېړندنه او ښه شخصیت ترلاسه کړي. کورنۍ تل زموږ سره د پوښتنو لپاره اړیکه ونیسي.",
        ],
        [
            'key' => 'importance-of-reading-habits',
            'lang' => 'en',
            'title' => 'Building Strong Reading Habits',
            'excerpt' => 'Reading every day transforms how students learn. Simple ways to make books a habit at home and school.',
            'body' => "Students who read daily grow their vocabulary, focus, and imagination faster than those who do not. A short reading routine before bed can change a child's whole year.\n\n"
                ."Parents can help by keeping books at home, visiting the library, and reading together. Even fifteen minutes a day makes a lasting difference.",
        ],
        [
            'key' => 'ahamiyet-e-khanedan',
            'lang' => 'fa_AF',
            'title' => 'اهميت عادت به مطالعه',
            'excerpt' => 'مطالعه هرروزه نحوه یادگیری شاګردان را متحول می‌سازد؛ روش‌های ساده براي کتاب‌خوانی.',
            'body' => "شاګردانی که هرروز مطالعه می‌کنند، واژګان، تمرکز و تخیلشان زودتر رشد می‌کند. یک برنامه کوتاه کتاب‌خوانی پیش از خواب می‌تواند تمام سال کودک را دگرگون سازد.\n\n"
                ."والدین مي‌توانند با نگه‌داشتن کتاب در خانه، مراجعه به کتاب‌خانه و مطالعه دسته‌جمعی کمک کنند. حتی پانزده دقیقه در روز تأثير پائدار دارد.",
        ],
        [
            'key' => 'ahamiyat-e-lostala-cado',
            'lang' => 'ps',
            'title' => 'د لوستلو د عادت اهمیت',
            'excerpt' => 'هرورځي لوستل د زده کوونکو د زده کړې ډول بدلوي؛ په کور او ښوونځي کې د کتاب لوستلو ساده لارې.',
            'body' => "هغه زده کوونکي چې هرورځي لوي، د دوی تکیه کلمات، تمرکز او خیال د نورو په پرتله ګړندی وده کوي. د خوب مخکې لنډ لوستل کولای شي د یو ماشوم ټول کال بدل کړي.\n\n"
                ."مورنګه کولای شي په کور کې د کتابونو ساتلو، کتابتون ته تګ او ګډ لوستلو سره مره وکړي. حتی په ورځ کې پنځلس دقیقې دوامداره اغېزه لري.",
        ],
        [
            'key' => 'stem-learning-for-youth',
            'lang' => 'en',
            'title' => 'Encouraging STEM Learning Among Youth',
            'excerpt' => 'Science, technology, engineering and math open doors to the future. How we make STEM exciting for students.',
            'body' => "STEM subjects teach students to think logically and solve real problems. Through experiments, robotics clubs, and math games, we turn abstract ideas into hands-on learning.\n\n"
                ."When students see that science is something they can touch and test, their confidence and interest grow — and so does their readiness for the future.",
        ],
        [
            'key' => 'yadgiri-STEM-baraye-javanan',
            'lang' => 'fa_AF',
            'title' => 'تشويق یادگیری علوم و تکنالوژي براي نوجوانان',
            'excerpt' => 'علوم، تکنالوژي، انجنیري و ریاضي درهایی به سوی آینده می‌گشاید؛ چگونه STEM را هیجان‌انگیز می‌سازیم.',
            'body' => "درود STEM به شاګردان می‌آموزد که منطقي بیندیشند و مسایل واقعی را حل کنند. از طریق تجربه‌ها، کلاب رباتیک و بازی‌های ریاضي، ایده‌های تجریدی را به زده کړې عملي تبدیل می‌کنیم.\n\n"
                ."وقتی شاګردان ببینند که علوم چیزی است که مي‌توانند لمس و ازازیه کنند، اعتمادبه‌نفس و علاقه‌شان رشد می‌کند — و آمادګي شان هم براي آینده.",
        ],
        [
            'key' => 'STEM-zda-kra-teenagano-lpare',
            'lang' => 'ps',
            'title' => 'د ځوانانو لپاره د STEM د زده کړې هڅول',
            'excerpt' => 'علوم، ټیکنالوژي، انجنیري او ریاضي د راتلونکي دروازې خلاصوي؛ څنګه STEM زده کوونکو ته خوښ کړو.',
            'body' => "STEM موضوعات زده کوونکو ته زده کوي چې منطقي فکر وکړي او حقيقي ستونزې حل کړي. د تجربو، د رباتیک ګروپونو او د ریاضي د لوبو له لارې، موږ نظري مفکورې عملي زده کړې ته اړوو.\n\n"
                ."کله چې زده کوونکي وګوري چې علوم هڅه دي چې دوی یې لمس او ازمویل کولای شي، د دوی ځان‌باوري او مینه وده کوي — او د راتلونکي لپاره د دوی چمتووالی هم.",
        ],
        [
            'key' => 'supporting-student-well-being',
            'lang' => 'en',
            'title' => 'Supporting Student Well-being',
            'excerpt' => 'A healthy mind supports good learning. Our approach to care, balance, and emotional safety at school.',
            'body' => "Learning flourishes when students feel safe and supported. Our teachers listen, encourage open conversation, and watch for signs of stress or fatigue.\n\n"
                ."Balanced homework, rest, sports, and time with friends are part of education too. We want every student to grow healthy in body and mind.",
        ],
        [
            'key' => 'poshtibani-az-salamat-e-rouni-shagirdan',
            'lang' => 'fa_AF',
            'title' => 'حمایت از سلامت روان شاګردان',
            'excerpt' => 'ذهن سالم از یادگیری خوب پشتیباني می‌کند؛ رویکرد ما به مراقبت و تعادل در مکتب.',
            'body' => "وقتی شاګردان احساس امنیت و حمایت کنند، زده کړه شکوفا می‌شود. مکتبان ما گوش می‌دهند، گفت‌وگوی آزاد را تشویق می‌کنند و نشانه‌های تنش و خستگی را زیر نظر دارند.\n\n"
                ."تکالیف متعادل، استراحت، ورزش و وقت با دوستان نیز بخشی از تعلیم است. ما مي‌خواهیم هر شاګرد از لحاظ جسم و روان سالم رشد کند.",
        ],
        [
            'key' => 'taidal-ri-zhtona-de-zda-koonki',
            'lang' => 'ps',
            'title' => 'د زده کوونکو د روحي صحي ملاتړ',
            'excerpt' => 'روان روغ زده کړه ته مره کوي؛ زموږ پاملاینه، تعادل او په ښوونځي کې د احساساتو خونديتوب.',
            'body' => "کله چې زده کوونکي خوندي او ملاتړ وي، زده کړه ګل کوي. زموږ ښوونکي غوږ نیسي، خلاصې خبرې هڅوي او د تنش او ستړیا نښې څاري.\n\n"
                ."متوازنه کورنۍ دندې، آرامتیا، لوبې او د ملګرو سره وخت هم د زده کړې برخه ده. موږ غواړو هر زده کوونکی په بدن او روان کې روغ لوېږي.",
        ],
        [
            'key' => 'keeping-students-safe-online',
            'lang' => 'en',
            'title' => 'Keeping Students Safe Online',
            'excerpt' => 'The internet is a powerful tool, but it needs care. Guidance for students and parents on digital safety.',
            'body' => "Online learning and play bring great opportunities and real risks. We teach students to protect their passwords, think before sharing, and recognize unreliable information.\n\n"
                ."Parents can set clear screen-time rules and keep the conversation open. A safe digital habit today protects a student tomorrow.",
        ],
        [
            'key' => 'amniate-shagirdan-dar-fazaye-interneti',
            'lang' => 'fa_AF',
            'title' => 'امنیت شاګردان در فضای انترنتي',
            'excerpt' => 'انترنت ابزار قدرتمندي است، اما توجه نیاز دارد؛ راهنمایی براي شاګردان و والدین درباره امنیت دیجیتال.',
            'body' => "یادگیری و بازی انترنتي فرصت‌های بزرګ و خطرات واقعی می‌آورد. ما به شاګردان می‌آموزیم که رمزهای خود را حفظ کنند، پیش از اشتراک فکر کنند و اطلاعات ناعبار را تشخیص دهند.\n\n"
                ."والدین مي‌توانند قوانین واضح براي استفاده از پرده وضع کنند و گفت‌وگو را باز نگه دارند. یک عادت دیجیتال امن امروز، از شاګرد در آینده حفاظت می‌کند.",
        ],
        [
            'key' => 'online-kuna-de-zda-koonki-salamatai',
            'lang' => 'ps',
            'title' => 'په انټرنټ کې د زده کوونکو خونديتوب',
            'excerpt' => 'انټرنټ پیاوړی وسیله ده، مګر پاملاینې ته اړتیا لري؛ د زده کوونکو او مورنګو لپاره ډیجیټل لارښود.',
            'body' => "آنلاین زده کړه او لوبې لویې چانسونه او حقيقي ستونزې راولي. موږ زده کوونکو ته زده کوو چې خپل پټ‌نومونه وساتي، د شریکولو مخکې فکر وکړي او ناعتمادې معلومات وپېژني.\n\n"
                ."مورنګه کولای شي د پردې لپاره روڼ قواعد وټاکي او خبرې خلاصې وساتي. نن یو خوندي ډیجیټل عادت راتلونکي کې د زده کوونکي څخه ساتنه کوي.",
        ],
        [
            'key' => 'the-value-of-community-service',
            'lang' => 'en',
            'title' => 'The Value of Community Service',
            'excerpt' => 'Learning extends beyond the classroom. How serving others shapes responsible, empathetic students.',
            'body' => "When students help their community — cleaning public spaces, visiting the elderly, supporting neighbors — they learn responsibility and compassion in ways no lesson can teach.\n\n"
                ."Service builds humility and pride at the same time. It prepares young people to become caring, active members of society.",
        ],
        [
            'key' => 'arzesh-e-khadamat-bara-jamia',
            'lang' => 'fa_AF',
            'title' => 'ارزښت خدمات به جامعه',
            'excerpt' => 'یادگیری فراتر از صنف درس ادامه دارد؛ چگونه خدمت به دیگران شاګردان مسئول و همدل می‌سازد.',
            'body' => "وقتی شاګردان به جامعه کمک می‌کنند — پاک‌کردن مکان‌های عمومی، دیدار از بزرګسالان، پشتیباني از همسایه‌ها — مسئولیت و رحم را به شیوه‌ای می‌آموزند که هیچ درسی قادر به آموزش آن نیست.\n\n"
                ."خدمت همزمان فروتني و افتخار می‌سازد. این کار جوانان را براي عضو دلسوز و فعال جامعه بودن آماده می‌کند.",
        ],
        [
            'key' => 'de-tolani-khadamo-qadr',
            'lang' => 'ps',
            'title' => 'د ټولنیزو خدمتونو ارزښت',
            'excerpt' => 'زده کړه د ټولګي څخه بهر دوام لري؛ نورو ته خدمت څنګه مسؤول او خواخوږه زده کوونکي جوړوي.',
            'body' => "کله چې زده کوونکي خپلې ټولنې ته مره کوي — عامي ځایونه پاکول، مشرانو ته تلل، ګاونډیو ملاتړ — دوی مسؤولیت او مهرباني په داسې ډول زده کوي چې هیڅ درس یې زده کولای نشي.\n\n"
                ."خدمت په یو وخت کې پستوبیا او ویاړ راولي. دا کار ځوانان د ټولنې د مینه‌مند او فعال غړي تګ لپاره چمتو کوي.",
        ],
        [
            'key' => 'preparing-for-exams-with-confidence',
            'lang' => 'en',
            'title' => 'Preparing for Exams with Confidence',
            'excerpt' => 'Good preparation beats last-minute stress. Practical study habits that help students do their best.',
            'body' => "Confidence on exam day comes from steady preparation. We encourage students to review a little each day, take practice tests, and ask teachers for help early.\n\n"
                ."Sleep, nutrition, and calm matter as much as studying. A rested, prepared mind performs far better than a tired, worried one.",
        ],
        [
            'key' => 'amade-shavi-baraye-emtehanat',
            'lang' => 'fa_AF',
            'title' => 'آمادګي با اعتمادبه‌نفس براي امتحانات',
            'excerpt' => 'آمادګي نيكو از تنش لحظه آخری بهتر است؛ عادت‌های مطالعه‌اي که به شاګردان کمک می‌کند.',
            'body' => "اعتمادبه‌نفس در روز امتحان از آمادګي پيوسته می‌آید. ما شاګردان را تشویق می‌کنیم که هرروز کمی مرور کنند، از آزمون‌های تمریني استفاده کنند و زودتر از مکتبان کمک بخواهند.\n\n"
                ."خواب، تغذیه و آرامش به اندازه مطالعه اهمیت دارد. ذهن سرحال و آماده بسیار بهتر از ذهن خسته و مضطرب عمل می‌کند.",
        ],
        [
            'key' => 'd-imtihanano-lpare-ba-baor-chmatona',
            'lang' => 'ps',
            'title' => 'د امتحاناتو لپاره د باور سره چمتووالی',
            'excerpt' => 'ښه چمتووالی د وروستي دقیقو له فشار ښه دی؛ عملي د زده کړې عادتونه چې زده کوونکو ته مره کوي.',
            'body' => "د امتحان په ورځ باور د دوامداره چمتووالې څخه راځي. موږ زده کوونکي هڅوو چې هرورځي لږ بیاکتنه وکړي، پیل امتحان ورکړي او ژر ژر ښوونکو ته د مرستې غوښتنه وکړي.\n\n"
                ."خوب، غذا او آرامتیا د زده کړې په اندازه اهمیت لري. آرام او چمتو ذهن د ستړي او اندېښمن ذهن په پرتله ډېر ښه کار کوي.",
        ],
        [
            'key' => 'celebrating-student-achievement',
            'lang' => 'en',
            'title' => 'Celebrating Student Achievement',
            'excerpt' => 'Every success deserves recognition. How we honor effort and excellence across our school.',
            'body' => "Recognizing achievement motivates students to keep growing. From certificates to public praise, we celebrate not only top grades but also effort, kindness, and improvement.\n\n"
                ."When hard work is seen and valued, students learn that dedication leads to results — a lesson that lasts a lifetime.",
        ],
        [
            'key' => 'jashn-e-movafaghiyat-haye-shagirdan',
            'lang' => 'fa_AF',
            'title' => 'جشن موفقیت‌های شاګردان',
            'excerpt' => 'هر موفقيت سزاوار قدردانی است؛ نحوه تکریم تلاش و تعالي در سراسر مکتب.',
            'body' => "قدردانی از موفقیت، شاګردان را به رشد بیشتر تشویق می‌کند. از گواهینامه تا ستایش عمومی، ما تنها نمرات برتر را نه، بلکه تلاش، نیکی و پیشرفت را جشن می‌گیریم.\n\n"
                ."وقتی کار سخت دیده و قدر شود، شاګردان می‌آموزند که تعهد به نتیجه مي‌رسد — درسی که تا پایان عمر باقی می‌ماند.",
        ],
        [
            'key' => 'de-zda-koonki-d-bryavo-lmanjhn',
            'lang' => 'ps',
            'title' => 'د زده کوونکو د بریاوو لمانځنه',
            'excerpt' => 'هره بریا درناوي غواړي؛ موږ څنګه په ټول ښوونځي کې هڅه او غوره والی ومنو.',
            'body' => "د بریا منل زده کوونکي نورې ودې ته هڅوي. له تصديق څخه تر عامه ستاينې پورې، موږ یوازې لوړې نمرې نه، بلکې هڅه، مهرباني او پرمختګ لمانځو.\n\n"
                ."کله چې سخته کار لیدل او قدر شي، زده کوونکي زده کوي چې ایستوار په پایلې لار بندي کوي — هغه درس چې د عمر لپاره پاتې کیږي.",
        ],
        [
            'key' => 'the-role-of-parents-in-education',
            'lang' => 'en',
            'title' => 'The Role of Parents in Education',
            'excerpt' => 'Education is a partnership. Why families and teachers achieve more when they work together.',
            'body' => "Students do best when home and school pull in the same direction. Parents who ask about the day, attend meetings, and encourage study give their children a strong advantage.\n\n"
                ."We welcome families as partners. Together, teachers and parents shape learners who are confident, capable, and curious.",
        ],
        [
            'key' => 'naghsh-e-valdein-dar-talim',
            'lang' => 'fa_AF',
            'title' => 'نقش والدین در تعلیم',
            'excerpt' => 'تعلیم یک شراکت است؛ چرا خانواده‌ها و مکتبان وقتی باهم کار کنند بیشتر موفق می‌شوند.',
            'body' => "شاګردان زمانی بهترین نتیجه را مي‌دهند که خانه و مکتب یک جهت داشته باشند. والدینی که درباره روز می‌پرسند، در جلسات شرکت می‌کنند و مطالعه را تشویق می‌کنند، به فرزندان خود برتری قوی مي‌دهند.\n\n"
                ."ما خانواده‌ها را به عنوان شریک قبول می‌کنیم. مکتبان و والدین باهم، یادگیرندگانی با اعتمادبه‌نفس، توانا و کنجکاو تربیت می‌کنند.",
        ],
        [
            'key' => 'da-morenge-naqasha-pa-talimo-kai',
            'lang' => 'ps',
            'title' => 'په تعلیم کې د مورنګو ونډه',
            'excerpt' => 'تعلیم یو شراکت دی؛ ولې کورنۍ او ښوونکي کله چې ګډ کار کوي ډېر بریالي کیږي.',
            'body' => "زده کوونکي هغه وخت ښه پایله ورکوي چې کور او ښوونځی یوه لوري ته وي. هغه مورنګه چې د ورځې په اړه پوښتنې کوي، غونډو ته ځي او لوستل هڅوي، خپلو ماشومانو ته پیاوړې ګټه رسوي.\n\n"
                ."موږ کورنۍ د شریک په توګه منو. ښوونکي او مورنګه ګډ ځان‌باوره، وړ او څېړندنه زده کوونکي روزي.",
        ],
        [
            'key' => 'building-a-love-for-learning',
            'lang' => 'en',
            'title' => 'Building a Lifelong Love for Learning',
            'excerpt' => 'Beyond grades lies curiosity. Our goal is to help students love learning for its own sake.',
            'body' => "Marks measure memory, but curiosity drives a lifetime of growth. We design lessons that invite questions, exploration, and discovery so students enjoy the process of learning itself.\n\n"
                ."A student who loves to learn never stops growing. That love is the greatest gift a school can give.",
        ],
    ];

    public function run(): void
    {
        $author = $this->resolveAuthor();
        $total = count(self::ARTICLES);
        $created = 0;

        foreach (self::ARTICLES as $index => $entry) {
            $slug = \Illuminate\Support\Str::slug($entry['key']);

            // Idempotent + non-destructive: create only when the slug is new,
            // leaving any admin-edited article untouched on re-runs.
            if (Article::query()->where('slug', $slug)->exists()) {
                continue;
            }

            $this->createArticle($author, $entry, $index, $total);
            $created++;
        }

        $this->command?->info("ArticleSeeder: {$created} created, ".($total - $created).' already present.');
    }

    /**
     * @param  array{key: string, lang: string, title: string, excerpt: string, body: string}  $entry
     */
    private function createArticle(User $author, array $entry, int $index, int $total): void
    {
        // Spread publish dates across the last six months, oldest first, so the
        // public article list has a natural ordering.
        $publishedAt = Carbon::now()
            ->subMonthsNoOverflow(6)
            ->addDays((int) floor($index * 180 / max(1, $total)));

        Article::factory()
            ->forSeedKey($entry['key'])
            ->create([
                'user_id' => $author->id,
                'title' => $entry['title'],
                'excerpt' => $entry['excerpt'],
                'body' => $entry['body'],
                'published_at' => $publishedAt,
                'is_published' => true,
            ]);
    }

    /**
     * A management user to attribute seeded articles to, reused across rows.
     */
    private function resolveAuthor(): User
    {
        return User::query()->firstOrCreate(
            ['email' => 'content@example.com'],
            [
                'name' => 'Content Editor',
                'role' => UserRole::Management->value,
                'password' => 'password',
                'email_verified_at' => now(),
            ],
        );
    }
}

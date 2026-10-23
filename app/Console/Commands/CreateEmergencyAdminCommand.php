<?php

namespace App\Console\Commands;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

class CreateEmergencyAdminCommand extends Command
{
    /**
     * @var string
     */
    protected $signature = 'admin:emergency
        {--email= : Email for the account (generated when omitted)}
        {--name= : Display name for the account (generated when omitted)}
        {--password= : Password for the account (generated when omitted)}
        {--role=admin : Role to assign (admin, management, teacher, family)}
        {--force : Skip the confirmation prompt}';

    /**
     * @var string
     */
    protected $description = 'Emergency access recovery: create an admin account with usable, copy-paste credentials';

    /**
     * Last-resort way to regain access to the admin area (e.g. the configured
     * SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD account is lost or locked out).
     * Any option left out is generated with faker — Indonesian names and
     * random@random-style values are avoided on purpose — and everything is
     * printed in a table at the end so the credentials can be copied directly.
     */
    public function handle(): int
    {
        $role = UserRole::tryFrom((string) $this->option('role'));

        if ($role === null) {
            $this->error("Invalid role [{$this->option('role')}]. Valid roles: " . implode(', ', UserRole::values()) . '.');

            return self::FAILURE;
        }

        $faker = $this->makeFaker();

        $name = (string) ($this->option('name') ?: $faker->name());
        $email = strtolower((string) ($this->option('email') ?: $faker->unique()->safeEmail()));
        $password = (string) ($this->option('password') ?: $this->generatePassword($faker));
        $generatedPassword = $this->option('password') === null;

        $errors = $this->validateCredentials($name, $email, $password);

        if ($errors !== []) {
            foreach ($errors as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        if (User::where('email', $email)->exists()) {
            $this->error("A user with email [{$email}] already exists. The emergency command never overwrites existing accounts.");

            return self::FAILURE;
        }

        $this->components->warn('This creates an account with privileged access. Use it only for emergency recovery, then change its password.');

        if (! $this->option('force') && ! $this->confirm('Create this account?', true)) {
            $this->info('Aborted. No account was created.');

            return self::SUCCESS;
        }

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'role' => $role->value,
            'password' => $password,
        ]);

        $user->forceFill(['email_verified_at' => now()])->save();

        $this->components->info("Emergency {$role->label()} account created (ID: {$user->id}).");

        $this->table(
            ['Field', 'Value'],
            [
                ['name', $name],
                ['email', $email],
                ['password', $password],
                ['role', $role->value],
            ],
        );

        if ($generatedPassword) {
            $this->line('  <options=bold>Note:</> the password above was generated automatically.');
        }

        $this->components->warn('Security note: delete this account or change its password as soon as normal access is restored.');

        return self::SUCCESS;
    }

    /**
     * A locale-appropriate faker instance so generated names/emails read like
     * real users of this site rather than generic "John Doe / random@random".
     */
    protected function makeFaker(): \Faker\Generator
    {
        $generator = \Faker\Factory::create((string) config('app.faker_locale', 'en_US'));

        // Guard against pathological locales where even safeEmail collisions
        // with existing users are possible within one run.
        $generator->unique(true);

        return $generator;
    }

    /**
     * A memorizable-but-strong password: two random words + digits + symbol,
     * e.g. "CobaltOtter42!".
     */
    protected function generatePassword(\Faker\Generator $faker): string
    {
        $words = $faker->words(3, true);

        return ucfirst(array_shift($words))
            . ucfirst(array_shift($words))
            . $faker->numberBetween(10, 99)
            . '!';
    }

    /**
     * Validate the credentials with the same rules the app uses elsewhere
     * (Fortify's Password::default) so the account is always usable.
     *
     * @return array<int, string>
     */
    protected function validateCredentials(string $name, string $email, string $password): array
    {
        $validator = Validator::make(
            ['name' => $name, 'email' => $email, 'password' => $password],
            [
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'string', 'email:rfc', 'max:255'],
                'password' => ['required', 'string', Password::default()],
            ],
        );

        return $validator->fails() ? $validator->errors()->all() : [];
    }
}

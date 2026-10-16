<?php

namespace App\Console\Commands;

use App\Support\Admin\EnsureAdminAccount;
use Illuminate\Console\Command;

class EnsureAdminCommand extends Command
{
    /**
     * @var string
     */
    protected $signature = 'admin:ensure';

    /**
     * @var string
     */
    protected $description = 'Create the configured admin account now if it does not already exist';

    /**
     * Manually ensure the admin account exists, using the same safe logic the
     * application runs on boot. Useful right after editing SEED_ADMIN_EMAIL /
     * SEED_ADMIN_PASSWORD, or when ADMIN_AUTO_ENSURE is disabled.
     */
    public function handle(): int
    {
        $admin = EnsureAdminAccount::handle(force: true);

        if ($admin === null) {
            $this->warn('Admin account was not created: SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD are not configured, or the users table is not available yet.');

            return self::FAILURE;
        }

        $this->info("Admin account is ready: {$admin->email}");

        return self::SUCCESS;
    }
}

<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Admin Account
    |--------------------------------------------------------------------------
    |
    | When "auto_ensure" is enabled, the application guarantees that an admin
    | user exists on boot without running any database seeder. The account is
    | created with firstOrCreate, so it is only ever inserted when missing and
    | an admin who later changes their name or password is never overwritten.
    | If the account is deleted it will be re-created on the next boot.
    |
    | Credentials are sourced from the environment only, so no secret is
    | committed to the repository. Leave SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD
    | empty to disable automatic creation entirely.
    |
    */

    'auto_ensure' => env('ADMIN_AUTO_ENSURE', true),

    'email' => env('SEED_ADMIN_EMAIL'),

    'password' => env('SEED_ADMIN_PASSWORD'),

    'name' => env('SEED_ADMIN_NAME', 'Site Admin'),

];

<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Page Builder
    |--------------------------------------------------------------------------
    |
    | The normalized page builder (pages / page_sections / section_* stores)
    | runs alongside the legacy home_sections pipeline during the transition.
    | Flip BUILDER_HOME_ENABLED to render the public home page from the new
    | builder once its content has been backfilled; leave it off to fall back to
    | the legacy layout. A rollback is just an env change — no code revert.
    |
    */

    'home_enabled' => env('BUILDER_HOME_ENABLED', false),

];

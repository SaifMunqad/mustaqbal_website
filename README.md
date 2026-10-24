# My School Website - Community Module

This project now includes:

- Global navigation config (`resources/js/lib/navigation.ts`)
- Frontend i18n with `en`, `ps`, `fa_AF`, `ar`
- Language-based font switching (`Product Sans` for English, `Rubik` for Arabic-script languages)
- School community backend (posts, comments, likes, contacts, enrollments, conversations, messages)
- Role-based accounts (`family`, `teacher`, `management`)
- Database-driven public pages (`about`, `programs`, `contact`, `articles`)
- Management dashboard forms for articles/programs/site pages

## Quick Start

```bash
composer install
npm install
php artisan migrate
php artisan db:seed
npm run types
php artisan test
```

## Key Routes

- Public school pages: `/school/about`, `/school/programs`, `/school/contact`, `/school/articles`
- Enrollment pages: `/school/enroll`, `/school/enroll/resend-email`
- Dashboard: `GET /dashboard` (management can create/update content)
- Dashboard modules:
  - `/dashboard/articles` (list/create/edit)
  - `/dashboard/posts` (list/create/edit)
  - `/dashboard/contacts` (list/create/edit)
  - `/dashboard/messages` (list/create/edit)
  - `/dashboard/programs` (list/create/edit)
  - `/dashboard/site-pages` (list/create/edit)

- Public feed: `GET /community/posts`
- Public contact: `POST /community/contact`
- Enrollment submit: `POST /community/enrollments`
- Enrollment resend email: `POST /community/enrollments/resend-email`
- Auth feed actions: comments/likes/posts under `/community/*`
- Messaging: `/community/conversations` and `/community/conversations/{conversation}/messages`

## Notes

- Guest users can only read public content (`news`, `jobs`, `events`).
- Teachers can publish achievements and top students.
- Management can publish news, jobs, and events.
- Queries are eager loaded in controllers using `with()`, `withCount()`, and `load()`.

## License

My School Website is free software: you can redistribute it and/or modify it under the terms of the
GNU General Public License as published by the Free Software Foundation, either version 2 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
[GNU General Public License](LICENSE) for more details.

Copyright (C) 2026 saifmunqad <saifullahparhizgar@gmail.com>

The full license text is in [LICENSE](LICENSE). The SPDX identifier for this project is
`GPL-2.0-or-later`.

### Third-party components

This project links against third-party libraries whose licenses are compatible with the GPL:

- Laravel, Inertia.js, React and most npm/composer dependencies: MIT
- `ezyang/htmlpurifier` (via `stevebauman/purify`): LGPL-2.1-or-later
- `nette/schema` and `nette/utils`: BSD-3-Clause (also offered under GPL-2.0-only / GPL-3.0-only)
- `jszip`: MIT (also offered under GPL-3.0-or-later)

Those components stay under their own licenses; this repository's GPL notice applies to the
code of this project.

### Contributing

By submitting a pull request, patch or any other contribution to this repository you agree to
license your contribution under `GPL-2.0-or-later` (inbound = outbound), and you confirm that you
have the right to do so.


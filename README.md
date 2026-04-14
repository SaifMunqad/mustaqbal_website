# Mustaqbal Website - Community Module

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


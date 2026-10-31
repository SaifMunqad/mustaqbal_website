<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\StoreContactRequest;
use App\Http\Requests\Dashboard\UpdateContactRequest;
use App\Models\Contact;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DashboardContactController extends Controller
{
    public function index(): Response
    {
        $contacts = Contact::query()->latest()->paginate(20);

        return Inertia::render('dashboard/contacts/dashboard-contacts-index', [
            'contacts' => $contacts,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('dashboard/contacts/dashboard-contacts-create');
    }

    public function store(StoreContactRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        Contact::query()->create($validated);

        return redirect()
            ->route('dashboard.contacts.index')
            ->with('success', 'flash.contactCreated');
    }

    public function edit(Contact $contact): Response
    {
        return Inertia::render('dashboard/contacts/dashboard-contacts-edit', [
            'contact' => $contact,
        ]);
    }

    public function update(UpdateContactRequest $request, Contact $contact): RedirectResponse
    {
        $validated = $request->validated();

        $contact->update($validated);

        return redirect()
            ->route('dashboard.contacts.index')
            ->with('success', 'flash.contactUpdated');
    }
}

<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardContactController extends Controller
{
    public function index(): Response
    {
        $contacts = Contact::query()->latest()->paginate(20);

        return Inertia::render('dashboard/contacts/index', [
            'contacts' => $contacts,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('dashboard/contacts/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'subject' => ['nullable', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        Contact::query()->create($validated);

        return redirect()
            ->route('dashboard.contacts.index')
            ->with('toast', ['variant' => 'success', 'title' => 'Contact created successfully.']);
    }

    public function edit(Contact $contact): Response
    {
        return Inertia::render('dashboard/contacts/edit', [
            'contact' => $contact,
        ]);
    }

    public function update(Request $request, Contact $contact): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'subject' => ['nullable', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
            'resolved_at' => ['nullable', 'date'],
        ]);

        $contact->update($validated);

        return redirect()
            ->route('dashboard.contacts.index')
            ->with('toast', ['variant' => 'success', 'title' => 'Contact updated successfully.']);
    }
}


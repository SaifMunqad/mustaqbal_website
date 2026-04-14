<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreContactRequest;
use App\Models\Contact;
use Illuminate\Http\JsonResponse;

class ContactController extends Controller
{
    public function store(StoreContactRequest $request): JsonResponse
    {
        $contact = Contact::query()->create($request->validated());

        return response()->json([
            'id' => $contact->id,
            'message' => 'Contact request received successfully.',
        ], 201);
    }
}


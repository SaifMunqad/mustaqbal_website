<?php

namespace App\Http\Requests\Dashboard;

class UpdateEventRequest extends StoreEventRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('event')) ?? false;
    }
}

<?php

namespace App\Http\Requests\Dashboard;

class UpdateArticleRequest extends StoreArticleRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('article')) ?? false;
    }
}

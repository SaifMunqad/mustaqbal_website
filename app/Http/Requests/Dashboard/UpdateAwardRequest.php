<?php

namespace App\Http\Requests\Dashboard;

use App\Models\Award;

class UpdateAwardRequest extends StoreAwardRequest
{
    /**
     * Ignore the row being updated so the unique-pair check does not collide with
     * the award's own stored value.
     *
     * @return list<\Illuminate\Validation\Rules\Unique>
     */
    protected function pairRules(): array
    {
        /** @var Award $award */
        $award = $this->route('award');

        $rules = parent::pairRules();
        $rules[0]->ignore($award->getKey());

        return $rules;
    }
}

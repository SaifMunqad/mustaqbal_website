<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Award extends Model
{
    use HasFactory;

    /**
     * Codes are language-neutral and come from the issuing school's own
     * numbering scheme, so nothing here is translated.
     */
    protected $fillable = [
        'person_id',
        'award_id',
        'full_name',
        'father_name',
        'awarded_at',
    ];

    protected function casts(): array
    {
        return [
            'awarded_at' => 'date',
        ];
    }

    /**
     * Exact match on the two verification codes. Codes imported from
     * spreadsheets often carry stray whitespace, so both sides are trimmed.
     */
    public function scopeForPair(Builder $query, ?string $personId, ?string $awardId): Builder
    {
        $personId = trim((string) $personId);
        $awardId = trim((string) $awardId);

        if ($personId === '' || $awardId === '') {
            return $query->whereRaw('1 = 0');
        }

        return $query->where('person_id', $personId)->where('award_id', $awardId);
    }

    /**
     * Dashboard search across both codes and the holder's name.
     */
    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        $term = trim((string) $term);

        if ($term === '') {
            return $query;
        }

        return $query->where(function (Builder $inner) use ($term): void {
            $inner->where('person_id', 'like', "%{$term}%")
                ->orWhere('award_id', 'like', "%{$term}%")
                ->orWhere('full_name', 'like', "%{$term}%")
                ->orWhere('father_name', 'like', "%{$term}%");
        });
    }

    /**
     * Minimal public payload: only what is printed on the certificate itself.
     *
     * @return array<string, string|null>
     */
    public function toVerificationPayload(): array
    {
        return [
            'person_id' => $this->person_id,
            'award_id' => $this->award_id,
            'full_name' => $this->full_name,
            'father_name' => $this->father_name,
            'awarded_at' => $this->awarded_at?->toDateString(),
        ];
    }

    /**
     * Dashboard row payload.
     *
     * @return array<string, mixed>
     */
    public function toRow(): array
    {
        return [
            'id' => $this->id,
            'person_id' => $this->person_id,
            'award_id' => $this->award_id,
            'full_name' => $this->full_name,
            'father_name' => $this->father_name,
            'awarded_at' => $this->awarded_at?->toDateString(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}

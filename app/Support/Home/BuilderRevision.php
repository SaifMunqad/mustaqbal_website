<?php

declare(strict_types=1);

namespace App\Support\Home;

use App\Models\PageSection;

/**
 * A cheap content stamp for one builder page, used as an optimistic lock.
 *
 * The fingerprint changes whenever any block is added, removed, re-edited or
 * renumbered, so a writer that read the layout first can detect that someone
 * else (a human in the visual editor, another agent) committed in the meantime
 * instead of silently overwriting their work. `PageLayoutWriter` stays the only
 * place that writes; this class only observes.
 */
class BuilderRevision
{
    public static function for(int $pageId): string
    {
        $fingerprint = PageSection::query()
            ->where('page_id', $pageId)
            ->orderBy('id')
            ->get(['id', 'sort_order', 'updated_at'])
            ->map(fn (PageSection $section): string => $section->id.'|'.$section->sort_order.'|'.$section->updated_at?->timestamp)
            ->implode(';');

        return md5($fingerprint);
    }
}

/**
 * Renders one stored page-builder icon key.
 *
 * Social (`social:…`) and legacy keys resolve statically, so they paint
 * immediately everywhere. Heroicon keys (`h:…`, `solid:h:…`) live in a lazy
 * generated chunk that public pages only fetch when a block actually uses
 * one: while that chunk is still loading the icon renders its friendly
 * fallback, then upgrades to the real glyph via the catalog subscription —
 * one post-hydration swap, never a hydration mismatch.
 */
import {
    resolveIcon,
    useIconCatalogReady,
    loadIconCatalog,
    iconCatalogLoaded,
} from '@/lib/icon-map';
import { createElement, useEffect } from 'react';

export default function BlockIcon({
    iconKey,
    className,
}: {
    iconKey?: string | null;
    className?: string;
}) {
    const catalogReady = useIconCatalogReady();
    const isHeroKey = !!iconKey && iconKey.includes(':h:');

    // A block that references a Heroicon is what pulls the catalog chunk in.
    useEffect(() => {
        if (isHeroKey && !iconCatalogLoaded()) {
            loadIconCatalog().catch(() => undefined);
        }
    }, [isHeroKey]);

    // createElement (vs. <Icon/>) keeps the resolved component out of render
    // scope, so the compiler lint does not read this lookup as defining a
    // component during render.
    return isHeroKey && !catalogReady
        ? createElement(resolveIcon(null), {
              className,
              'aria-hidden': true,
          })
        : createElement(resolveIcon(iconKey), {
              className,
              'aria-hidden': true,
          });
}

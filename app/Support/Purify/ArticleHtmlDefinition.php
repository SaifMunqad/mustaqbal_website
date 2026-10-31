<?php

namespace App\Support\Purify;

use HTMLPurifier_HTMLDefinition;
use Stevebauman\Purify\Definitions\Html5Definition;

/**
 * HTML definition used to sanitize article bodies produced by the Tiptap
 * editor. It layers on top of the stock HTML5 definition and additionally
 * allows the custom attributes the editor relies on:
 *
 *   - table structure (table/thead/tbody/tr/th/td/colgroup/col)
 *   - inline alignment styles and the data-chart-* attributes that back the
 *     embedded Chart.js node.
 *
 * These attributes must ALSO be listed in the HTML.Allowed config key so the
 * whitelist does not strip them; declaring them here teaches HTMLPurifier how
 * to validate their values.
 */
class ArticleHtmlDefinition implements \Stevebauman\Purify\Definitions\Definition
{
    /**
     * Apply rules to the HTML Purifier definition.
     *
     * @return void
     */
    public static function apply(HTMLPurifier_HTMLDefinition $definition)
    {
        // Inherit every HTML5 augmentation (figure, video, u, s, etc.).
        Html5Definition::apply($definition);

        // Allow the embedded chart node to round-trip through the sanitizer.
        // Data is stored as plain, comma-separated strings to stay within the
        // "Text" datatype and avoid JSON quoting problems during filtering.
        $definition->addAttribute('div', 'data-chart-type', 'Text');
        $definition->addAttribute('div', 'data-chart-title', 'Text');
        $definition->addAttribute('div', 'data-chart-labels', 'Text');
        $definition->addAttribute('div', 'data-chart-values', 'Text');

        // Tiptap applies alignment via inline style and may add classes.
        $definition->addAttribute('div', 'class', 'Text');
        $definition->addAttribute('span', 'class', 'Text');
    }
}

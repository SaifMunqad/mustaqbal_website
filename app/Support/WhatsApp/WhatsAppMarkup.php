<?php

namespace App\Support\WhatsApp;

use DOMDocument;
use DOMElement;
use DOMNode;
use DOMText;

/**
 * Converts the sanitized HTML produced by the campaign editor into the small
 * markup language WhatsApp understands:
 *
 *   *bold*   _italic_   ~strikethrough~   ```monospace```
 *
 * Everything WhatsApp cannot render degrades to readable plain text instead of
 * leaking tags into the chat: headings become bold lines, lists become bullet
 * or numbered lines, table rows become "cell · cell" lines, links gain their
 * URL in parentheses and images/charts are dropped.
 */
class WhatsAppMarkup
{
    /**
     * Convert an editor HTML body to WhatsApp markup. Legacy plain-text bodies
     * (no tags) are returned unchanged.
     */
    public static function fromHtml(?string $html): string
    {
        $html = trim((string) $html);

        if ($html === '') {
            return '';
        }

        if (! preg_match('/<[a-z][^>]*>/i', $html)) {
            return self::tidy($html);
        }

        $document = new DOMDocument('1.0', 'UTF-8');

        $previous = libxml_use_internal_errors(true);
        $document->loadHTML('<?xml encoding="UTF-8">'.$html);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        $body = $document->getElementsByTagName('body')->item(0);

        if (! $body instanceof DOMElement) {
            return self::tidy(html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        }

        return self::tidy(self::children($body));
    }

    private static function children(DOMNode $node): string
    {
        $out = '';

        foreach ($node->childNodes as $child) {
            $out .= self::walk($child);
        }

        return $out;
    }

    private static function walk(DOMNode $node): string
    {
        if ($node instanceof DOMText) {
            // HTML source whitespace wraps lines only; collapse it like a browser.
            return preg_replace('/\s+/u', ' ', $node->nodeValue ?? '') ?? '';
        }

        if (! $node instanceof DOMElement) {
            return '';
        }

        $tag = strtolower($node->nodeName);
        $inner = self::children($node);

        return match ($tag) {
            'script', 'style', 'head', 'title', 'img', 'td', 'th' => '',
            'br' => "\n",
            'hr' => "\n———\n",
            'p', 'div', 'section', 'article', 'header', 'footer', 'figure', 'figcaption' => "\n".$inner."\n",
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6' => "\n".self::wrap(trim($inner), '*')."\n",
            'strong', 'b' => self::wrap($inner, '*'),
            'em', 'i' => self::wrap($inner, '_'),
            's', 'del', 'strike' => self::wrap($inner, '~'),
            'code' => self::wrap(trim($inner), '```'),
            'pre' => "\n```\n".trim($node->textContent)."\n```\n",
            'blockquote' => self::quote($inner),
            'ul' => "\n".self::listItems($node)."\n",
            'ol' => "\n".self::listItems($node, 1)."\n",
            'table' => "\n".$inner."\n",
            'tr' => self::tableRow($node),
            'a' => self::link($node, $inner),
            default => $inner,
        };
    }

    /**
     * Wrap non-empty text in a WhatsApp formatting marker. Nested markers such
     * as "*_text_*" are supported by WhatsApp, so no unwrapping is needed.
     */
    private static function wrap(string $text, string $marker): string
    {
        return trim($text) === '' ? $text : $marker.$text.$marker;
    }

    private static function quote(string $text): string
    {
        $lines = array_filter(
            array_map('trim', explode("\n", trim($text))),
            static fn (string $line): bool => $line !== '',
        );

        return "\n".implode("\n", array_map(static fn (string $line): string => '> '.$line, $lines))."\n";
    }

    /**
     * @param  int|null  $start  First number for ordered lists, null for bullets.
     */
    private static function listItems(DOMElement $list, ?int $start = null): string
    {
        $out = '';
        $index = $start;

        foreach ($list->childNodes as $child) {
            if (! $child instanceof DOMElement || strtolower($child->nodeName) !== 'li') {
                continue;
            }

            $prefix = $index === null ? '• ' : $index++.'. ';

            $out .= $prefix.trim(self::children($child))."\n";
        }

        return $out;
    }

    private static function tableRow(DOMElement $row): string
    {
        $cells = [];

        foreach ($row->childNodes as $cell) {
            if (! $cell instanceof DOMElement) {
                continue;
            }

            if (in_array(strtolower($cell->nodeName), ['td', 'th'], true)) {
                $cells[] = trim(self::children($cell));
            }
        }

        return $cells === [] ? '' : implode(' · ', $cells)."\n";
    }

    private static function link(DOMElement $anchor, string $inner): string
    {
        $href = trim($anchor->getAttribute('href'));
        $text = trim($inner);

        if ($href === '' || $href === $text) {
            return $href !== '' ? $href : $text;
        }

        return $text === '' ? $href : $text.' ('.$href.')';
    }

    /**
     * Normalise the generated text: Unix newlines, no trailing spaces, at most
     * one blank line between blocks.
     */
    private static function tidy(string $text): string
    {
        $text = str_replace(["\r\n", "\r"], "\n", $text);
        $text = preg_replace('/[ \t]+\n/u', "\n", $text) ?? $text;
        $text = preg_replace('/\n{3,}/u', "\n\n", $text) ?? $text;

        return trim($text);
    }
}

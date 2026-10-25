<?php

namespace Tests\Unit;

use App\Support\WhatsApp\WhatsAppMarkup;
use Tests\TestCase;

/**
 * Covers the HTML → WhatsApp markup conversion used for campaign messages:
 * the formatted subset must survive, and everything WhatsApp cannot render
 * must degrade to readable text instead of leaking tags into the chat.
 */
class WhatsAppMarkupTest extends TestCase
{
    public function test_plain_text_is_returned_unchanged(): void
    {
        $this->assertSame(
            "School closes on Monday.\nBring your books on Tuesday.",
            WhatsAppMarkup::fromHtml("School closes on Monday.\nBring your books on Tuesday."),
        );
    }

    public function test_empty_input_produces_empty_output(): void
    {
        $this->assertSame('', WhatsAppMarkup::fromHtml(null));
        $this->assertSame('', WhatsAppMarkup::fromHtml('   '));
    }

    public function test_inline_formatting_uses_whatsapp_markers(): void
    {
        $markup = WhatsAppMarkup::fromHtml(
            '<p><strong>Bold</strong> and <em>italic</em> and <s>gone</s> and <code>code</code></p>'
        );

        $this->assertSame('*Bold* and _italic_ and ~gone~ and ```code```', $markup);
    }

    public function test_paragraphs_and_line_breaks_become_newlines(): void
    {
        $markup = WhatsAppMarkup::fromHtml('<p>First</p><p>Second<br>Third</p>');

        // Paragraphs stay visually separated; a <br> is a single line break.
        $this->assertSame("First\n\nSecond\nThird", $markup);
    }

    public function test_headings_become_bold_lines(): void
    {
        $this->assertSame('*Holiday notice*', WhatsAppMarkup::fromHtml('<h2>Holiday notice</h2>'));
    }

    public function test_lists_become_bullet_and_numbered_lines(): void
    {
        $bullets = WhatsAppMarkup::fromHtml('<ul><li>One</li><li>Two</li></ul>');
        $numbers = WhatsAppMarkup::fromHtml('<ol><li>First</li><li>Second</li></ol>');

        $this->assertSame("• One\n• Two", $bullets);
        $this->assertSame("1. First\n2. Second", $numbers);
    }

    public function test_links_keep_their_url(): void
    {
        $this->assertSame(
            'Portal (https://example.com/portal)',
            WhatsAppMarkup::fromHtml('<p><a href="https://example.com/portal">Portal</a></p>'),
        );
    }

    public function test_table_rows_are_flattened_to_one_line_each(): void
    {
        $markup = WhatsAppMarkup::fromHtml(
            '<table><tbody><tr><td>Grade</td><td>Fee</td></tr><tr><td>1</td><td>100</td></tr></tbody></table>'
        );

        $this->assertSame("Grade · Fee\n1 · 100", $markup);
    }

    public function test_images_charts_and_scripts_are_dropped(): void
    {
        $markup = WhatsAppMarkup::fromHtml(
            '<p>Notice</p><img src="/logo.png" alt="Logo">'
            .'<div data-chart-type="bar" data-chart-values="1,2"></div>'
            .'<script>alert(1)</script>'
        );

        $this->assertSame('Notice', $markup);
    }

    public function test_entities_are_decoded(): void
    {
        $this->assertSame('Books & pens', WhatsAppMarkup::fromHtml('<p>Books &amp; pens</p>'));
    }

    public function test_blank_lines_are_collapsed(): void
    {
        $markup = WhatsAppMarkup::fromHtml('<p>One</p><p></p><p></p><p>Two</p>');

        $this->assertSame("One\n\nTwo", $markup);
    }
}

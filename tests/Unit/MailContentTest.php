<?php

namespace Tests\Unit;

use App\Models\EmailCampaign;
use App\Support\Mail\MailContent;
use Tests\TestCase;

/**
 * Covers the preparation of campaign email content: relative asset paths have
 * to become absolute (mail clients have no site context), leftover empty
 * paragraphs must not create dead space, and direction follows the language of
 * the message rather than the dashboard.
 */
class MailContentTest extends TestCase
{
    private function campaign(string $body): EmailCampaign
    {
        return new EmailCampaign(['body' => $body]);
    }

    public function test_app_relative_image_sources_become_absolute(): void
    {
        $html = MailContent::html($this->campaign('<p>Flyer</p><img src="/storage/uploads/flyer.jpg" alt="Flyer">'));

        $this->assertStringContainsString(
            'src="'.rtrim((string) config('app.url'), '/').'/storage/uploads/flyer.jpg"',
            $html,
        );
    }

    public function test_app_relative_links_become_absolute_but_anchors_and_external_urls_are_untouched(): void
    {
        $html = MailContent::html($this->campaign(
            '<p><a href="/school/programs">Programs</a>'
            .'<a href="https://example.com/x">External</a>'
            .'<a href="#top">Top</a>'
            .'<img src="//cdn.example.com/y.png"></p>'
        ));

        $base = rtrim((string) config('app.url'), '/');

        $this->assertStringContainsString('href="'.$base.'/school/programs"', $html);
        $this->assertStringContainsString('href="https://example.com/x"', $html);
        $this->assertStringContainsString('href="#top"', $html);
        $this->assertStringContainsString('src="//cdn.example.com/y.png"', $html);
    }

    public function test_empty_editor_paragraphs_are_removed(): void
    {
        $html = MailContent::html($this->campaign('<h1>HAPPY EID!</h1><p></p><p>Wish you success.</p><p> </p>'));

        $this->assertStringNotContainsString('<p></p>', $html);
        $this->assertStringNotContainsString('<p> </p>', $html);
        $this->assertStringContainsString('<h1>HAPPY EID!</h1>', $html);
    }

    public function test_legacy_plain_text_keeps_its_line_breaks(): void
    {
        $html = MailContent::html($this->campaign("First line\nSecond line"));

        $this->assertStringContainsString('<br />', $html);
        $this->assertStringNotContainsString('<p>', $html);
    }

    public function test_direction_follows_the_message_language(): void
    {
        $this->assertSame('rtl', MailContent::direction('<p>عید مبارک</p>'));
        $this->assertSame('rtl', MailContent::direction('<p>اختر مبارک</p>'));
        $this->assertSame('ltr', MailContent::direction('<p>Happy Eid</p>'));
        $this->assertSame('ltr', MailContent::direction('<p>1436</p>'));
    }
}

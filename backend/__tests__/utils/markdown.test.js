// Test markdown utils
const markdownUtils = require('../../utils/markdown');

describe('markdown utils', () => {
  describe('markdownToHtml', () => {
    it('should convert markdown to HTML', () => {
      const markdown = '# Heading\n\nThis is a paragraph.';
      const html = markdownUtils.markdownToHtml(markdown);

      expect(html).toContain('<h1>Heading</h1>');
      expect(html).toContain('<p>This is a paragraph.</p>');
    });

    it('should handle empty markdown', () => {
      const html = markdownUtils.markdownToHtml('');
      expect(html).toBe('');
    });

    it('should handle null markdown', () => {
      const html = markdownUtils.markdownToHtml(null);
      expect(html).toBe('');
    });

    it('should handle undefined markdown', () => {
      const html = markdownUtils.markdownToHtml(undefined);
      expect(html).toBe('');
    });

    it('should convert markdown links to HTML', () => {
      const markdown = 'Check out [Google](https://google.com)';
      const html = markdownUtils.markdownToHtml(markdown);

      expect(html).toContain('<a href="https://google.com">Google</a>');
    });

    it('should convert markdown bold text to HTML', () => {
      const markdown = 'This is **bold** text';
      const html = markdownUtils.markdownToHtml(markdown);

      expect(html).toContain('<strong>bold</strong>');
    });

    it('should convert markdown italic text to HTML', () => {
      const markdown = 'This is *italic* text';
      const html = markdownUtils.markdownToHtml(markdown);

      expect(html).toContain('<em>italic</em>');
    });

    it('should convert markdown code blocks to HTML', () => {
      const markdown = '```javascript\nconst x = 1;\n```';
      const html = markdownUtils.markdownToHtml(markdown);

      expect(html).toContain('<pre');
      expect(html).toContain('code');
    });

    it('should convert line breaks to <br> tags', () => {
      const markdown = 'Line 1\nLine 2';
      const html = markdownUtils.markdownToHtml(markdown);

      expect(html).toContain('<br');
    });

    it('should automatically convert URLs to links', () => {
      const markdown = 'Visit https://example.com for more info';
      const html = markdownUtils.markdownToHtml(markdown);

      expect(html).toContain('<a href="https://example.com">');
    });

    it('should handle HTML in markdown', () => {
      const markdown = '<div>HTML content</div>';
      const html = markdownUtils.markdownToHtml(markdown);

      expect(html).toContain('<div>HTML content</div>');
    });
  });

  describe('htmlToMarkdown', () => {
    it('should convert HTML to markdown', () => {
      const html = '<h1>Heading</h1><p>This is a paragraph.</p>';
      const markdown = markdownUtils.htmlToMarkdown(html);

      expect(markdown).toContain('# Heading');
      expect(markdown).toContain('This is a paragraph');
    });

    it('should handle empty HTML', () => {
      const markdown = markdownUtils.htmlToMarkdown('');
      expect(markdown).toBe('');
    });

    it('should handle null HTML', () => {
      const markdown = markdownUtils.htmlToMarkdown(null);
      expect(markdown).toBe('');
    });

    it('should handle undefined HTML', () => {
      const markdown = markdownUtils.htmlToMarkdown(undefined);
      expect(markdown).toBe('');
    });

    it('should convert HTML links to markdown', () => {
      const html = '<a href="https://google.com">Google</a>';
      const markdown = markdownUtils.htmlToMarkdown(html);

      expect(markdown).toContain('[Google](https://google.com)');
    });

    it('should convert HTML bold text to markdown', () => {
      const html = '<strong>bold</strong> or <b>bold</b>';
      const markdown = markdownUtils.htmlToMarkdown(html);

      expect(markdown).toContain('**bold**');
    });

    it('should convert HTML italic text to markdown', () => {
      const html = '<em>italic</em> or <i>italic</i>';
      const markdown = markdownUtils.htmlToMarkdown(html);

      // TurndownService converts <em> and <i> to _italic_ (underscores), not *italic* (asterisks)
      expect(markdown).toContain('_italic_');
      expect(markdown).toMatch(/_italic_/);
    });

    it('should convert HTML headings to markdown', () => {
      const html = '<h1>Heading 1</h1><h2>Heading 2</h2>';
      const markdown = markdownUtils.htmlToMarkdown(html);

      expect(markdown).toContain('# Heading 1');
      expect(markdown).toContain('## Heading 2');
    });

    it('should clean up extra blank lines', () => {
      const html = '<p>Paragraph 1</p>\n\n\n\n<p>Paragraph 2</p>';
      const markdown = markdownUtils.htmlToMarkdown(html);

      // Should not have more than 2 consecutive newlines
      expect(markdown).not.toMatch(/\n{3,}/);
    });

    it('should trim whitespace', () => {
      const html = '   <p>Content</p>   ';
      const markdown = markdownUtils.htmlToMarkdown(html);

      expect(markdown).not.toMatch(/^\s+/);
      expect(markdown).not.toMatch(/\s+$/);
    });

    it('should handle conversion errors gracefully', () => {
      // Create invalid HTML that might cause issues
      const html = '<div><p>Unclosed paragraph';

      // Should not throw, should return plain text extraction
      const markdown = markdownUtils.htmlToMarkdown(html);

      expect(typeof markdown).toBe('string');
      expect(markdown.length).toBeGreaterThan(0);
    });

    it('should convert HTML lists to markdown', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const markdown = markdownUtils.htmlToMarkdown(html);

      expect(markdown).toContain('Item 1');
      expect(markdown).toContain('Item 2');
    });

    it('should convert HTML code blocks to markdown', () => {
      const html = '<pre><code>const x = 1;</code></pre>';
      const markdown = markdownUtils.htmlToMarkdown(html);

      expect(markdown).toContain('const x = 1;');
    });
  });

  describe('round-trip conversion', () => {
    it('should handle simple markdown to HTML to markdown conversion', () => {
      const originalMarkdown = '# Heading\n\nThis is a **bold** paragraph.';
      const html = markdownUtils.markdownToHtml(originalMarkdown);
      const convertedMarkdown = markdownUtils.htmlToMarkdown(html);

      // The converted markdown should contain the key content
      expect(convertedMarkdown).toContain('Heading');
      expect(convertedMarkdown).toContain('bold');
      expect(convertedMarkdown).toContain('paragraph');
    });
  });
});

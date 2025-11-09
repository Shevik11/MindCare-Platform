// Utility for converting between Markdown and HTML
const MarkdownIt = require('markdown-it');
const TurndownService = require('turndown');

// Initialize markdown parser
const md = new MarkdownIt({
  html: true, // Allow HTML in markdown
  breaks: true, // Convert line breaks to <br>
  linkify: true, // Automatically convert URLs to links
});

// Initialize HTML to Markdown converter
const turndownService = new TurndownService({
  headingStyle: 'atx', // Use # for headings
  codeBlockStyle: 'fenced', // Use ``` for code blocks
});

// Convert Markdown to HTML
function markdownToHtml(markdown) {
  if (!markdown) return '';
  return md.render(markdown);
}

// Convert HTML to Markdown (for editing)
function htmlToMarkdown(html) {
  if (!html) return '';
  try {
    // Turndown handles most HTML conversion automatically
    let markdown = turndownService.turndown(html);

    // Clean up extra blank lines (more than 2 consecutive)
    markdown = markdown.replace(/\n{3,}/g, '\n\n');

    // Trim and return
    return markdown.trim();
  } catch (err) {
    console.error('Error converting HTML to Markdown:', err);
    // Fallback: return plain text extraction
    return html.replace(/<[^>]*>/g, '').trim();
  }
}

module.exports = {
  markdownToHtml,
  htmlToMarkdown,
};

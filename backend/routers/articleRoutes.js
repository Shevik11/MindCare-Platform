// routes/articleRoutes.js
const express = require('express');
const router = express.Router();
const prisma = require('../db/db');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const { uploadArticle } = require('../middleware/upload');
const { markdownToHtml, htmlToMarkdown } = require('../utils/markdown');

// Get all published articles
router.get('/', async (req, res) => {
  try {
    const articles = await prisma.articles.findMany({
      where: {
        status: 'published',
      },
      include: {
        Users: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(articles);
  } catch (err) {
    console.error('Error getting articles:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Get articles by user (for psychologist's own articles) - MUST BE BEFORE /:id
router.get('/user/my', auth, async (req, res) => {
  try {
    const articles = await prisma.articles.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(articles);
  } catch (err) {
    console.error('Error getting user articles:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Get article by ID (public or for editing)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const articleId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(articleId)) {
      return res.status(400).json({ error: 'Invalid article ID' });
    }

    const article = await prisma.articles.findUnique({
      where: {
        id: articleId,
      },
      include: {
        Users: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Check if request is for editing - if user is authenticated and is author/admin
    const editMode = req.query.edit === 'true';

    // If edit mode and user is authenticated and is author/admin, convert HTML to Markdown
    if (editMode && req.user && article.content) {
      const isAuthor = req.user.id === article.userId;
      const isAdmin = req.user.role === 'admin';

      if (isAuthor || isAdmin) {
        try {
          article.contentMarkdown = htmlToMarkdown(article.content);
        } catch (err) {
          console.error('Error converting HTML to Markdown:', err);
          // If conversion fails, just use the HTML content
          article.contentMarkdown = article.content;
        }
      }
    }

    res.json(article);
  } catch (err) {
    console.error('Error getting article:', err);
    console.error('Error details:', err.message);
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
});

// Create article (only for psychologists and admins)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'psychologist' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { title, description, image, readTime, author, content, status } =
      req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Convert Markdown to HTML
    const htmlContent = content ? markdownToHtml(content) : null;

    // Determine article status
    let articleStatus = status || 'draft';

    // If no status provided and user is psychologist, default to draft
    if (!status && req.user.role === 'psychologist') {
      articleStatus = 'draft';
    }

    // If psychologist tries to publish, set status to 'pending' for moderation
    // Psychologists can also directly set status to 'pending' to send for moderation
    // Admins can publish directly
    if (req.user.role === 'psychologist' && articleStatus === 'published') {
      articleStatus = 'pending';
    }

    const article = await prisma.articles.create({
      data: {
        title,
        description: description || null,
        image: image || null,
        readTime: readTime || null,
        author: author || null,
        content: htmlContent,
        status: articleStatus,
        userId: req.user.id,
      },
    });

    // Send email notifications if article is published immediately (admin only)
    if (articleStatus === 'published') {
      const { notifyUsersAboutArticle } = require('../utils/email');
      notifyUsersAboutArticle(article).catch(err => {
        console.error('Error sending article notifications:', err);
      });
    }

    res.json(article);
  } catch (err) {
    console.error('Error creating article:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Update article (only author or admin)
router.put('/:id', auth, async (req, res) => {
  try {
    const article = await prisma.articles.findUnique({
      where: {
        id: Number.parseInt(req.params.id, 10),
      },
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (article.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { title, description, image, readTime, author, content, status } =
      req.body;

    // Convert Markdown to HTML if content is provided
    const htmlContent =
      content !== undefined
        ? content
          ? markdownToHtml(content)
          : null
        : article.content;

    // Handle status update
    let articleStatus = status !== undefined ? status : article.status;
    let updateData = {
      title: title !== undefined ? title : article.title,
      description:
        description !== undefined ? description : article.description,
      image: image !== undefined ? image : article.image,
      readTime: readTime !== undefined ? readTime : article.readTime,
      author: author !== undefined ? author : article.author,
      content: htmlContent,
    };

    // If psychologist tries to publish, set status to 'pending' for moderation
    // Psychologists can also directly set status to 'pending' to send for moderation
    // Admins can publish directly
    if (req.user.role === 'psychologist' && articleStatus === 'published') {
      articleStatus = 'pending';
    }

    // Clear rejection reason when resubmitting for moderation
    if (articleStatus === 'pending' && article.rejectionReason) {
      updateData.rejectionReason = null;
    }

    updateData.status = articleStatus;

    const updatedArticle = await prisma.articles.update({
      where: {
        id: Number.parseInt(req.params.id, 10),
      },
      data: updateData,
    });

    // Send email notifications if article status changed to published
    // Only send if status was changed from something other than published to published
    if (articleStatus === 'published' && article.status !== 'published') {
      const { notifyUsersAboutArticle } = require('../utils/email');
      notifyUsersAboutArticle(updatedArticle).catch(err => {
        console.error('Error sending article notifications:', err);
      });
    }

    res.json(updatedArticle);
  } catch (err) {
    console.error('Error updating article:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Delete article (only author or admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const article = await prisma.articles.findUnique({
      where: {
        id: Number.parseInt(req.params.id, 10),
      },
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (article.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.articles.delete({
      where: {
        id: Number.parseInt(req.params.id, 10),
      },
    });

    res.json({ message: 'Article deleted' });
  } catch (err) {
    console.error('Error deleting article:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Upload article image
router.post(
  '/upload-image',
  auth,
  uploadArticle.single('image'),
  async (req, res) => {
    try {
      if (req.user.role !== 'psychologist' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const imageUrl = `/uploads/articles/${req.file.filename}`;

      res.json({ imageUrl });
    } catch (err) {
      console.error('Upload image error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res
          .status(400)
          .json({ error: 'File too large. Maximum size is 10MB' });
      }
      res.status(500).json({ error: 'Server Error' });
    }
  }
);

module.exports = router;

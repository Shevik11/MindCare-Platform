const prisma = require('../config/database');
const { markdownToHtml, htmlToMarkdown } = require('../utils/markdown');
const { notifyUsersAboutArticle } = require('../utils/email');

const getAllArticles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [articles, total] = await Promise.all([
      prisma.articles.findMany({
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
        skip,
        take: limit,
      }),
      prisma.articles.count({
        where: {
          status: 'published',
        },
      }),
    ]);

    res.json({
      articles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Error getting articles:', err);
    res.status(500).json({ error: 'Server Error' });
  }
};

const getMyArticles = async (req, res) => {
  try {
    const articles = await prisma.articles.findMany({
      where: {
        userId: req.user.id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        image: true,
        readTime: true,
        author: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        rejectionReason: true,
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
};

const getArticleById = async (req, res) => {
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

    const editMode = req.query.edit === 'true';

    if (editMode && req.user && article.content) {
      const isAuthor = req.user.id === article.userId;
      const isAdmin = req.user.role === 'admin';

      if (isAuthor || isAdmin) {
        try {
          article.contentMarkdown = htmlToMarkdown(article.content);
        } catch (err) {
          console.error('Error converting HTML to Markdown:', err);
          article.contentMarkdown = article.content;
        }
      }
    }

    res.json(article);
  } catch (err) {
    console.error('Error getting article:', err);
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};

const createArticle = async (req, res) => {
  try {
    if (req.user.role !== 'psychologist' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { title, description, image, readTime, author, content, status } =
      req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const htmlContent = content ? markdownToHtml(content) : null;

    let articleStatus = status || 'draft';

    if (!status && req.user.role === 'psychologist') {
      articleStatus = 'draft';
    }

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

    if (articleStatus === 'published') {
      notifyUsersAboutArticle(article).catch(err => {
        console.error('Error sending article notifications:', err);
      });
    }

    res.json(article);
  } catch (err) {
    console.error('Error creating article:', err);
    res.status(500).json({ error: 'Server Error' });
  }
};

const updateArticle = async (req, res) => {
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

    const htmlContent =
      content !== undefined
        ? content
          ? markdownToHtml(content)
          : null
        : article.content;

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

    if (req.user.role === 'psychologist' && articleStatus === 'published') {
      articleStatus = 'pending';
    }

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

    if (articleStatus === 'published' && article.status !== 'published') {
      notifyUsersAboutArticle(updatedArticle).catch(err => {
        console.error('Error sending article notifications:', err);
      });
    }

    res.json(updatedArticle);
  } catch (err) {
    console.error('Error updating article:', err);
    res.status(500).json({ error: 'Server Error' });
  }
};

const deleteArticle = async (req, res) => {
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
};

const uploadArticleImage = async (req, res) => {
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
};

module.exports = {
  getAllArticles,
  getMyArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  uploadArticleImage,
};

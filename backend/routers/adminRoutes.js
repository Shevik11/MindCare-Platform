// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const prisma = require('../db/db');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Admin middleware - check if user is admin
const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }
  next();
};

// Get admin statistics
router.get('/stats', auth, adminAuth, async (req, res) => {
  try {
    // Count all articles (both draft and published)
    const totalArticles = await prisma.articles.count();

    // Count all psychologists
    const totalPsychologists = await prisma.psychologists.count();

    // Count all users (active users - users who have logged in/registered)
    const totalUsers = await prisma.users.count();

    // Get recent activity
    const recentArticles = await prisma.articles.findMany({
      take: 5,
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        Users: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const recentPsychologists = await prisma.psychologists.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
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

    // Format recent activity
    const recentActivity = [];

    // Add recent articles
    for (const article of recentArticles) {
      // Use createdAt if updatedAt is not available, but prefer updatedAt
      const articleTime = article.updatedAt || article.createdAt;
      if (articleTime) {
        // Log for debugging
        if (!(articleTime instanceof Date) && typeof articleTime !== 'string') {
          console.warn(
            'Unexpected date type for article:',
            article.id,
            typeof articleTime,
            articleTime
          );
        }
        recentActivity.push({
          type:
            article.status === 'published'
              ? 'article_published'
              : 'article_updated',
          title: article.title || 'Без назви',
          author: article.Users
            ? `${article.Users.firstName || ''} ${article.Users.lastName || ''}`.trim() ||
              'Невідомий автор'
            : 'Невідомий автор',
          time: articleTime,
        });
      } else {
        console.warn('Article without date:', article.id, article.title);
      }
    }

    // Add recent psychologists
    for (const psychologist of recentPsychologists) {
      if (psychologist.Users) {
        const psychologistTime =
          psychologist.createdAt || psychologist.updatedAt;
        if (psychologistTime) {
          // Log for debugging
          if (
            !(psychologistTime instanceof Date) &&
            typeof psychologistTime !== 'string'
          ) {
            console.warn(
              'Unexpected date type for psychologist:',
              psychologist.id,
              typeof psychologistTime,
              psychologistTime
            );
          }
          recentActivity.push({
            type: 'psychologist_registered',
            title:
              `${psychologist.Users.firstName || ''} ${psychologist.Users.lastName || ''}`.trim() ||
              'Невідомий психолог',
            author: psychologist.Users.email || '',
            time: psychologistTime,
          });
        } else {
          console.warn('Psychologist without date:', psychologist.id);
        }
      }
    }

    // Filter out activities without valid time and sort by time (newest first)
    const validActivities = recentActivity.filter(
      activity => activity.time != null
    );
    validActivities.sort((a, b) => {
      const dateA = new Date(a.time);
      const dateB = new Date(b.time);
      // Check if dates are valid
      if (Number.isNaN(dateA.getTime()) || Number.isNaN(dateB.getTime())) {
        return 0;
      }
      return dateB - dateA;
    });

    // Take top 5
    const topActivities = validActivities.slice(0, 5);

    res.json({
      stats: {
        totalArticles,
        totalPsychologists,
        totalUsers,
      },
      recentActivity: topActivities
        .map(activity => {
          // Ensure time is a valid Date object and convert to ISO string
          let timeValue = null;
          if (activity.time) {
            try {
              // Convert to Date object if it's not already
              const date =
                activity.time instanceof Date
                  ? activity.time
                  : new Date(activity.time);

              // Check if date is valid
              if (Number.isNaN(date.getTime())) {
                console.error(
                  'Invalid date after conversion:',
                  activity.time,
                  '->',
                  date
                );
              } else {
                timeValue = date.toISOString();
              }
            } catch (error) {
              console.error(
                'Error converting date to ISO:',
                error,
                activity.time,
                typeof activity.time
              );
            }
          } else {
            console.warn(
              'Activity without time:',
              activity.type,
              activity.title
            );
          }
          return {
            type: activity.type,
            title: activity.title,
            subtitle: activity.author,
            time: timeValue,
          };
        })
        .filter(activity => activity.time !== null), // Filter out activities without valid time
    });
  } catch (err) {
    console.error('Error getting admin stats:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Get all psychologists with average rating for admin management
router.get('/psychologists', auth, adminAuth, async (req, res) => {
  try {
    const psychologists = await prisma.psychologists.findMany({
      include: {
        Users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photoUrl: true,
            role: true,
          },
        },
        Comments: {
          select: {
            rating: true,
          },
        },
      },
    });

    // Calculate average rating for each psychologist
    const psychologistsWithRating = psychologists.map(psychologist => {
      const { Comments, Users, price, ...rest } = psychologist;

      // Calculate average rating
      let averageRating = 0;
      if (Comments && Comments.length > 0) {
        const sum = Comments.reduce((acc, comment) => acc + comment.rating, 0);
        averageRating = sum / Comments.length;
      }

      return {
        ...rest,
        User: Users
          ? {
              ...Users,
              // Ensure role is set - if null/undefined and there's a psychologist record, default to 'psychologist'
              role: Users.role || 'psychologist',
            }
          : null,
        price: price != null ? parseFloat(price.toString()) : null,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
        totalComments: Comments.length,
      };
    });

    res.json(psychologistsWithRating);
  } catch (err) {
    console.error('Error getting psychologists for admin:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Get psychologist details with comments for admin
router.get('/psychologists/:id', auth, adminAuth, async (req, res) => {
  try {
    const psychologistId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(psychologistId)) {
      return res.status(400).json({ error: 'Invalid psychologist ID' });
    }

    const psychologist = await prisma.psychologists.findUnique({
      where: { id: psychologistId },
      include: {
        Users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photoUrl: true,
            role: true,
          },
        },
        Comments: {
          include: {
            Users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!psychologist) {
      return res.status(404).json({ error: 'Psychologist not found' });
    }

    // Calculate average rating
    let averageRating = 0;
    if (psychologist.Comments && psychologist.Comments.length > 0) {
      const sum = psychologist.Comments.reduce(
        (acc, comment) => acc + comment.rating,
        0
      );
      averageRating = sum / psychologist.Comments.length;
    }

    // Map Users to User for frontend compatibility
    const { Users, Comments, price, ...rest } = psychologist;
    const mappedComments = Comments.map(comment => {
      const { Users: commentUser, ...commentRest } = comment;
      return {
        ...commentRest,
        User: commentUser || null,
      };
    });

    // Ensure role is set - if null/undefined and there's a psychologist record, default to 'psychologist'
    const userWithRole = Users
      ? {
          ...Users,
          role: Users.role || 'psychologist',
        }
      : null;

    res.json({
      ...rest,
      User: userWithRole,
      price: price != null ? parseFloat(price.toString()) : null,
      averageRating: Math.round(averageRating * 10) / 10,
      totalComments: mappedComments.length,
      Comments: mappedComments,
    });
  } catch (err) {
    console.error('Error getting psychologist details for admin:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Block psychologist temporarily (for a specified number of days)
router.post(
  '/psychologists/:id/block-temporary',
  auth,
  adminAuth,
  async (req, res) => {
    try {
      const psychologistId = Number.parseInt(req.params.id, 10);
      const { days } = req.body;

      if (Number.isNaN(psychologistId)) {
        return res.status(400).json({ error: 'Invalid psychologist ID' });
      }

      if (!days || days < 1) {
        return res
          .status(400)
          .json({ error: 'Days must be a positive number' });
      }

      const psychologist = await prisma.psychologists.findUnique({
        where: { id: psychologistId },
        include: { Users: true },
      });

      if (!psychologist) {
        return res.status(404).json({ error: 'Psychologist not found' });
      }

      if (!psychologist.Users) {
        return res
          .status(404)
          .json({ error: 'User not found for this psychologist' });
      }

      // For temporary blocking, we also change role to patient
      // In a production system, you might want to add a blockedUntil field to track expiration
      // For now, temporary and permanent blocking work the same way (role change to patient)
      const updatedUser = await prisma.users.update({
        where: { id: psychologist.Users.id },
        data: { role: 'patient' },
      });

      console.log('Blocked psychologist temporarily:', {
        userId: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        days,
      });

      // Calculate block until date for response
      const blockUntil = new Date();
      blockUntil.setDate(blockUntil.getDate() + days);

      res.json({
        message: `Psychologist blocked temporarily for ${days} days`,
        blockUntil: blockUntil.toISOString(),
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
        },
      });
    } catch (err) {
      console.error('Error blocking psychologist temporarily:', err);
      res.status(500).json({ error: 'Server Error' });
    }
  }
);

// Block psychologist permanently (change role to patient or add blocked flag)
router.post(
  '/psychologists/:id/block-permanent',
  auth,
  adminAuth,
  async (req, res) => {
    try {
      const psychologistId = Number.parseInt(req.params.id, 10);
      if (Number.isNaN(psychologistId)) {
        return res.status(400).json({ error: 'Invalid psychologist ID' });
      }

      const psychologist = await prisma.psychologists.findUnique({
        where: { id: psychologistId },
        include: { Users: true },
      });

      if (!psychologist) {
        return res.status(404).json({ error: 'Psychologist not found' });
      }

      if (!psychologist.Users) {
        return res
          .status(404)
          .json({ error: 'User not found for this psychologist' });
      }

      // Change role to patient to block permanently
      const updatedUser = await prisma.users.update({
        where: { id: psychologist.Users.id },
        data: { role: 'patient' },
      });

      console.log('Blocked psychologist permanently:', {
        userId: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      });

      res.json({
        message: 'Psychologist blocked permanently',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
        },
      });
    } catch (err) {
      console.error('Error blocking psychologist permanently:', err);
      res.status(500).json({ error: 'Server Error' });
    }
  }
);

// Unblock psychologist (restore role to psychologist)
router.post('/psychologists/:id/unblock', auth, adminAuth, async (req, res) => {
  try {
    const psychologistId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(psychologistId)) {
      return res.status(400).json({ error: 'Invalid psychologist ID' });
    }

    const psychologist = await prisma.psychologists.findUnique({
      where: { id: psychologistId },
      include: { Users: true },
    });

    if (!psychologist) {
      return res.status(404).json({ error: 'Psychologist not found' });
    }

    if (!psychologist.Users) {
      return res
        .status(404)
        .json({ error: 'User not found for this psychologist' });
    }

    // Restore role to psychologist
    const updatedUser = await prisma.users.update({
      where: { id: psychologist.Users.id },
      data: { role: 'psychologist' },
    });

    console.log('Unblocked psychologist:', {
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
    });

    res.json({
      message: 'Psychologist unblocked',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (err) {
    console.error('Error unblocking psychologist:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Get pending articles for moderation
router.get('/articles/pending', auth, adminAuth, async (req, res) => {
  try {
    const articles = await prisma.articles.findMany({
      where: {
        status: 'pending',
      },
      include: {
        Users: {
          select: {
            id: true,
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
    console.error('Error getting pending articles:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Get all articles for management (with filters)
// IMPORTANT: This route MUST be before /articles/pending to avoid conflicts
router.get('/articles/all', auth, adminAuth, async (req, res) => {
  try {
    console.log('GET /api/admin/articles/all - Request received');
    const { status, page = 1, limit = 20, search } = req.query;
    console.log('Query params:', { status, page, limit, search });

    // Build where clause - combine status and search filters properly
    const where = {};

    // Add status filter if provided
    if (status && status !== 'all') {
      where.status = status;
    }

    // Add search filter if provided
    const searchTerm = search?.trim();
    if (searchTerm) {
      const searchConditions = {
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          {
            Users: {
              OR: [
                { firstName: { contains: searchTerm, mode: 'insensitive' } },
                { lastName: { contains: searchTerm, mode: 'insensitive' } },
                { email: { contains: searchTerm, mode: 'insensitive' } },
              ],
            },
          },
        ],
      };

      // If we have both status and search, combine them with AND
      if (where.status) {
        where.AND = [{ status: where.status }, searchConditions];
        delete where.status;
      } else {
        // Only search, no status filter
        Object.assign(where, searchConditions);
      }
    }

    const skip = (Number.parseInt(page, 10) - 1) * Number.parseInt(limit, 10);
    const take = Number.parseInt(limit, 10);

    const [articles, total] = await Promise.all([
      prisma.articles.findMany({
        where,
        include: {
          Users: {
            select: {
              id: true,
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
        take,
      }),
      prisma.articles.count({ where }),
    ]);

    res.json({
      articles,
      total,
      page: Number.parseInt(page, 10),
      limit: Number.parseInt(limit, 10),
      totalPages: Math.ceil(total / Number.parseInt(limit, 10)),
    });
  } catch (err) {
    console.error('Error getting all articles:', err);
    console.error('Error details:', err.message);
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
});

// Approve article (change status from pending to published)
router.post('/articles/:id/approve', auth, adminAuth, async (req, res) => {
  try {
    const articleId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(articleId)) {
      return res.status(400).json({ error: 'Invalid article ID' });
    }

    const article = await prisma.articles.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (article.status !== 'pending') {
      return res
        .status(400)
        .json({ error: 'Article is not pending moderation' });
    }

    const updatedArticle = await prisma.articles.update({
      where: { id: articleId },
      data: { status: 'published' },
      include: {
        Users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Send email notifications to users (except admins) about the published article
    // Run this asynchronously so it doesn't block the response
    const { notifyUsersAboutArticle } = require('../utils/email');
    notifyUsersAboutArticle(updatedArticle).catch(err => {
      console.error('Error sending article notifications:', err);
    });

    res.json(updatedArticle);
  } catch (err) {
    console.error('Error approving article:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Reject article (change status from pending to draft)
router.post('/articles/:id/reject', auth, adminAuth, async (req, res) => {
  try {
    const articleId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(articleId)) {
      return res.status(400).json({ error: 'Invalid article ID' });
    }

    const article = await prisma.articles.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (article.status !== 'pending') {
      return res
        .status(400)
        .json({ error: 'Article is not pending moderation' });
    }

    const updatedArticle = await prisma.articles.update({
      where: { id: articleId },
      data: { status: 'draft' },
      include: {
        Users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.json(updatedArticle);
  } catch (err) {
    console.error('Error rejecting article:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Update article status (for admin)
router.put('/articles/:id/status', auth, adminAuth, async (req, res) => {
  try {
    const articleId = Number.parseInt(req.params.id, 10);
    const { status } = req.body;

    if (Number.isNaN(articleId)) {
      return res.status(400).json({ error: 'Invalid article ID' });
    }

    if (!status || !['draft', 'pending', 'published'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const articleBeforeUpdate = await prisma.articles.findUnique({
      where: { id: articleId },
    });

    if (!articleBeforeUpdate) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const updatedArticle = await prisma.articles.update({
      where: { id: articleId },
      data: { status },
      include: {
        Users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Send email notifications if article status changed to published
    if (status === 'published' && articleBeforeUpdate.status !== 'published') {
      const { notifyUsersAboutArticle } = require('../utils/email');
      notifyUsersAboutArticle(updatedArticle).catch(err => {
        console.error('Error sending article notifications:', err);
      });
    }

    res.json(updatedArticle);
  } catch (err) {
    console.error('Error updating article status:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Delete article (for admin)
router.delete('/articles/:id', auth, adminAuth, async (req, res) => {
  try {
    const articleId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(articleId)) {
      return res.status(400).json({ error: 'Invalid article ID' });
    }

    const article = await prisma.articles.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    await prisma.articles.delete({
      where: { id: articleId },
    });

    res.json({ message: 'Article deleted successfully' });
  } catch (err) {
    console.error('Error deleting article:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Create admin account (only for existing admins)
router.post('/create-admin', auth, adminAuth, async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ error: 'User with this email already exists' });
    }

    // Validate password length
    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 8 characters long' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin user
    const admin = await prisma.users.create({
      data: {
        email,
        password: hashedPassword,
        role: 'admin',
        firstName: firstName || '',
        lastName: lastName || '',
      },
    });

    // Return user without password
    // eslint-disable-next-line no-unused-vars
    const { password: _, ...adminWithoutPassword } = admin;

    res.json({
      message: 'Admin account created successfully',
      user: adminWithoutPassword,
    });
  } catch (err) {
    console.error('Error creating admin:', err);
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
});

module.exports = router;

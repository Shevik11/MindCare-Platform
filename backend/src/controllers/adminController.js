const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const {
  notifyUsersAboutArticle,
  sendArticleRejectionNotification,
} = require('../utils/email');

const getStats = async (req, res) => {
  try {
    const totalArticles = await prisma.articles.count();
    const totalPsychologists = await prisma.psychologists.count();
    const totalUsers = await prisma.users.count();

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

    const recentActivity = [];

    for (const article of recentArticles) {
      const articleTime = article.updatedAt || article.createdAt;
      if (articleTime) {
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

    for (const psychologist of recentPsychologists) {
      if (psychologist.Users) {
        const psychologistTime =
          psychologist.createdAt || psychologist.updatedAt;
        if (psychologistTime) {
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

    const validActivities = recentActivity.filter(
      activity => activity.time != null
    );
    validActivities.sort((a, b) => {
      const dateA = new Date(a.time);
      const dateB = new Date(b.time);
      if (Number.isNaN(dateA.getTime()) || Number.isNaN(dateB.getTime())) {
        return 0;
      }
      return dateB - dateA;
    });

    const topActivities = validActivities.slice(0, 5);

    res.json({
      stats: {
        totalArticles,
        totalPsychologists,
        totalUsers,
      },
      recentActivity: topActivities
        .map(activity => {
          let timeValue = null;
          if (activity.time) {
            try {
              const date =
                activity.time instanceof Date
                  ? activity.time
                  : new Date(activity.time);

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
        .filter(activity => activity.time !== null),
    });
  } catch (err) {
    console.error('Error getting admin stats:', err);
    res.status(500).json({ error: 'Server Error' });
  }
};

const getPendingPsychologists = async (req, res) => {
  try {
    const psychologists = await prisma.psychologists.findMany({
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
            photoUrl: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const mappedPsychologists = psychologists.map(p => {
      const { Users, price, ...rest } = p;
      return {
        ...rest,
        User: Users || null,
        price: price != null ? Number.parseFloat(price.toString()) : null,
      };
    });

    res.json(mappedPsychologists);
  } catch (err) {
    console.error('Error getting pending psychologists:', err);
    const errorMessage =
      process.env.NODE_ENV === 'development' ? err.message : 'Server Error';
    res.status(500).json({
      error: 'Server Error',
      message: errorMessage,
    });
  }
};

const getAllPsychologists = async (req, res) => {
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

    const psychologistsWithRating = psychologists.map(psychologist => {
      const { Comments, Users, price, ...rest } = psychologist;

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
              role: Users.role || 'psychologist',
            }
          : null,
        price: price != null ? parseFloat(price.toString()) : null,
        averageRating: Math.round(averageRating * 10) / 10,
        totalComments: Comments.length,
      };
    });

    res.json(psychologistsWithRating);
  } catch (err) {
    console.error('Error getting psychologists for admin:', err);
    res.status(500).json({ error: 'Server Error' });
  }
};

const getPsychologistById = async (req, res) => {
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

    let averageRating = 0;
    if (psychologist.Comments && psychologist.Comments.length > 0) {
      const sum = psychologist.Comments.reduce(
        (acc, comment) => acc + comment.rating,
        0
      );
      averageRating = sum / psychologist.Comments.length;
    }

    const { Users, Comments, price, ...rest } = psychologist;
    const mappedComments = Comments.map(comment => {
      const { Users: commentUser, ...commentRest } = comment;
      return {
        ...commentRest,
        User: commentUser || null,
      };
    });

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
};

const blockPsychologistTemporary = async (req, res) => {
  try {
    const psychologistId = Number.parseInt(req.params.id, 10);
    const { days } = req.body;

    if (Number.isNaN(psychologistId)) {
      return res.status(400).json({ error: 'Invalid psychologist ID' });
    }

    if (!days || days < 1) {
      return res.status(400).json({ error: 'Days must be a positive number' });
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
};

const blockPsychologistPermanent = async (req, res) => {
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
};

const unblockPsychologist = async (req, res) => {
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
};

const getPendingArticles = async (req, res) => {
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
};

const getAllArticles = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;

    const where = {};

    if (status && status !== 'all') {
      where.status = status;
    }

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

      if (where.status) {
        where.AND = [{ status: where.status }, searchConditions];
        delete where.status;
      } else {
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
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};

const approveArticle = async (req, res) => {
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

    notifyUsersAboutArticle(updatedArticle).catch(err => {
      console.error('Error sending article notifications:', err);
    });

    res.json(updatedArticle);
  } catch (err) {
    console.error('Error approving article:', err);
    res.status(500).json({ error: 'Server Error' });
  }
};

const rejectArticle = async (req, res) => {
  try {
    const articleId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(articleId)) {
      return res.status(400).json({ error: 'Invalid article ID' });
    }

    const { rejectionReason } = req.body;

    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const article = await prisma.articles.findUnique({
      where: { id: articleId },
      include: {
        Users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            emailNotifications: true,
          },
        },
      },
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
      data: {
        status: 'draft',
        rejectionReason: rejectionReason.trim(),
      },
      include: {
        Users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            emailNotifications: true,
          },
        },
      },
    });

    if (
      article.Users &&
      article.Users.email &&
      article.Users.emailNotifications
    ) {
      const authorName =
        article.Users.firstName && article.Users.lastName
          ? `${article.Users.firstName} ${article.Users.lastName}`
          : article.Users.email;

      sendArticleRejectionNotification(
        article.Users.email,
        authorName,
        updatedArticle,
        rejectionReason.trim()
      ).catch(err => {
        console.error('Error sending article rejection email:', err);
      });
    }

    res.json(updatedArticle);
  } catch (err) {
    console.error('Error rejecting article:', err);
    res.status(500).json({ error: 'Server Error' });
  }
};

const updateArticleStatus = async (req, res) => {
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

    if (status === 'published' && articleBeforeUpdate.status !== 'published') {
      notifyUsersAboutArticle(updatedArticle).catch(err => {
        console.error('Error sending article notifications:', err);
      });
    }

    res.json(updatedArticle);
  } catch (err) {
    console.error('Error updating article status:', err);
    res.status(500).json({ error: 'Server Error' });
  }
};

const approvePsychologist = async (req, res) => {
  try {
    const psychologistId = Number.parseInt(req.params.id, 10);

    if (Number.isNaN(psychologistId)) {
      return res.status(400).json({ error: 'Invalid psychologist ID' });
    }

    const psychologist = await prisma.psychologists.findUnique({
      where: { id: psychologistId },
      include: {
        Users: true,
      },
    });

    if (!psychologist) {
      return res.status(404).json({ error: 'Psychologist not found' });
    }

    const updatedPsychologist = await prisma.psychologists.update({
      where: { id: psychologistId },
      data: { status: 'approved' },
      include: {
        Users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photoUrl: true,
          },
        },
      },
    });

    const { Users, price, ...rest } = updatedPsychologist;
    const mappedPsychologist = {
      ...rest,
      User: Users || null,
      price: price != null ? parseFloat(price.toString()) : null,
    };

    res.json(mappedPsychologist);
  } catch (err) {
    console.error('Error approving psychologist:', err);
    res.status(500).json({ error: 'Server Error' });
  }
};

const rejectPsychologist = async (req, res) => {
  try {
    const psychologistId = Number.parseInt(req.params.id, 10);

    if (Number.isNaN(psychologistId)) {
      return res.status(400).json({ error: 'Invalid psychologist ID' });
    }

    const psychologist = await prisma.psychologists.findUnique({
      where: { id: psychologistId },
    });

    if (!psychologist) {
      return res.status(404).json({ error: 'Psychologist not found' });
    }

    const updatedPsychologist = await prisma.psychologists.update({
      where: { id: psychologistId },
      data: { status: 'rejected' },
      include: {
        Users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photoUrl: true,
          },
        },
      },
    });

    const { Users, price, ...rest } = updatedPsychologist;
    const mappedPsychologist = {
      ...rest,
      User: Users || null,
      price: price != null ? parseFloat(price.toString()) : null,
    };

    res.json(mappedPsychologist);
  } catch (err) {
    console.error('Error rejecting psychologist:', err);
    res.status(500).json({ error: 'Server Error' });
  }
};

const deleteArticle = async (req, res) => {
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
};

const createAdmin = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ error: 'User with this email already exists' });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 8 characters long' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = await prisma.users.create({
      data: {
        email,
        password: hashedPassword,
        role: 'admin',
        firstName: firstName || '',
        lastName: lastName || '',
      },
    });

    // Omit password from response
    // eslint-disable-next-line no-unused-vars
    const { password: _password, ...adminWithoutPassword } = admin;

    res.json({
      message: 'Admin account created successfully',
      user: adminWithoutPassword,
    });
  } catch (err) {
    console.error('Error creating admin:', err);
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};

module.exports = {
  getStats,
  getPendingPsychologists,
  getAllPsychologists,
  getPsychologistById,
  blockPsychologistTemporary,
  blockPsychologistPermanent,
  unblockPsychologist,
  getPendingArticles,
  getAllArticles,
  approveArticle,
  rejectArticle,
  updateArticleStatus,
  approvePsychologist,
  rejectPsychologist,
  deleteArticle,
  createAdmin,
};

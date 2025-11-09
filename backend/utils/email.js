// utils/email.js
const nodemailer = require('nodemailer');

// Create transporter - configure with your email service
// For production, use environment variables for credentials
const createTransporter = () => {
  // Check if email configuration is provided
  if (
    !process.env.EMAIL_HOST ||
    !process.env.EMAIL_USER ||
    !process.env.EMAIL_PASS
  ) {
    console.warn(
      'Email configuration not found. Email notifications will be disabled.'
    );
    console.warn('Missing:', {
      EMAIL_HOST: !process.env.EMAIL_HOST,
      EMAIL_USER: !process.env.EMAIL_USER,
      EMAIL_PASS: !process.env.EMAIL_PASS,
    });
    return null;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number.parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Don't verify immediately - it's async and can cause issues with concurrent calls
  // Verification will happen when sending the first email
  return transporter;
};

// Send article publication notification
const sendArticleNotification = async (
  recipientEmail,
  recipientName,
  article,
  transporter = null
) => {
  // Use provided transporter or create a new one
  const emailTransporter = transporter || createTransporter();

  if (!emailTransporter) {
    console.log(
      `Email transporter not available. Skipping email notification to ${recipientEmail}.`
    );
    console.log(
      'Please configure EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in your .env file.'
    );
    return false;
  }

  // Validate recipient email
  if (!recipientEmail || !recipientEmail.trim()) {
    console.error('Recipient email is empty or invalid');
    return false;
  }

  try {
    const articleUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/article/${article.id}`;

    // Use EMAIL_USER as the from address to avoid SendAsDenied errors
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    if (!fromEmail) {
      console.error('EMAIL_FROM or EMAIL_USER is not configured');
      return false;
    }

    const mailOptions = {
      from: `"MindCare Platform" <${fromEmail}>`,
      to: recipientEmail.trim(),
      subject: `Нова стаття: ${article.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #D32F2F;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .article-title {
              font-size: 24px;
              font-weight: bold;
              color: #D32F2F;
              margin-bottom: 15px;
            }
            .article-description {
              color: #666;
              margin-bottom: 20px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background-color: #D32F2F !important;
              color: #ffffff !important;
              text-decoration: none !important;
              border-radius: 6px;
              margin-top: 20px;
              font-weight: bold;
            }
            a.button {
              color: #ffffff !important;
            }
            a.button:link {
              color: #ffffff !important;
            }
            a.button:visited {
              color: #ffffff !important;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #999;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MindCare Platform</h1>
          </div>
          <div class="content">
            <p>Вітаємо, ${recipientName || 'користувач'}!</p>
            <p>Ми раді повідомити вам про нову статтю на нашій платформі:</p>
            
            <div class="article-title">${article.title}</div>
            
            ${article.description ? `<div class="article-description">${article.description}</div>` : ''}
            
            <a href="${articleUrl}" class="button" style="display: inline-block; padding: 12px 30px; background-color: #D32F2F; color: #ffffff !important; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold;">Читати статтю</a>
            
            <div class="footer">
              <p>Якщо ви не хочете отримувати подібні повідомлення, ви можете відключити їх у налаштуваннях вашого профілю.</p>
              <p>&copy; ${new Date().getFullYear()} MindCare Platform. Всі права захищені.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Вітаємо, ${recipientName || 'користувач'}!

Ми раді повідомити вам про нову статтю на нашій платформі:

${article.title}

${article.description || ''}

Читати статтю: ${articleUrl}

Якщо ви не хочете отримувати подібні повідомлення, ви можете відключити їх у налаштуваннях вашого профілю.

© ${new Date().getFullYear()} MindCare Platform. Всі права захищені.
      `,
    };

    await emailTransporter.sendMail(mailOptions);
    console.log(`Article notification email sent to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error(
      `Error sending email notification to ${recipientEmail}:`,
      error.message || error
    );
    if (error.response) {
      console.error('SMTP response:', error.response);
    }
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.command) {
      console.error('Failed command:', error.command);
    }
    return false;
  }
};

// Send notifications to all users (except admins) when article is published
const notifyUsersAboutArticle = async article => {
  const prisma = require('../db/db');

  try {
    // Get all users who have email notifications enabled and are not admins
    const users = await prisma.users.findMany({
      where: {
        emailNotifications: true,
        role: {
          not: 'admin',
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    // Filter out users with empty or invalid emails
    const validUsers = users.filter(
      user => user.email && user.email.trim().length > 0
    );

    console.log(
      `Sending article notification to ${validUsers.length} users (${users.length - validUsers.length} skipped due to invalid email)`
    );

    if (validUsers.length === 0) {
      console.log('No valid users to send notifications to');
      return { successful: 0, failed: 0, total: 0 };
    }

    // Create a single transporter to avoid concurrent connection limits
    const transporter = createTransporter();

    if (!transporter) {
      console.error(
        'Email transporter not available. Cannot send notifications.'
      );
      return {
        successful: 0,
        failed: validUsers.length,
        total: validUsers.length,
        error: 'Transporter not available',
      };
    }

    let successful = 0;
    let failed = 0;

    // Send emails sequentially to avoid concurrent connection limits
    for (const user of validUsers) {
      const recipientName =
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.email;

      try {
        // Pass the transporter to reuse the same connection
        const result = await sendArticleNotification(
          user.email,
          recipientName,
          article,
          transporter
        );
        if (result) {
          successful++;
          // Add a small delay between emails to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          failed++;
          console.error(
            `Failed to send email to ${user.email}: returned false`
          );
        }
      } catch (error) {
        failed++;
        console.error(
          `Error sending email to ${user.email}:`,
          error.message || error
        );
        // Continue with next email even if one fails
        // Add delay even on error to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(
      `Article notifications sent: ${successful} successful, ${failed} failed`
    );

    return { successful, failed, total: validUsers.length };
  } catch (error) {
    console.error('Error notifying users about article:', error);
    return { successful: 0, failed: 0, total: 0, error: error.message };
  }
};

// Send article rejection notification to author
const sendArticleRejectionNotification = async (
  recipientEmail,
  recipientName,
  article,
  rejectionReason,
  transporter = null
) => {
  const emailTransporter = transporter || createTransporter();

  if (!emailTransporter) {
    console.log(
      `Email transporter not available. Skipping rejection email to ${recipientEmail}.`
    );
    return false;
  }

  if (!recipientEmail || !recipientEmail.trim()) {
    console.error('Recipient email is empty or invalid');
    return false;
  }

  try {
    const articleEditUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/articles/${article.id}/edit`;
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;

    if (!fromEmail) {
      console.error('EMAIL_FROM or EMAIL_USER is not configured');
      return false;
    }

    const mailOptions = {
      from: `"MindCare Platform" <${fromEmail}>`,
      to: recipientEmail,
      subject: 'Вашу статтю відхилено на модерації',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #D32F2F;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .article-title {
              font-size: 20px;
              font-weight: bold;
              color: #333;
              margin-bottom: 15px;
            }
            .rejection-reason {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .rejection-reason-title {
              font-weight: bold;
              color: #856404;
              margin-bottom: 10px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background-color: #D32F2F !important;
              color: #ffffff !important;
              text-decoration: none !important;
              border-radius: 6px;
              margin-top: 20px;
              font-weight: bold;
            }
            a.button {
              color: #ffffff !important;
            }
            a.button:link {
              color: #ffffff !important;
            }
            a.button:visited {
              color: #ffffff !important;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #999;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MindCare Platform</h1>
          </div>
          <div class="content">
            <p>Вітаємо, ${recipientName || 'користувач'}!</p>
            <p>На жаль, вашу статтю було відхилено під час модерації.</p>
            
            <div class="article-title">${article.title}</div>
            
            <div class="rejection-reason">
              <div class="rejection-reason-title">Причина відхилення:</div>
              <div>${rejectionReason || 'Причина не вказана'}</div>
            </div>
            
            <p>Стаття переведена у статус "Чернетка". Ви можете:</p>
            <ul>
              <li>Відредагувати статтю з урахуванням зауважень</li>
              <li>Відправити її на модерацію знову</li>
              <li>Видалити статтю, якщо вважаєте за потрібне</li>
            </ul>
            
            <a href="${articleEditUrl}" class="button" style="display: inline-block; padding: 12px 30px; background-color: #D32F2F; color: #ffffff !important; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold;">Редагувати статтю</a>
            
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} MindCare Platform. Всі права захищені.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Вітаємо, ${recipientName || 'користувач'}!

На жаль, вашу статтю було відхилено під час модерації.

${article.title}

Причина відхилення:
${rejectionReason || 'Причина не вказана'}

Стаття переведена у статус "Чернетка". Ви можете відредагувати статтю з урахуванням зауважень або видалити її.

Редагувати статтю: ${articleEditUrl}

© ${new Date().getFullYear()} MindCare Platform. Всі права захищені.
      `,
    };

    await emailTransporter.sendMail(mailOptions);
    console.log(`Article rejection email sent to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error(
      `Error sending rejection email to ${recipientEmail}:`,
      error.message || error
    );
    return false;
  }
};

// Send appointment notification to psychologist
const sendAppointmentNotificationEmail = async ({
  psychologistEmail,
  psychologistName,
  patientName,
  appointmentDateTime,
  transporter = null,
}) => {
  const emailTransporter = transporter || createTransporter();

  if (!emailTransporter) {
    console.log(
      `Email transporter not available. Skipping appointment notification to ${psychologistEmail}.`
    );
    return false;
  }

  if (!psychologistEmail || !psychologistEmail.trim()) {
    console.error('Psychologist email is empty or invalid');
    return false;
  }

  try {
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    if (!fromEmail) {
      console.error('EMAIL_FROM or EMAIL_USER is not configured');
      return false;
    }

    const appointmentDate = new Date(appointmentDateTime);
    const formattedDate = appointmentDate.toLocaleDateString('uk-UA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = appointmentDate.toLocaleTimeString('uk-UA', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const mailOptions = {
      from: `"MindCare Platform" <${fromEmail}>`,
      to: psychologistEmail.trim(),
      subject: `Новий запис на сеанс - ${formattedDate} о ${formattedTime}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #D32F2F;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .appointment-info {
              background-color: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #D32F2F;
            }
            .info-row {
              margin: 10px 0;
            }
            .info-label {
              font-weight: bold;
              color: #666;
            }
            .info-value {
              color: #333;
              margin-top: 5px;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #999;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MindCare Platform</h1>
          </div>
          <div class="content">
            <p>Вітаємо, ${psychologistName || 'користувач'}!</p>
            <p>У вас новий запис на сеанс.</p>
            
            <div class="appointment-info">
              <div class="info-row">
                <div class="info-label">Пацієнт:</div>
                <div class="info-value">${patientName || 'Не вказано'}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Дата та час:</div>
                <div class="info-value">${formattedDate} о ${formattedTime}</div>
              </div>
            </div>
            
            <p>Будь ласка, перевірте ваш розклад та підтвердіть запис.</p>
            
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} MindCare Platform. Всі права захищені.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Вітаємо, ${psychologistName || 'користувач'}!

У вас новий запис на сеанс.

Пацієнт: ${patientName || 'Не вказано'}
Дата та час: ${formattedDate} о ${formattedTime}

Будь ласка, перевірте ваш розклад та підтвердіть запис.

© ${new Date().getFullYear()} MindCare Platform. Всі права захищені.
      `,
    };

    await emailTransporter.sendMail(mailOptions);
    console.log(`Appointment notification email sent to ${psychologistEmail}`);
    return true;
  } catch (error) {
    console.error(
      `Error sending appointment notification email to ${psychologistEmail}:`,
      error.message || error
    );
    return false;
  }
};

module.exports = {
  sendArticleNotification,
  notifyUsersAboutArticle,
  sendArticleRejectionNotification,
  sendAppointmentNotificationEmail,
};

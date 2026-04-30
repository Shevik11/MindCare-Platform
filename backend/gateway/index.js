require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();

const SERVICES = {
  auth:          process.env.AUTH_PORT          || 5001,
  psychologist:  process.env.PSYCHOLOGIST_PORT  || 5002,
  article:       process.env.ARTICLE_PORT       || 5003,
  appointment:   process.env.APPOINTMENT_PORT   || 5004,
  admin:         process.env.ADMIN_PORT         || 5005,
  comment:       process.env.COMMENT_PORT       || 5006,
};

const proxy = (port, pathPrefix) =>
  createProxyMiddleware({
    target: `http://localhost:${port}`,
    changeOrigin: true,
    pathRewrite: { [`^/api/${pathPrefix}`]: '' },
  });

app.use('/api/auth',           proxy(SERVICES.auth,         'auth'));
app.use('/api/psychologists',  proxy(SERVICES.psychologist, 'psychologists'));
app.use('/api/articles',       proxy(SERVICES.article,      'articles'));
app.use('/api/appointments',   proxy(SERVICES.appointment,  'appointments'));
app.use('/api/admin',          proxy(SERVICES.admin,        'admin'));
app.use('/api/comments',       proxy(SERVICES.comment,      'comments'));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req, res) => res.json({ status: 'Gateway running', services: SERVICES }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Gateway running on port ${PORT}`));

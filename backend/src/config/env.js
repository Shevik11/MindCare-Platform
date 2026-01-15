// Environment variable validation
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];

const optionalEnvVars = {
  PORT: '5000',
  NODE_ENV: 'development',
  FRONTEND_URL: 'http://localhost:3000',
};

function validateEnv() {
  const missing = requiredEnvVars.filter(key => !process.env[key]);

  if (missing.length > 0) {
    const error = new Error(
      `Missing required environment variables: ${missing.join(', ')}. Please set these variables in your .env file`
    );
    console.error(error.message);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  // Set optional defaults
  Object.entries(optionalEnvVars).forEach(([key, defaultValue]) => {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
    }
  });

  // Validate JWT_SECRET strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn(
      'Warning: JWT_SECRET should be at least 32 characters long for security'
    );
  }
}

module.exports = { validateEnv };

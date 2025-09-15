export default () => ({
  port: parseInt(process.env.PORT || '4000', 10),
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  cookie: {
    name: process.env.COOKIE_NAME || 'opd_session',
    maxAge: parseInt(process.env.COOKIE_MAX_AGE || '604800000', 10),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
  },
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
});
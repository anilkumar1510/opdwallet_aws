export default () => ({
  port: parseInt(process.env.API_PORT || process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production',
    expiresIn: process.env.JWT_EXPIRY || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRY || '30d',
  },
  cookie: {
    name: process.env.COOKIE_NAME || 'opd_session',
    maxAge: parseInt(process.env.COOKIE_MAX_AGE || '604800000', 10),
    httpOnly: true,
    secure: process.env.COOKIE_SECURE !== undefined
      ? process.env.COOKIE_SECURE === 'true'
      : process.env.NODE_ENV === 'production',
    sameSite: (process.env.COOKIE_SAMESITE || 'lax') as 'strict' | 'lax' | 'none',
    domain: process.env.COOKIE_DOMAIN || undefined,
  },
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  },
  security: {
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
    lockTime: parseInt(process.env.LOCK_TIME || '86400000', 10), // 24 hours
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10),
    maxGlobal: parseInt(process.env.RATE_LIMIT_GLOBAL || '100', 10),
    maxAuth: parseInt(process.env.RATE_LIMIT_AUTH || '5', 10),
    maxApi: parseInt(process.env.RATE_LIMIT_API || '1000', 10),
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001,http://localhost:3002',
    credentials: process.env.CORS_CREDENTIALS !== 'false',
  },
  audit: {
    enabled: process.env.AUDIT_LOG_ENABLED === 'true',
    retentionDays: parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '730', 10),
  },
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    dbQueryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '5000', 10),
    dbPoolSize: parseInt(process.env.DB_POOL_SIZE || '10', 10),
  },
});
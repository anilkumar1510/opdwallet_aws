import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import rateLimit from 'express-rate-limit';
import { secretsManager } from './config/secrets-manager';
import { mkdirSync, existsSync } from 'fs';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  logger.log('Starting OPD Wallet API Server v1.0.1');

  // Ensure upload directories exist
  const uploadDirs = [
    './uploads/claims',
    './uploads/lab-prescriptions',
    './uploads/lab-reports',
    './uploads/doctors',
  ];

  uploadDirs.forEach(dir => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      logger.log(`Created upload directory: ${dir}`);
    }
  });

  // Load secrets from AWS Secrets Manager (if in production)
  if (process.env.NODE_ENV === 'production' || process.env.USE_SECRETS_MANAGER === 'true') {
    try {
      await secretsManager.loadSecretsToEnv();
      logger.log('Secrets loaded from AWS Secrets Manager');
    } catch (_error) {
      logger.warn('Failed to load secrets from AWS Secrets Manager, using environment variables');
    }
  }

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });
  const configService = app.get(ConfigService);

  // Security Headers (Rule #5)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  app.use(cookieParser());

  // CORS Configuration (Production-ready)
  const isProduction = configService.get('NODE_ENV') === 'production';
  const corsOrigins = isProduction
    ? configService.get<string>('CORS_ORIGIN', '').split(',')
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3003',
        'http://13.60.210.156',
        'https://13.60.210.156',
      ];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  });

  // Add CORS headers for static file uploads
  app.use('/uploads', (req: any, res: any, next: any) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    next();
  });

  // Global Rate Limiting (Rule #5)
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: isProduction ? 100 : 1000, // limit each IP to 1000 requests per windowMs in dev, 100 in prod
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // Auth endpoints stricter rate limiting
  app.use(
    '/api/auth/login',
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: isProduction ? 50 : 500, // limit each IP to 500 login attempts per windowMs in dev, 50 in prod
      message: 'Too many login attempts, please try again later.',
      skipSuccessfulRequests: true,
    }),
  );

  // Input Validation (Rule #5)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: isProduction,
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  app.setGlobalPrefix('api');

  // Swagger Configuration
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('OPD Wallet API')
      .setDescription('Corporate OPD Wallet Platform API Documentation')
      .setVersion('1.0')
      .addCookieAuth('opd_session')
      .addServer(`http://localhost:${configService.get<number>('PORT', 4001)}`)
      .addServer('https://api.opdwallet.com')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = configService.get<number>('PORT', 4001);
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📊 Environment: ${configService.get('NODE_ENV')}`);
  logger.log(`🔒 Security: Helmet, CORS, Rate Limiting enabled`);

  if (!isProduction) {
    logger.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
  }
}

bootstrap();
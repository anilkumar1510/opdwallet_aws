import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger, ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { verify as verifyJwt } from 'jsonwebtoken';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import rateLimit from 'express-rate-limit';
import { secretsManager } from './config/secrets-manager';
import { mkdirSync, existsSync } from 'fs';

@Catch()
class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Flatten the exception into a plain string so clients can render it
    // directly. HttpException.getResponse() is usually an object
    // ({ message, error, statusCode }) and passing that straight to the client
    // caused React "Objects are not valid as a React child" crashes.
    let message: string;
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else {
        const inner = (res as Record<string, unknown>)?.message;
        message = Array.isArray(inner)
          ? inner.join(', ')
          : typeof inner === 'string'
            ? inner
            : exception.message;
      }
    } else {
      message = 'Internal server error';
    }

    // Log the full error details
    const timestamp = new Date().toISOString();
    this.logger.error(`❌ [${timestamp}] ${request.method} ${request.url} - Status: ${status}`);
    this.logger.error(`❌ [${timestamp}] Exception:`, exception);
    if (exception instanceof Error) {
      this.logger.error(`❌ [${timestamp}] Error message: ${exception.message}`);
      this.logger.error(`❌ [${timestamp}] Stack trace:`, exception.stack);
    }

    response.status(status).json({
      statusCode: status,
      timestamp,
      path: request.url,
      message,
    });
  }
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  logger.log('Starting OPD Wallet API Server v1.0.1');

  // Ensure upload directories exist
  const uploadDirs = [
    './uploads/claims',
    './uploads/lab-prescriptions',
    './uploads/lab-reports',
    './uploads/diagnostic-prescriptions',
    './uploads/diagnostic-reports',
    './uploads/doctors',
    './uploads/prescriptions',
    './uploads/prescriptions/generated',
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

  // Global Request Logger - Log ALL incoming requests
  app.use((req: any, res: any, next: any) => {
    const timestamp = new Date().toISOString();
    console.log(`🌐 [${timestamp}] ${req.method} ${req.url}`);
    console.log(`   Headers:`, {
      cookie: req.headers.cookie ? 'present' : 'missing',
      origin: req.headers.origin,
      referer: req.headers.referer,
    });
    next();
  });

  // CORS Configuration (Production-ready)
  const isProduction = configService.get('NODE_ENV') === 'production';
  const corsOrigins = isProduction
    ? configService.get<string>('CORS_ORIGIN', '').split(',')
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3003',
        'http://localhost:3004',  // TPA portal
        'http://localhost:3005',  // Operations portal
        'http://localhost:3006',  // Finance portal
        'http://localhost:8081',  // React Native (Expo) web
        'http://localhost:8082',  // React Native (Expo) web alt port
        'http://localhost:8083',  // React Native (Expo) web alt port
        'http://localhost:19006', // Expo web default port
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

  /*
   * Require a session for the static uploads mount.
   *
   * ServeStaticModule publishes the whole uploads tree at /api/uploads
   * (app.module.ts), and it served EVERY file — diagnostic and lab reports,
   * prescriptions, claim documents, doctor signatures — to anyone who could
   * reach the API, with no account at all. Filenames are returned in ordinary
   * API responses, so they were never a secret either.
   *
   * Mounted here rather than as module middleware because ServeStaticModule
   * binds its own middleware during module init and answers the request before
   * anything registered in AppModule.configure() is reached. app.use() during
   * bootstrap lands ahead of both. Verified: as module middleware this did not
   * run at all and anonymous requests still returned 200.
   *
   * This closes ANONYMOUS access, not per-file authorisation: a signed-in
   * member who knows another member's filename can still fetch it here. The
   * per-resource download routes (lab, diagnostics and AHC reports) load the
   * record and check ownership before streaming, and are the path consumers
   * should move onto so this mount can eventually be removed.
   */
  app.use('/api/uploads', (req: any, res: any, next: any) => {
    const header: string | undefined = req.headers?.authorization;
    const token = header?.startsWith('Bearer ')
      ? header.slice('Bearer '.length)
      : req.cookies?.[configService.get<string>('cookie.name') || 'opd_session'];

    if (!token) {
      return res.status(401).json({ statusCode: 401, message: 'Sign in to view this file' });
    }

    try {
      verifyJwt(token, configService.get<string>('jwt.secret') || 'dev_jwt_secret');
      return next();
    } catch {
      // Expired, tampered and foreign tokens are all the same answer here:
      // which one it was is not the caller's business.
      return res.status(401).json({ statusCode: 401, message: 'Sign in to view this file' });
    }
  });

  // Global Rate Limiting (Rule #5)
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: isProduction ? 1000 : 100000, // 1000/IP in prod; very high in dev (multiple portals + devices share one IP)
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
      max: isProduction ? 50 : 10000, // 50/IP in prod; very high in dev
      message: 'Too many login attempts, please try again later.',
      skipSuccessfulRequests: true,
    }),
  );

  // Global Exception Filter - catches ALL errors and logs them
  app.useGlobalFilters(new AllExceptionsFilter());

  // Input Validation (Rule #5)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: false, // Enable error messages even in production for debugging
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

bootstrap();// New comment
// Test change $(date)

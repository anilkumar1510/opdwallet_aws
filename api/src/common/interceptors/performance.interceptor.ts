import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Performance');
  private readonly isMonitoringEnabled: boolean;
  private readonly queryTimeout: number;

  constructor(private configService: ConfigService) {
    this.isMonitoringEnabled = this.configService.get<boolean>('monitoring.enabled', false);
    this.queryTimeout = this.configService.get<number>('monitoring.dbQueryTimeout', 5000);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (!this.isMonitoringEnabled) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const responseTime = Date.now() - now;

          // Log slow requests (>1000ms)
          if (responseTime > 1000) {
            this.logger.warn(
              `Slow request detected: ${method} ${url} - ${responseTime}ms`,
            );
          }

          // Log performance metrics
          this.logger.debug(
            `${method} ${url} - ${responseTime}ms`,
          );

          // Track API response times for monitoring
          if (responseTime > 300) {
            this.logger.log({
              type: 'PERFORMANCE_METRIC',
              method,
              url,
              responseTime,
              timestamp: new Date().toISOString(),
            });
          }
        },
        error: (error) => {
          const responseTime = Date.now() - now;
          this.logger.error(
            `Request failed: ${method} ${url} - ${responseTime}ms - ${error.message}`,
          );
        },
      }),
    );
  }
}
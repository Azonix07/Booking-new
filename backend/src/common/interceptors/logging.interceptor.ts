import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';

/**
 * Global logging interceptor.
 * Logs method, URL, response status, and duration for every request.
 * Helps identify slow endpoints in production.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const { method, url } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse();
        const duration = Date.now() - start;
        const statusCode = res.statusCode;

        // Only log slow requests (>500ms) at warn level, rest at debug
        if (duration > 500) {
          this.logger.warn(`${method} ${url} ${statusCode} — ${duration}ms [SLOW]`);
        } else {
          this.logger.debug(`${method} ${url} ${statusCode} — ${duration}ms`);
        }
      }),
    );
  }
}

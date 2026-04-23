import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { Error as MongooseError } from 'mongoose';

/**
 * Global exception filter.
 * Normalises all error responses to a consistent shape and
 * handles Mongoose validation errors, duplicate key errors, etc.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      message =
        typeof exResponse === 'string'
          ? exResponse
          : (exResponse as any).message || exception.message;
    } else if (exception instanceof MongooseError.ValidationError) {
      // Mongoose schema-level validation
      status = HttpStatus.BAD_REQUEST;
      message = Object.values(exception.errors).map((e) => e.message);
    } else if (this.isMongoError(exception) && exception.code === 11000) {
      // MongoDB duplicate key
      status = HttpStatus.CONFLICT;
      const field = Object.keys((exception as any).keyPattern || {})[0] || 'field';
      message = `Duplicate value for ${field}`;
    }

    // Log server errors with stack traces, client errors at debug level
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} — ${status}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else if (status >= 400) {
      this.logger.debug(
        `${request.method} ${request.url} — ${status}: ${Array.isArray(message) ? message.join(', ') : message}`,
      );
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private isMongoError(err: unknown): err is { code: number } {
    return typeof err === 'object' && err !== null && 'code' in err;
  }
}

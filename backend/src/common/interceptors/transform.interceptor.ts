import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseFormat<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResponseFormat<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseFormat<T>> {
    return next.handle().pipe(
      map((payload) => {
        // If the controller already returned a custom format with success flag, pass it through
        if (payload && typeof payload === 'object' && 'success' in payload) {
          return payload;
        }

        let message = 'Success';
        let data = payload;

        if (payload && typeof payload === 'object' && 'message' in payload && 'data' in payload) {
          message = payload.message;
          data = payload.data;
        }

        return {
          success: true,
          message,
          data,
        };
      }),
    );
  }
}


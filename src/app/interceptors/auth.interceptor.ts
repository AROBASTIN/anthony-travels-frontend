import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { Observable, throwError, BehaviorSubject, catchError, switchMap, filter, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
let refreshTokenSubject = new BehaviorSubject<any>(null);

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const injector = inject(Injector);
  // Get token directly from localStorage to break immediate circular dependency on app start
  const token = localStorage.getItem('access_token');

  let authReq = req;
  if (token) {
    authReq = addTokenHeader(req, token);
  }

  return next(authReq).pipe(
    catchError((error: any) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !authReq.url.includes('/auth/login') && !authReq.url.includes('/auth/refresh')) {
        // Resolve AuthService dynamically to handle refresh token exchange
        const authService = injector.get(AuthService);
        return handle401Error(authReq, next, authService);
      }
      return throwError(() => error);
    })
  );
};

function addTokenHeader(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return request.clone({ headers: request.headers.set('Authorization', `Bearer ${token}`) });
}

function handle401Error(request: HttpRequest<unknown>, next: HttpHandlerFn, authService: AuthService): Observable<HttpEvent<unknown>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((token: any) => {
        isRefreshing = false;
        refreshTokenSubject.next(token.access_token);
        return next(addTokenHeader(request, token.access_token));
      }),
      catchError((err) => {
        isRefreshing = false;
        authService.logout();
        return throwError(() => err);
      })
    );
  } else {
    return refreshTokenSubject.pipe(
      filter(token => token != null),
      take(1),
      switchMap(jwt => {
        return next(addTokenHeader(request, jwt));
      })
    );
  }
}

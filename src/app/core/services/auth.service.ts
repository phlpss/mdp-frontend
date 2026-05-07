import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthTokens, LoginRequest, LoginResponse, User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  login(req: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/auth/login`, req).pipe(
      tap(res => this.storeTokens(res.tokens))
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.base}/auth/logout`, {}).pipe(
      tap(() => this.clearTokens())
    );
  }

  refreshToken(): Observable<AuthTokens> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<AuthTokens>(`${this.base}/auth/refresh`, { refreshToken }).pipe(
      tap(tokens => this.storeTokens(tokens))
    );
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.base}/auth/me`);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(environment.jwtTokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(environment.refreshTokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  private storeTokens(tokens: AuthTokens): void {
    localStorage.setItem(environment.jwtTokenKey, tokens.accessToken);
    localStorage.setItem(environment.refreshTokenKey, tokens.refreshToken);
  }

  clearTokens(): void {
    localStorage.removeItem(environment.jwtTokenKey);
    localStorage.removeItem(environment.refreshTokenKey);
  }
}

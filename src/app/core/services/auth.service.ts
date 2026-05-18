import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, map, tap} from 'rxjs';
import {environment} from '@env/environment';
import {AuthTokens, LoginRequest, LoginResponse, User, UserRole} from '../models/user.model';

/** Shape returned by the backend /auth/login endpoint. */
interface BackendLoginResponse {
    token: string;
    username: string;
    userId: string;
    roles: string[];
    expiresIn: number;
}

@Injectable({providedIn: 'root'})
export class AuthService {
    private readonly base = environment.apiBaseUrl;

    constructor(private http: HttpClient) {
    }

    login(req: LoginRequest): Observable<LoginResponse> {
        return this.http.post<BackendLoginResponse>(`${this.base}/auth/login`, req).pipe(
            map(res => this.mapLoginResponse(res)),
            tap(res => this.storeTokens(res.tokens))
        );
    }


    /** Translates backend role strings to the frontend UserRole union. */
    private static mapRole(backendRole: string): UserRole | null {
        const map: Record<string, UserRole> = {
            BARISTA: 'BARISTA',
            WAITER: 'EMPLOYEE',
            CASHIER: 'CASHIER',
            CLEANER: 'EMPLOYEE',
            SHIFT_SUPERVISOR: 'SUPERVISOR',
            STORE_MANAGER: 'MANAGER',
            HR_MANAGER: 'HR',
            ACCOUNTANT: 'ACCOUNTANT',
            MARKETING: 'EMPLOYEE',
            BUSINESS_OWNER: 'OWNER',
            IT_SPECIALIST: 'IT_ADMIN',
        };
        return map[backendRole] ?? null;
    }

    /** Maps the backend flat response to the LoginResponse shape used by the store. */
    private mapLoginResponse(res: BackendLoginResponse): LoginResponse {
        const user: User = {
            id: res.userId,
            username: res.username,
            email: '',          // not returned by backend yet
            fullName: res.username,
            roles: res.roles.map(AuthService.mapRole).filter((r): r is UserRole => r !== null),
            locationId: null,
            isActive: true,
        };

        const tokens: AuthTokens = {
            accessToken: res.token,
            refreshToken: '',        // backend doesn't issue refresh tokens yet
            expiresIn: res.expiresIn,
        };

        return {user, tokens};
    }

    logout(): Observable<void> {
        return this.http.post<void>(`${this.base}/auth/logout`, {}).pipe(
            tap(() => this.clearTokens())
        );
    }

    refreshToken(): Observable<AuthTokens> {
        const refreshToken = this.getRefreshToken();
        return this.http.post<AuthTokens>(`${this.base}/auth/refresh`, {refreshToken}).pipe(
            tap(tokens => this.storeTokens(tokens))
        );
    }

    getCurrentUser(): Observable<User> {
        return this.http.get<any>(`${this.base}/auth/me`).pipe(
            map(res => ({
                ...res,
                fullName: (res.fullName ?? `${res.firstName ?? ''} ${res.lastName ?? ''}`.trim() )|| res.username,
                roles: (res.roles ?? []).map(AuthService.mapRole).filter((r: UserRole | null): r is UserRole => r !== null),
            }))
        );
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
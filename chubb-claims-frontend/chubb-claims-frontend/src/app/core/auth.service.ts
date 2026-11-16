import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthUser, LoginRequest, LoginResponse } from './models';

const TOKEN_KEY = 'chubb_access_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenSignal = signal<string | null>(sessionStorage.getItem(TOKEN_KEY));
  readonly token = this.tokenSignal.asReadonly();
  readonly user = computed<AuthUser | null>(() => this.readUser(this.tokenSignal()));

  constructor(private readonly http: HttpClient) {}

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/v1/auth/login', request).pipe(
      tap(response => {
        sessionStorage.setItem(TOKEN_KEY, response.accessToken);
        this.tokenSignal.set(response.accessToken);
      })
    );
  }

  logout(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    this.tokenSignal.set(null);
  }

  isAuthenticated(): boolean {
    return !!this.tokenSignal();
  }

  hasAnyRole(...roles: string[]): boolean {
    const current = this.user();
    return !!current && roles.some(role => current.roles.includes(role) || current.roles.includes(`ROLE_${role}`));
  }

  private readUser(token: string | null): AuthUser | null {
    if (!token) return null;
    try {
      const payloadPart = token.split('.')[1];
      const raw = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const normalized = raw.padEnd(raw.length + ((4 - raw.length % 4) % 4), '=');
      const payload = JSON.parse(atob(normalized)) as { sub?: string; roles?: string[]; exp?: number };
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        this.logout();
        return null;
      }
      return { username: payload.sub ?? 'Unknown user', roles: payload.roles ?? [] };
    } catch {
      return null;
    }
  }
}

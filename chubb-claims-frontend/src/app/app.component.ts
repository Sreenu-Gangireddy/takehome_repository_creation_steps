import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-frame">
      @if (auth.user(); as user) {
        <header class="topbar">
          <a class="brand" routerLink="/dashboard" aria-label="Chubb Claims home">
            <span class="brand-mark">C</span>
            <span class="brand-copy">
              <strong>CHUBB</strong>
              <small>CLAIMS WORKSPACE</small>
            </span>
          </a>
          <nav class="main-nav">
            <a routerLink="/dashboard" routerLinkActive="active">Overview</a>
            <a routerLink="/claims/new" routerLinkActive="active">New claim</a>
          </nav>
          <div class="user-area">
            <span class="role-pill">{{ roleLabel() }}</span>
            <span class="user-initial">{{ initials(user.username) }}</span>
            <span class="user-name">{{ user.username }}</span>
            <button class="btn btn-quiet btn-small" (click)="logout()">Sign out</button>
          </div>
        </header>
      }
      <main [class.content-with-nav]="auth.isAuthenticated()">
        <router-outlet />
      </main>
      <footer class="footer">
        <span>CHUBB APAC · Claims Management</span>
        <span>Assessment workspace · Local development</span>
      </footer>
    </div>
  `,
  styles: [`
    .app-frame { min-height: 100vh; display: flex; flex-direction: column; }
    .topbar { height: 76px; padding: 0 5vw; display:flex; align-items:center; gap:42px; background:#10243b; color:#fff; box-shadow:0 8px 30px #0b1c2c22; }
    .brand { display:flex; align-items:center; gap:12px; text-decoration:none; color:white; min-width:200px; }
    .brand-mark { width:38px;height:38px;border-radius:11px;background:#f3a638;color:#10243b;display:grid;place-items:center;font-weight:900;font-size:23px; }
    .brand-copy { display:flex; flex-direction:column; line-height:1.05; letter-spacing:.16em; }
    .brand-copy strong { font-size:16px; }.brand-copy small { margin-top:5px;color:#a9bacb;font-size:9px;letter-spacing:.19em; }
    .main-nav { display:flex; align-items:center; gap:8px; flex:1; height:100%; }
    .main-nav a { text-decoration:none; color:#c1ceda; padding:10px 15px; border-radius:8px; font-size:13px; font-weight:650; }
    .main-nav a:hover,.main-nav a.active { color:#fff; background:#ffffff17; }
    .user-area { display:flex; align-items:center; gap:12px; }
    .role-pill { padding:6px 9px;border:1px solid #496078;border-radius:99px;color:#d9e4ef;font-size:10px;font-weight:800;letter-spacing:.08em; }
    .user-initial { width:31px;height:31px;display:grid;place-items:center;background:#e9eff5;color:#10243b;border-radius:50%;font-size:11px;font-weight:800; }
    .user-name { max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#e6edf4;font-size:12px; }
    .content-with-nav { flex:1; }
    .footer { display:flex;justify-content:space-between;padding:20px 5vw;color:#8291a0;font-size:10px;letter-spacing:.04em; }
    @media(max-width:780px) { .topbar{height:auto;min-height:72px;padding:14px 20px;flex-wrap:wrap;gap:12px}.brand{min-width:unset}.main-nav{order:3;width:100%;height:auto}.user-area{margin-left:auto}.user-name,.role-pill{display:none}.footer{padding:16px 20px;gap:8px;flex-direction:column} }
  `]
})
export class AppComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  roleLabel = computed(() => {
    const roles = this.auth.user()?.roles ?? [];
    if (roles.includes('ROLE_MANAGER')) return 'MANAGER';
    if (roles.includes('ROLE_OFFICER')) return 'CLAIMS OFFICER';
    return 'CLAIMANT';
  });
  initials(value: string): string {
    return value.split('@')[0].split(/[._ -]/).filter(Boolean).slice(0, 2).map(x => x[0].toUpperCase()).join('');
  }
  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}

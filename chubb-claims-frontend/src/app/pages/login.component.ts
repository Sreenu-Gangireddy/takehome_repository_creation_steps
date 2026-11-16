import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="login-layout">
      <div class="login-visual">
        <div class="visual-kicker">CHUBB APAC · ENGINEERING</div>
        <div class="visual-title">Claims handled<br><em>with clarity.</em></div>
        <p class="visual-copy">A connected workspace for claimants and claims teams to move every case forward with confidence.</p>
        <div class="visual-stat-row">
          <div><strong>01</strong><span>Report</span></div>
          <div><strong>02</strong><span>Review</span></div>
          <div><strong>03</strong><span>Resolve</span></div>
        </div>
        <div class="visual-orbit orbit-one"></div><div class="visual-orbit orbit-two"></div>
        <div class="visual-footer">INSURANCE. BUILT AROUND YOU.</div>
      </div>
      <div class="login-panel">
        <div class="panel-inner">
          <div class="eyebrow">WELCOME BACK</div>
          <h1>Sign in to your<br><span>claims workspace</span></h1>
          <p class="muted">Use your assessment demo account to continue.</p>
          <form [formGroup]="form" (ngSubmit)="submit()" class="form-stack">
            <label>Email address
              <input type="email" formControlName="username" placeholder="name@company.com" autocomplete="username">
            </label>
            <label>Password
              <input type="password" formControlName="password" placeholder="Enter your password" autocomplete="current-password">
            </label>
            @if (error()) { <div class="alert alert-error">{{ error() }}</div> }
            <button class="btn btn-primary btn-wide" type="submit" [disabled]="form.invalid || loading()">
              {{ loading() ? 'Signing in…' : 'Sign in' }} <span aria-hidden="true">→</span>
            </button>
          </form>
          <div class="demo-box">
            <div class="demo-heading">DEMO ACCESS</div>
            <div class="demo-row"><span>Claimant</span><button type="button" (click)="useDemo('claimant')">Use account</button></div>
            <div class="demo-row"><span>Claims officer</span><button type="button" (click)="useDemo('officer')">Use account</button></div>
            <div class="demo-row"><span>Manager</span><button type="button" (click)="useDemo('manager')">Use account</button></div>
            <small>Demo credentials are configured in the backend SecurityConfig.</small>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .login-layout{min-height:calc(100vh - 58px);display:grid;grid-template-columns:1.02fr .98fr;background:#f6f8fa}
    .login-visual{position:relative;overflow:hidden;background:linear-gradient(145deg,#10243b 0%,#173a59 58%,#245a76 100%);color:white;padding:10vh 8vw;display:flex;flex-direction:column;justify-content:center}
    .visual-kicker,.eyebrow{font-size:10px;font-weight:850;letter-spacing:.2em;color:#c4d1dd}
    .visual-title{position:relative;z-index:1;margin-top:28px;font-size:clamp(44px,5.2vw,76px);line-height:1.02;letter-spacing:-.055em;font-weight:750}
    .visual-title em{font-family:Georgia,serif;font-weight:400;color:#f1b34e}
    .visual-copy{position:relative;z-index:1;max-width:390px;color:#c4d1dd;font-size:15px;line-height:1.8;margin-top:25px}
    .visual-stat-row{display:flex;gap:45px;margin-top:58px;position:relative;z-index:1}
    .visual-stat-row div{display:flex;flex-direction:column;gap:7px}.visual-stat-row strong{color:#f3b348;font-size:18px}.visual-stat-row span{color:#d7e2eb;font-size:11px;letter-spacing:.08em;text-transform:uppercase}
    .visual-footer{position:absolute;left:8vw;bottom:38px;color:#9db0c1;font-size:9px;letter-spacing:.19em}
    .visual-orbit{position:absolute;border:1px solid #ffffff13;border-radius:50%;pointer-events:none}.orbit-one{width:520px;height:520px;right:-245px;top:-80px}.orbit-two{width:760px;height:760px;right:-365px;top:-200px}
    .login-panel{display:grid;place-items:center;padding:55px 28px}.panel-inner{width:min(420px,100%)}
    .eyebrow{color:#af7b25}.panel-inner h1{margin:15px 0 10px;color:#162c43;font-size:36px;line-height:1.12;letter-spacing:-.045em}.panel-inner h1 span{font-family:Georgia,serif;font-weight:400;color:#b77a1e}
    .muted{color:#778696;font-size:13px;margin:0 0 30px}.form-stack{display:grid;gap:17px}.form-stack label{display:grid;gap:8px;color:#34485b;font-size:12px;font-weight:750}
    input,select,textarea{width:100%;border:1px solid #d8e0e7;border-radius:9px;background:white;padding:12px 13px;color:#263b50;font:inherit;font-size:13px;outline:none;transition:border .15s,box-shadow .15s}
    input:focus,select:focus,textarea:focus{border-color:#3a7192;box-shadow:0 0 0 3px #39749318}
    .demo-box{margin-top:30px;padding:17px 18px;border:1px solid #e0e6eb;border-radius:12px;background:#fff}
    .demo-heading{font-size:9px;letter-spacing:.18em;color:#9aa7b2;font-weight:850;margin-bottom:8px}.demo-row{display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eff2f5;color:#42576a;font-size:12px}.demo-row button{border:0;background:none;color:#9b6d20;font-size:11px;font-weight:800;cursor:pointer}.demo-box small{display:block;color:#95a1ac;font-size:10px;margin-top:12px}
    .alert{padding:11px 12px;border-radius:8px;font-size:12px}.alert-error{background:#fff0ed;color:#a84231;border:1px solid #f3c8c0}
    @media(max-width:850px){.login-layout{grid-template-columns:1fr}.login-visual{min-height:330px;padding:55px 30px}.visual-title{font-size:50px}.visual-stat-row{margin-top:30px}.visual-footer{left:30px;bottom:18px}.login-panel{padding:45px 24px}}
  `]
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  useDemo(role: 'claimant' | 'officer' | 'manager'): void {
    const data = {
      claimant: ['claimant@chubb.test', 'Claimant@123'],
      officer: ['officer@chubb.test', 'Officer@123'],
      manager: ['manager@chubb.test', 'Manager@123']
    } as const;
    this.form.setValue({ username: data[role][0], password: data[role][1] });
    this.error.set('');
  }

  submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigate(['/dashboard']);
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err?.error?.detail || err?.error?.message || 'Sign-in failed. Check your username, password, and backend availability.');
      }
    });
  }
}

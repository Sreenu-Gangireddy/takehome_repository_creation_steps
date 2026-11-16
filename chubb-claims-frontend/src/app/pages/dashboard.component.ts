import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ClaimsApiService } from '../core/claims-api.service';
import { AuthService } from '../core/auth.service';
import { Claim, ClaimStatus } from '../core/models';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe],
  template: `
    <section class="page-wrap">
      <div class="page-heading">
        <div>
          <div class="eyebrow">{{ staff() ? 'CLAIMS OPERATIONS' : 'CLAIMANT PORTAL' }}</div>
          <h1>{{ staff() ? 'Claims overview' : 'Your claims' }}</h1>
          <p>{{ staff() ? 'A live view of the claims moving through your team.' : 'Track progress and stay informed about your submitted claims.' }}</p>
        </div>
        <a routerLink="/claims/new" class="btn btn-primary">＋ New claim</a>
      </div>

      @if (error()) { <div class="alert alert-error">{{ error() }}</div> }

      <div class="metric-grid">
        <article class="metric-card">
          <div class="metric-label">TOTAL CLAIMS</div><div class="metric-number">{{ claims().length }}</div>
          <div class="metric-foot">Claims in this result set</div>
        </article>
        <article class="metric-card metric-accent">
          <div class="metric-label">NEEDS REVIEW</div><div class="metric-number">{{ count('SUBMITTED') }}</div>
          <div class="metric-foot">Newly submitted</div>
        </article>
        <article class="metric-card">
          <div class="metric-label">IN PROGRESS</div><div class="metric-number">{{ count('UNDER_REVIEW') + count('AWAITING_INFORMATION') }}</div>
          <div class="metric-foot">Currently being assessed</div>
        </article>
        <article class="metric-card">
          <div class="metric-label">RESOLVED</div><div class="metric-number">{{ count('APPROVED') + count('REJECTED') + count('SETTLED') }}</div>
          <div class="metric-foot">Decisions and settlements</div>
        </article>
      </div>

      <section class="surface-card">
        <div class="table-heading">
          <div><h2>{{ staff() ? 'Claims register' : 'Recent claims' }}</h2><p>Search and open a claim to see its timeline and available actions.</p></div>
          <div class="table-tools">
            <select aria-label="Filter by status" [value]="filter()" (change)="changeFilter($any($event.target).value)">
              <option value="">All statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under review</option>
              <option value="AWAITING_INFORMATION">Awaiting information</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="SETTLED">Settled</option>
            </select>
            <button class="btn btn-outline btn-small" (click)="load()">↻ Refresh</button>
          </div>
        </div>
        @if (loading()) {
          <div class="empty-state"><span class="loader"></span><p>Loading claims from the backend…</p></div>
        } @else if (visibleClaims().length === 0) {
          <div class="empty-state"><div class="empty-icon">▤</div><strong>No claims found</strong><p>Try another status filter or submit a new claim.</p><a routerLink="/claims/new" class="btn btn-outline">Create first claim</a></div>
        } @else {
          <div class="table-scroll">
            <table>
              <thead><tr><th>CLAIM</th><th>CLAIMANT</th><th>TYPE / MARKET</th><th>ESTIMATED LOSS</th><th>STATUS</th><th>SUBMITTED</th><th></th></tr></thead>
              <tbody>
                @for (claim of visibleClaims(); track claim.id) {
                  <tr>
                    <td><a class="claim-link" [routerLink]="['/claims', claim.id]">#{{ shortId(claim.id) }}</a><small>{{ claim.id }}</small></td>
                    <td><strong>{{ claim.claimantName }}</strong><small>{{ claim.claimantEmail }}</small></td>
                    <td><strong>{{ claim.claimType }}</strong><small>{{ claim.market }}</small></td>
                    <td class="amount">{{ claim.estimatedLoss | currency:'USD':'symbol':'1.2-2' }}</td>
                    <td><span class="status" [attr.data-status]="claim.status">{{ formatStatus(claim.status) }}</span></td>
                    <td>{{ claim.createdAt | date:'dd MMM yyyy' }}</td>
                    <td><a [routerLink]="['/claims', claim.id]" class="view-link">View →</a></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="table-bottom"><span>Showing {{ visibleClaims().length }} of {{ total() }} claims returned by the API</span><span>Latest first</span></div>
        }
      </section>
      <p class="data-note">Amounts are displayed with a USD symbol for this demo UI. Confirm the currency by market before using this display in a real claims workflow.</p>
    </section>
  `,
  styles: [`
    .page-wrap{max-width:1440px;margin:0 auto;padding:48px 5vw 55px}.page-heading{display:flex;justify-content:space-between;align-items:end;margin-bottom:30px;gap:20px}
    .eyebrow{font-size:9px;font-weight:850;letter-spacing:.2em;color:#a67425}.page-heading h1{margin:9px 0 7px;font-size:34px;letter-spacing:-.045em;color:#173049}.page-heading p,.table-heading p{margin:0;color:#83909b;font-size:13px}
    .metric-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px}.metric-card{background:white;border:1px solid #e5eaee;border-radius:13px;padding:20px 22px;box-shadow:0 3px 12px #10243b08}.metric-accent{border-top:3px solid #e5a33b}.metric-label{font-size:9px;letter-spacing:.16em;color:#82909e;font-weight:850}.metric-number{font-size:32px;font-weight:750;color:#173049;letter-spacing:-.04em;margin:12px 0 5px}.metric-foot{font-size:11px;color:#9aa5ae}
    .surface-card{background:white;border:1px solid #e3e9ed;border-radius:14px;overflow:hidden;box-shadow:0 4px 15px #10243b08}.table-heading{display:flex;align-items:center;justify-content:space-between;padding:22px 24px;border-bottom:1px solid #edf0f2;gap:18px}.table-heading h2{font-size:17px;margin:0 0 5px;color:#20374c}.table-tools{display:flex;align-items:center;gap:8px}.table-tools select{width:170px;padding:9px;font-size:11px}
    .table-scroll{overflow-x:auto}table{width:100%;border-collapse:collapse;white-space:nowrap}th{text-align:left;padding:13px 17px;background:#f8fafb;color:#91a0ac;font-size:9px;letter-spacing:.11em;font-weight:850}td{padding:15px 17px;border-top:1px solid #eff2f4;color:#5f6f7e;font-size:11px}td strong{display:block;color:#334a5f;font-size:12px}td small{display:block;color:#a0aab3;font-size:9px;margin-top:4px;max-width:180px;overflow:hidden;text-overflow:ellipsis}.claim-link{color:#1b6286;text-decoration:none;font-weight:800}.amount{font-weight:750;color:#20384e}.status{display:inline-block;padding:6px 9px;border-radius:99px;font-size:9px;font-weight:850;background:#edf2f6;color:#53687b}.status[data-status="SUBMITTED"]{background:#fff2db;color:#98631a}.status[data-status="UNDER_REVIEW"]{background:#e4f1fa;color:#26658b}.status[data-status="AWAITING_INFORMATION"]{background:#f2eafa;color:#79529a}.status[data-status="APPROVED"],.status[data-status="SETTLED"]{background:#e5f5ed;color:#28714e}.status[data-status="REJECTED"]{background:#fae9e7;color:#a74c43}.view-link{color:#9d6a1b;text-decoration:none;font-weight:800;font-size:11px}.table-bottom{padding:13px 20px;display:flex;justify-content:space-between;color:#9aa5ae;font-size:10px;border-top:1px solid #eff2f4}.empty-state{min-height:240px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#8795a1;gap:10px}.empty-state strong{color:#40576b}.empty-state p{margin:0 0 5px;font-size:12px}.empty-icon{font-size:32px;color:#bdc9d2}.data-note{font-size:10px;color:#a0aab3;margin:13px 3px}.alert{margin-bottom:18px;padding:12px 14px;border-radius:9px;font-size:12px}.alert-error{background:#fff0ed;color:#a84231;border:1px solid #f3c8c0}.loader{width:22px;height:22px;border:2px solid #dce4ea;border-top-color:#b77a1e;border-radius:50%;animation:spin .7s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
    @media(max-width:900px){.metric-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:650px){.page-wrap{padding:30px 18px}.page-heading{align-items:start;flex-direction:column}.metric-grid{gap:8px}.metric-card{padding:15px}.table-heading{align-items:start;flex-direction:column}.table-tools{width:100%}.table-tools select{flex:1}.page-heading h1{font-size:28px}}
  `]
})
export class DashboardComponent {
  private readonly api = inject(ClaimsApiService);
  readonly auth = inject(AuthService);
  readonly claims = signal<Claim[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly filter = signal('');
  readonly total = signal(0);
  readonly staff = computed(() => this.auth.hasAnyRole('OFFICER', 'MANAGER'));
  readonly visibleClaims = computed(() => {
    const all = this.claims();
    const status = this.filter();
    const filtered = status ? all.filter(c => c.status === status) : all;
    // UI convenience only. The backend must enforce claimant ownership for real data security.
    const user = this.auth.user()?.username?.toLowerCase();
    return !this.staff() && user ? filtered.filter(c => c.claimantEmail.toLowerCase() === user) : filtered;
  });

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.list(0, 100).subscribe({
      next: page => {
        this.claims.set(page.content ?? []);
        this.total.set(page.totalElements ?? page.content?.length ?? 0);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err?.error?.detail || err?.error?.message || 'Could not load claims. Confirm the backend is running and sign in with a valid account.');
      }
    });
  }
  count(status: ClaimStatus): number { return this.visibleClaims().filter(c => c.status === status).length; }
  changeFilter(value: string): void { this.filter.set(value); }
  shortId(id: string): string { return id.slice(0, 8).toUpperCase(); }
  formatStatus(status: string): string { return status.replaceAll('_', ' '); }
}

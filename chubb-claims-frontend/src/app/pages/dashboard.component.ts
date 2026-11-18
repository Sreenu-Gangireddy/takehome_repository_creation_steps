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

      @if (error()) {
        <div class="alert alert-error">{{ error() }}</div>
      }

      <div class="metric-grid">
        <article class="metric-card">
          <div class="metric-label">TOTAL CLAIMS</div>
          <div class="metric-number">{{ total() }}</div>
          <div class="metric-foot">Total claims in the API</div>
        </article>
        <article class="metric-card metric-accent">
          <div class="metric-label">NEEDS REVIEW</div>
          <div class="metric-number">{{ count('SUBMITTED') }}</div>
          <div class="metric-foot">Newly submitted</div>
        </article>
        <article class="metric-card">
          <div class="metric-label">IN PROGRESS</div>
          <div class="metric-number">{{ count('UNDER_REVIEW') + count('AWAITING_INFORMATION') }}</div>
          <div class="metric-foot">Currently being assessed</div>
        </article>
        <article class="metric-card">
          <div class="metric-label">RESOLVED</div>
          <div class="metric-number">{{ count('APPROVED') + count('REJECTED') + count('SETTLED') }}</div>
          <div class="metric-foot">Decisions and settlements</div>
        </article>
      </div>

      <section class="surface-card">
        <div class="table-heading">
          <div>
            <h2>{{ staff() ? 'Claims register' : 'Recent claims' }}</h2>
            <p>Search by Claim ID, filter by status, and open a claim to see its timeline and available actions.</p>
          </div>

          <div class="table-tools">
            <input
              class="claim-id-search"
              type="search"
              placeholder="Search by Claim ID..."
              aria-label="Search by Claim ID"
              [value]="claimIdSearch()"
              (input)="updateClaimIdSearch($event)"
            />

            @if (claimIdSearch()) {
              <button class="btn btn-outline btn-small" type="button" (click)="clearClaimIdSearch()">
                Clear
              </button>
            }

            <select
              aria-label="Rows per page"
              [value]="pageSize()"
              (change)="changePageSize($any($event.target).value)">
              <option [value]="10">10 per page</option>
              <option [value]="20">20 per page</option>
              <option [value]="50">50 per page</option>
              <option [value]="100">100 per page</option>
            </select>

            <select
              aria-label="Filter by status"
              [value]="filter()"
              (change)="changeFilter($any($event.target).value)">
              <option value="">All statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under review</option>
              <option value="AWAITING_INFORMATION">Awaiting information</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="SETTLED">Settled</option>
            </select>

            <button class="btn btn-outline btn-small" type="button" (click)="load()">
              ↻ Refresh
            </button>
          </div>
        </div>

        @if (loading()) {
          <div class="empty-state">
            <span class="loader"></span>
            <p>Loading claims from the backend…</p>
          </div>
        } @else if (visibleClaims().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">▤</div>
            <strong>No claims found</strong>
            @if (claimIdSearch().trim()) {
              <p>No loaded claim matches "{{ claimIdSearch().trim() }}". Check the Claim ID and try again.</p>
              <button class="btn btn-outline" type="button" (click)="clearClaimIdSearch()">Clear search</button>
            } @else {
              <p>Try another status filter or submit a new claim.</p>
              <a routerLink="/claims/new" class="btn btn-outline">Create first claim</a>
            }
          </div>
        } @else {
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>CLAIM</th>
                  <th>CLAIMANT</th>
                  <th>TYPE / MARKET</th>
                  <th>ESTIMATED LOSS</th>
                  <th>STATUS</th>
                  <th>SUBMITTED</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (claim of visibleClaims(); track claim.id) {
                  <tr>
                    <td>
                      <a class="claim-link" [routerLink]="['/claims', claim.id]">#{{ shortId(claim.id) }}</a>
                      <small>{{ claim.id }}</small>
                    </td>
                    <td>
                      <strong>{{ claim.claimantName }}</strong>
                      <small>{{ claim.claimantEmail }}</small>
                    </td>
                    <td>
                      <strong>{{ claim.claimType }}</strong>
                      <small>{{ claim.market }}</small>
                    </td>
                    <td class="amount">{{ claim.estimatedLoss | currency:'USD':'symbol':'1.2-2' }}</td>
                    <td>
                      <span class="status" [attr.data-status]="claim.status">{{ formatStatus(claim.status) }}</span>
                    </td>
                    <td>{{ claim.createdAt | date:'dd MMM yyyy' }}</td>
                    <td><a [routerLink]="['/claims', claim.id]" class="view-link">View →</a></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        <div class="table-bottom">
          <span>
            Showing {{ visibleClaims().length }} matching claims on this page.
            Page {{ pageIndex() + 1 }} of {{ totalPages() }} · {{ total() }} total claims
          </span>
          <div class="pagination-controls">
            <button
              class="btn btn-outline btn-small"
              type="button"
              (click)="previousPage()"
              [disabled]="pageIndex() === 0 || loading()">
              ← Previous
            </button>
            <button
              class="btn btn-outline btn-small"
              type="button"
              (click)="nextPage()"
              [disabled]="pageIndex() + 1 >= totalPages() || loading()">
              Next →
            </button>
          </div>
        </div>
      </section>

      <p class="data-note">Amounts are displayed with a USD symbol for this demo UI. Confirm the currency by market before using this display in a real claims workflow.</p>
    </section>
  `,
  styles: [`
    .page-wrap{max-width:1440px;margin:0 auto;padding:48px 5vw 55px}
    .page-heading{display:flex;justify-content:space-between;align-items:end;margin-bottom:30px;gap:20px}
    .eyebrow{font-size:9px;font-weight:850;letter-spacing:.2em;color:#a67425}
    .page-heading h1{margin:9px 0 7px;font-size:34px;letter-spacing:-.045em;color:#173049}
    .page-heading p,.table-heading p{margin:0;color:#83909b;font-size:13px}
    .metric-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px}
    .metric-card{background:white;border:1px solid #e5eaee;border-radius:13px;padding:20px 22px;box-shadow:0 3px 12px #10243b08}
    .metric-accent{border-top:3px solid #e5a33b}
    .metric-label{font-size:9px;letter-spacing:.16em;color:#82909e;font-weight:850}
    .metric-number{font-size:32px;font-weight:750;color:#173049;letter-spacing:-.04em;margin:12px 0 5px}
    .metric-foot{font-size:11px;color:#9aa5ae}
    .surface-card{background:white;border:1px solid #e3e9ed;border-radius:14px;overflow:hidden;box-shadow:0 4px 15px #10243b08}
    .table-heading{display:flex;align-items:center;justify-content:space-between;padding:22px 24px;border-bottom:1px solid #edf0f2;gap:18px}
    .table-heading h2{font-size:17px;margin:0 0 5px;color:#20374c}
    .table-tools{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    .table-tools select{width:170px;padding:9px;font-size:11px}
    .claim-id-search{width:230px;min-width:180px;padding:9px 12px;font-size:11px;border:1px solid #dce4ea;border-radius:7px;color:#334a5f;outline:none;background:#fff}
    .claim-id-search::placeholder{color:#98a5af}
    .claim-id-search:focus{border-color:#1b6286;box-shadow:0 0 0 2px #1b628620}
    .table-scroll{overflow-x:auto}
    table{width:100%;border-collapse:collapse;white-space:nowrap}
    th{text-align:left;padding:13px 17px;background:#f8fafb;color:#91a0ac;font-size:9px;letter-spacing:.11em;font-weight:850}
    td{padding:15px 17px;border-top:1px solid #eff2f4;color:#5f6f7e;font-size:11px}
    td strong{display:block;color:#334a5f;font-size:12px}
    td small{display:block;color:#a0aab3;font-size:9px;margin-top:4px;max-width:180px;overflow:hidden;text-overflow:ellipsis}
    .claim-link{color:#1b6286;text-decoration:none;font-weight:800}
    .amount{font-weight:750;color:#20384e}
    .status{display:inline-block;padding:6px 9px;border-radius:99px;font-size:9px;font-weight:850;background:#edf2f6;color:#53687b}
    .status[data-status="SUBMITTED"]{background:#fff2db;color:#98631a}
    .status[data-status="UNDER_REVIEW"]{background:#e4f1fa;color:#26658b}
    .status[data-status="AWAITING_INFORMATION"]{background:#f2eafa;color:#79529a}
    .status[data-status="APPROVED"],.status[data-status="SETTLED"]{background:#e5f5ed;color:#28714e}
    .status[data-status="REJECTED"]{background:#fae9e7;color:#a74c43}
    .view-link{color:#9d6a1b;text-decoration:none;font-weight:800;font-size:11px}
    .table-bottom{padding:13px 20px;display:flex;justify-content:space-between;align-items:center;gap:12px;color:#9aa5ae;font-size:10px;border-top:1px solid #eff2f4}
    .pagination-controls{display:flex;align-items:center;gap:8px}
    .pagination-controls button:disabled{opacity:.45;cursor:not-allowed}
    .empty-state{min-height:240px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#8795a1;gap:10px;text-align:center;padding:24px}
    .empty-state strong{color:#40576b}
    .empty-state p{margin:0 0 5px;font-size:12px}
    .empty-icon{font-size:32px;color:#bdc9d2}
    .data-note{font-size:10px;color:#a0aab3;margin:13px 3px}
    .alert{margin-bottom:18px;padding:12px 14px;border-radius:9px;font-size:12px}
    .alert-error{background:#fff0ed;color:#a84231;border:1px solid #f3c8c0}
    .loader{width:22px;height:22px;border:2px solid #dce4ea;border-top-color:#b77a1e;border-radius:50%;animation:spin .7s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    @media(max-width:1100px){.table-heading{align-items:flex-start;flex-direction:column}.table-tools{width:100%}}
    @media(max-width:900px){.metric-grid{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:650px){
      .page-wrap{padding:30px 18px}
      .page-heading{align-items:start;flex-direction:column}
      .metric-grid{gap:8px}
      .metric-card{padding:15px}
      .table-heading{align-items:start;flex-direction:column}
      .table-tools{width:100%;flex-direction:column;align-items:stretch}
      .table-tools select,.claim-id-search{width:100%;min-width:0}
      .page-heading h1{font-size:28px}
      .table-bottom{flex-direction:column;align-items:flex-start}.pagination-controls{width:100%;justify-content:flex-end}
    }
  `]
})
export class DashboardComponent {
  private readonly api = inject(ClaimsApiService);
  readonly auth = inject(AuthService);

  readonly claims = signal<Claim[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly filter = signal('');
  readonly claimIdSearch = signal('');
  readonly total = signal(0);
  readonly pageSize = signal(10);
  readonly pageIndex = signal(0);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));

  readonly staff = computed(() => this.auth.hasAnyRole('OFFICER', 'MANAGER'));

  readonly visibleClaims = computed(() => {
    let filtered = this.claims();

    // Apply the selected claim status filter.
    const selectedStatus = this.filter();
    if (selectedStatus) {
      filtered = filtered.filter(claim => claim.status === selectedStatus);
    }

    // UI convenience only. The backend must enforce claimant ownership for real data security.
    const username = this.auth.user()?.username?.toLowerCase();
    if (!this.staff() && username) {
      filtered = filtered.filter(
        claim => claim.claimantEmail?.toLowerCase() === username
      );
    }

    // Frontend-only Claim ID search: filters the claims already loaded in memory.
    const searchText = this.claimIdSearch().trim().toLowerCase();
    if (searchText) {
      filtered = filtered.filter(claim =>
        claim.id.toLowerCase().includes(searchText)
      );
    }

    return filtered;
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');

    // Load the selected server page. Claim ID typing/search remains frontend-only.
    this.api.list(this.pageIndex(), this.pageSize()).subscribe({
      next: page => {
        this.claims.set(page.content ?? []);
        this.total.set(page.totalElements ?? page.content?.length ?? 0);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.error.set(
          err?.error?.detail ||
          err?.error?.message ||
          'Could not load claims. Confirm the backend is running and sign in with a valid account.'
        );
      }
    });
  }

  changePageSize(value: string): void {
    const size = Number(value);
    if (![10, 20, 50, 100].includes(size)) return;

    this.pageSize.set(size);
    this.pageIndex.set(0);
    this.load();
  }

  previousPage(): void {
    if (this.pageIndex() > 0) {
      this.pageIndex.update(page => page - 1);
      this.load();
    }
  }

  nextPage(): void {
    if (this.pageIndex() + 1 < this.totalPages()) {
      this.pageIndex.update(page => page + 1);
      this.load();
    }
  }

  updateClaimIdSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.claimIdSearch.set(input.value);
  }

  clearClaimIdSearch(): void {
    this.claimIdSearch.set('');
  }

  count(status: ClaimStatus): number {
    return this.visibleClaims().filter(claim => claim.status === status).length;
  }

  changeFilter(value: string): void {
    this.filter.set(value);
  }

  shortId(id: string): string {
    return id.slice(0, 8).toUpperCase();
  }

  formatStatus(status: string): string {
    return status.replaceAll('_', ' ');
  }
}

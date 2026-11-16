import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClaimsApiService } from '../core/claims-api.service';
import { AuthService } from '../core/auth.service';
import { Claim, ClaimStatus } from '../core/models';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, DatePipe],
  template: `
    <section class="page-wrap">
      <div class="crumb"><a routerLink="/dashboard">Overview</a><span>/</span><span>Claim details</span></div>
      @if (notice()) { <div class="alert alert-success">{{ notice() }}</div> }
      @if (error()) { <div class="alert alert-error">{{ error() }}</div> }
      @if (loading()) {
        <div class="loading-card"><span class="loader"></span>Loading claim details…</div>
      } @else if (claim(); as item) {
        <div class="detail-heading">
          <div><div class="eyebrow">CLAIM RECORD · {{ item.market }}</div><h1>Claim #{{ item.id.slice(0, 8).toUpperCase() }}</h1>
            <p>Submitted {{ item.createdAt | date:'dd MMM yyyy, h:mm a' }}</p></div>
          <span class="status" [attr.data-status]="item.status">{{ formatStatus(item.status) }}</span>
        </div>

        <div class="detail-grid">
          <div class="main-column">
            <section class="detail-card">
              <div class="card-title"><div><h2>Incident overview</h2><p>Claim and claimant information</p></div><span class="type-tag">{{ item.claimType }}</span></div>
              <div class="info-grid">
                <div><small>CLAIMANT</small><strong>{{ item.claimantName }}</strong></div>
                <div><small>EMAIL ADDRESS</small><strong>{{ item.claimantEmail }}</strong></div>
                <div><small>MARKET</small><strong>{{ item.market }}</strong></div>
                <div><small>ESTIMATED LOSS</small><strong class="loss">{{ item.estimatedLoss | number:'1.2-2' }}</strong></div>
              </div>
              <div class="description"><small>INCIDENT DESCRIPTION</small><p>{{ item.incidentDescription }}</p></div>
            </section>

            <section class="detail-card">
              <div class="card-title"><div><h2>Claim timeline</h2><p>Current lifecycle state</p></div></div>
              <div class="timeline">
                @for (step of timeline; track step.status; let index = $index) {
                  <div class="timeline-step" [class.done]="isPast(step.status, item.status)" [class.current]="step.status === item.status">
                    <span class="timeline-dot">{{ isPast(step.status, item.status) ? '✓' : index + 1 }}</span>
                    <div><strong>{{ step.label }}</strong><small>{{ step.note }}</small></div>
                  </div>
                }
              </div>
              @if (item.decisionReason) { <div class="decision-note"><small>DECISION REASON</small><p>{{ item.decisionReason }}</p></div> }
            </section>
          </div>

          <aside class="side-column">
            <section class="detail-card summary-card">
              <div class="card-title"><div><h2>Assignment</h2><p>Claim ownership</p></div></div>
              <small class="label">ASSIGNED OFFICER</small>
              <strong class="assigned">{{ item.assignedOfficer || 'Not assigned' }}</strong>
              @if (staff()) {
                <form [formGroup]="assignForm" (ngSubmit)="assign()" class="action-form">
                  <label>Assign to officer
                    <input formControlName="officer" placeholder="officer@company.com">
                  </label>
                  <button class="btn btn-outline btn-wide" [disabled]="assignForm.invalid || busy()">Save assignment</button>
                </form>
              }
            </section>

            @if (staff()) {
              <section class="detail-card">
                <div class="card-title"><div><h2>Update progress</h2><p>Move the claim to the next state</p></div></div>
                <label class="label-select">NEXT STATUS
                  <select [value]="selectedStatus()" (change)="selectedStatus.set($any($event.target).value)">
                    <option value="">Choose next status</option>
                    @for (status of nextStatuses(item.status); track status) { <option [value]="status">{{ formatStatus(status) }}</option> }
                  </select>
                </label>
                <button class="btn btn-primary btn-wide" [disabled]="!selectedStatus() || busy()" (click)="updateStatus()">Update status</button>
                @if (nextStatuses(item.status).length === 0) { <p class="hint">This claim is in a final state. No further transition is available.</p> }
              </section>

              @if (item.status === 'UNDER_REVIEW') {
                <section class="detail-card">
                  <div class="card-title"><div><h2>Decision</h2><p>Record the assessment outcome</p></div></div>
                  <form [formGroup]="decisionForm" (ngSubmit)="decide()" class="action-form">
                    <label>Outcome
                      <select formControlName="outcome"><option value="APPROVED">Approve claim</option><option value="REJECTED">Reject claim</option></select>
                    </label>
                    <label>Decision reason
                      <textarea rows="4" formControlName="reason" placeholder="Explain the decision…"></textarea>
                    </label>
                    <button class="btn btn-primary btn-wide" [disabled]="decisionForm.invalid || busy()">Submit decision</button>
                  </form>
                </section>
              }
            }
          </aside>
        </div>
      }
    </section>
  `,
  styles: [`
    .page-wrap{max-width:1320px;margin:0 auto;padding:40px 5vw 60px}.crumb{display:flex;gap:10px;color:#a0aab3;font-size:11px;margin-bottom:25px}.crumb a{color:#49748e;text-decoration:none}.eyebrow{color:#a67425;font-size:9px;font-weight:850;letter-spacing:.2em}.detail-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:25px}.detail-heading h1{font-size:32px;letter-spacing:-.04em;color:#173049;margin:8px 0 5px}.detail-heading p{color:#8794a0;font-size:12px;margin:0}.detail-grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(280px,.85fr);gap:17px}.main-column,.side-column{display:grid;align-content:start;gap:17px}.detail-card{background:white;border:1px solid #e3e9ed;border-radius:13px;padding:22px 24px;box-shadow:0 4px 15px #10243b08}.card-title{display:flex;align-items:start;justify-content:space-between;padding-bottom:17px;border-bottom:1px solid #edf0f2;margin-bottom:18px}.card-title h2{font-size:16px;color:#22394e;margin:0 0 5px}.card-title p{font-size:11px;color:#99a4ad;margin:0}.type-tag{padding:6px 9px;background:#eef3f6;color:#486176;border-radius:6px;font-size:10px;font-weight:850}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:21px}.info-grid small,.description small,.decision-note small,.label{display:block;color:#96a2ad;font-size:9px;letter-spacing:.12em;font-weight:850;margin-bottom:7px}.info-grid strong{font-size:12px;color:#344b60}.info-grid .loss{color:#9d6d21;font-size:16px}.description{border-top:1px solid #eff2f4;margin-top:22px;padding-top:18px}.description p,.decision-note p{color:#637587;font-size:12px;line-height:1.7;margin:0}.timeline{display:grid;gap:0}.timeline-step{display:flex;align-items:start;gap:13px;min-height:57px;position:relative;color:#a0abb5}.timeline-step:not(:last-child):before{content:'';position:absolute;left:14px;top:29px;width:1px;height:32px;background:#e2e8ed}.timeline-dot{width:29px;height:29px;flex:0 0 29px;border-radius:50%;display:grid;place-items:center;background:#f1f4f6;color:#91a0ac;font-size:10px;font-weight:850;z-index:1}.timeline-step strong{display:block;font-size:11px;color:#647587;margin-top:1px}.timeline-step small{display:block;color:#a1abb4;font-size:10px;margin-top:4px}.timeline-step.done .timeline-dot{background:#e5f5ed;color:#28714e}.timeline-step.current .timeline-dot{background:#fff0d7;color:#9d6a1c;box-shadow:0 0 0 4px #fff8eb}.timeline-step.current strong{color:#20394f}.decision-note{background:#f8fafb;border-radius:8px;padding:13px;margin-top:7px}.assigned{display:block;color:#334b60;font-size:12px;margin:0 0 17px}.action-form{display:grid;gap:13px;margin-top:12px}.action-form label,.label-select{display:grid;gap:7px;color:#45596b;font-size:10px;font-weight:750}.label-select{margin-bottom:12px}.hint{color:#9ba6af;font-size:10px;line-height:1.5}.status{display:inline-block;padding:7px 11px;border-radius:99px;font-size:10px;font-weight:850;background:#edf2f6;color:#53687b}.status[data-status="SUBMITTED"]{background:#fff2db;color:#98631a}.status[data-status="UNDER_REVIEW"]{background:#e4f1fa;color:#26658b}.status[data-status="AWAITING_INFORMATION"]{background:#f2eafa;color:#79529a}.status[data-status="APPROVED"],.status[data-status="SETTLED"]{background:#e5f5ed;color:#28714e}.status[data-status="REJECTED"]{background:#fae9e7;color:#a74c43}.loading-card{background:#fff;border:1px solid #e3e9ed;border-radius:12px;min-height:230px;display:flex;align-items:center;justify-content:center;gap:12px;color:#7f8e9a;font-size:12px}.loader{width:20px;height:20px;border:2px solid #dce4ea;border-top-color:#b77a1e;border-radius:50%;animation:spin .7s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.alert{padding:12px 14px;border-radius:9px;font-size:12px;margin-bottom:15px}.alert-error{background:#fff0ed;color:#a84231;border:1px solid #f3c8c0}.alert-success{background:#eaf6ef;color:#28714e;border:1px solid #cce8d8}@media(max-width:850px){.detail-grid{grid-template-columns:1fr}}@media(max-width:600px){.page-wrap{padding:28px 17px}.detail-heading{align-items:start;gap:12px;flex-direction:column}.detail-card{padding:18px 16px}.detail-heading h1{font-size:27px}}
  `]
})
export class ClaimDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ClaimsApiService);
  readonly auth = inject(AuthService);
  readonly claim = signal<Claim | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly notice = signal(history.state?.notice ?? '');
  readonly selectedStatus = signal<ClaimStatus | ''>('');
  readonly staff = computed(() => this.auth.hasAnyRole('OFFICER', 'MANAGER'));
  readonly assignForm = this.fb.nonNullable.group({ officer: ['', Validators.required] });
  readonly decisionForm = this.fb.nonNullable.group({
    outcome: ['APPROVED' as 'APPROVED' | 'REJECTED', Validators.required],
    reason: ['', [Validators.required, Validators.maxLength(2000)]]
  });
  readonly timeline = [
    { status: 'SUBMITTED', label: 'Submitted', note: 'Claim received by the platform' },
    { status: 'UNDER_REVIEW', label: 'Under review', note: 'A claims officer is assessing the case' },
    { status: 'AWAITING_INFORMATION', label: 'Awaiting information', note: 'Additional information requested' },
    { status: 'APPROVED', label: 'Approved', note: 'Claim approved' },
    { status: 'SETTLED', label: 'Settled', note: 'Settlement completed' }
  ];

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(id);
    else { this.loading.set(false); this.error.set('Missing claim ID in URL.'); }
  }

  load(id: string): void {
    this.api.getById(id).subscribe({
      next: claim => {
        this.claim.set(claim);
        this.assignForm.patchValue({ officer: claim.assignedOfficer ?? '' });
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err?.error?.detail || err?.error?.message || 'Unable to retrieve this claim.');
      }
    });
  }

  nextStatuses(current: ClaimStatus): ClaimStatus[] {
    const transitions: Record<ClaimStatus, ClaimStatus[]> = {
      SUBMITTED: ['UNDER_REVIEW'],
      UNDER_REVIEW: ['AWAITING_INFORMATION'],
      AWAITING_INFORMATION: ['UNDER_REVIEW'],
      APPROVED: ['SETTLED'],
      REJECTED: [],
      SETTLED: []
    };
    return transitions[current];
  }

  isPast(step: string, current: ClaimStatus): boolean {
    const order = ['SUBMITTED', 'UNDER_REVIEW', 'AWAITING_INFORMATION', 'APPROVED', 'REJECTED', 'SETTLED'];
    return order.indexOf(step) < order.indexOf(current);
  }
  formatStatus(status: string): string { return status.replaceAll('_', ' '); }

  assign(): void {
    const claim = this.claim();
    if (!claim || this.assignForm.invalid || this.busy()) return;
    this.runAction(this.api.assign(claim.id, this.assignForm.getRawValue()), 'Claim assignment updated.');
  }

  updateStatus(): void {
    const claim = this.claim();
    const status = this.selectedStatus();
    if (!claim || !status || this.busy()) return;
    this.runAction(this.api.updateStatus(claim.id, status), 'Claim status updated.');
  }

  decide(): void {
    const claim = this.claim();
    if (!claim || this.decisionForm.invalid || this.busy()) return;
    this.runAction(this.api.decide(claim.id, this.decisionForm.getRawValue()), 'Claim decision saved.');
  }

  private runAction(request: import('rxjs').Observable<Claim>, message: string): void {
    const id = this.claim()?.id;
    if (!id) return;
    this.busy.set(true);
    this.error.set('');
    request.subscribe({
      next: updated => {
        this.claim.set(updated);
        this.selectedStatus.set('');
        this.busy.set(false);
        this.notice.set(message);
        this.assignForm.patchValue({ officer: updated.assignedOfficer ?? '' });
      },
      error: err => {
        this.busy.set(false);
        this.error.set(err?.error?.detail || err?.error?.message || 'The update could not be completed.');
      }
    });
  }
}

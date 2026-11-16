import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ClaimsApiService } from '../core/claims-api.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="page-wrap">
      <div class="crumb"><a routerLink="/dashboard">Overview</a><span>/</span><span>New claim</span></div>
      <div class="page-heading">
        <div><div class="eyebrow">CLAIM INTAKE</div><h1>Report an incident</h1>
          <p>Provide the incident details below. Required fields are marked with an asterisk.</p></div>
        <div class="step-indicator"><span>01</span><div>Claim details<small>Submission form</small></div></div>
      </div>

      @if (error()) { <div class="alert alert-error">{{ error() }}</div> }
      <form [formGroup]="form" (ngSubmit)="submit()" class="claim-form">
        <section class="form-card">
          <div class="section-heading"><span class="section-icon">01</span><div><h2>Claimant information</h2><p>Who is reporting this incident?</p></div></div>
          <div class="form-grid">
            <label>Claimant full name *
              <input formControlName="claimantName" placeholder="e.g. Alex Tan">
              @if (fieldError('claimantName')) { <small class="field-error">Please enter the claimant name.</small> }
            </label>
            <label>Email address *
              <input type="email" formControlName="claimantEmail" placeholder="name@example.com">
              @if (fieldError('claimantEmail')) { <small class="field-error">Enter a valid email address.</small> }
            </label>
          </div>
        </section>

        <section class="form-card">
          <div class="section-heading"><span class="section-icon">02</span><div><h2>Incident information</h2><p>Tell us what happened and where the claim is being handled.</p></div></div>
          <div class="form-grid">
            <label>Claim type *
              <select formControlName="claimType"><option value="MOTOR">Motor</option><option value="PROPERTY">Property</option></select>
            </label>
            <label>Market code *
              <select formControlName="market"><option value="SG">Singapore (SG)</option><option value="AU">Australia (AU)</option><option value="IN">India (IN)</option><option value="HK">Hong Kong (HK)</option><option value="MY">Malaysia (MY)</option><option value="TH">Thailand (TH)</option></select>
              <small class="hint">The backend expects exactly two uppercase letters.</small>
            </label>
            <label class="full-width">Incident description *
              <textarea formControlName="incidentDescription" rows="5" maxlength="2000" placeholder="Describe what happened, when it happened, and any relevant details…"></textarea>
              <small class="hint">{{ form.controls.incidentDescription.value.length }} / 2000 characters</small>
              @if (fieldError('incidentDescription')) { <small class="field-error">Provide a description (up to 2,000 characters).</small> }
            </label>
            <label>Estimated loss *
              <div class="money-input"><span>$</span><input type="number" min="0.01" step="0.01" formControlName="estimatedLoss" placeholder="0.00"></div>
              @if (fieldError('estimatedLoss')) { <small class="field-error">Estimated loss must be at least 0.01.</small> }
              <small class="hint">Demo display only; confirm actual currency by market.</small>
            </label>
          </div>
        </section>

        <div class="form-actions">
          <a routerLink="/dashboard" class="btn btn-outline">Cancel</a>
          <button class="btn btn-primary" type="submit" [disabled]="form.invalid || submitting()">{{ submitting() ? 'Submitting…' : 'Submit claim →' }}</button>
        </div>
      </form>
    </section>
  `,
  styles: [`
    .page-wrap{max-width:1050px;margin:0 auto;padding:42px 5vw 60px}.crumb{display:flex;gap:10px;color:#a0aab3;font-size:11px;margin-bottom:27px}.crumb a{color:#49748e;text-decoration:none}.page-heading{display:flex;justify-content:space-between;align-items:center;margin-bottom:28px}.eyebrow{color:#a67425;font-size:9px;font-weight:850;letter-spacing:.2em}.page-heading h1{color:#173049;font-size:34px;letter-spacing:-.04em;margin:9px 0 6px}.page-heading p{color:#86939f;font-size:13px;margin:0}.step-indicator{display:flex;align-items:center;gap:11px;color:#324c62;font-size:12px;font-weight:800}.step-indicator>span,.section-icon{width:34px;height:34px;border-radius:10px;background:#fff2db;color:#9b6b20;display:grid;place-items:center;font-size:11px;font-weight:900}.step-indicator small{display:block;color:#9aa6b0;font-size:10px;font-weight:500;margin-top:4px}.claim-form{display:grid;gap:16px}.form-card{background:#fff;border:1px solid #e3e9ed;border-radius:13px;padding:24px 26px;box-shadow:0 4px 15px #10243b08}.section-heading{display:flex;align-items:center;gap:13px;padding-bottom:20px;border-bottom:1px solid #edf0f2;margin-bottom:21px}.section-heading h2{font-size:16px;color:#22394e;margin:0 0 4px}.section-heading p{font-size:11px;color:#94a0aa;margin:0}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px 20px}.form-grid label{display:grid;align-content:start;gap:8px;font-size:11px;font-weight:750;color:#43576a}.full-width{grid-column:1/-1}.form-grid textarea{resize:vertical}.hint{font-size:10px;color:#9aa6b0;font-weight:450}.field-error{color:#b4493d;font-size:10px}.money-input{display:flex;align-items:center;border:1px solid #d8e0e7;border-radius:9px;background:white;overflow:hidden}.money-input span{padding:0 12px;color:#83909c;border-right:1px solid #e7ecef}.money-input input{border:0;box-shadow:none!important}.form-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:5px}.alert{margin-bottom:16px;padding:12px 14px;border-radius:9px;font-size:12px}.alert-error{background:#fff0ed;color:#a84231;border:1px solid #f3c8c0}@media(max-width:650px){.page-wrap{padding:28px 18px}.page-heading{align-items:start;gap:15px;flex-direction:column}.page-heading h1{font-size:28px}.form-card{padding:19px 16px}.form-grid{grid-template-columns:1fr}.full-width{grid-column:auto}}
  `]
})
export class NewClaimComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ClaimsApiService);
  private readonly router = inject(Router);
  readonly submitting = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
    claimantName: ['', [Validators.required, Validators.maxLength(255)]],
    claimantEmail: ['', [Validators.required, Validators.email]],
    claimType: ['MOTOR', Validators.required],
    market: ['SG', [Validators.required, Validators.pattern(/^[A-Z]{2}$/)]],
    incidentDescription: ['', [Validators.required, Validators.maxLength(2000)]],
    estimatedLoss: [0, [Validators.required, Validators.min(0.01)]]
  });

  fieldError(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.error.set('');
    this.api.submit(this.form.getRawValue()).subscribe({
      next: claim => {
        this.submitting.set(false);
        void this.router.navigate(['/claims', claim.id], { state: { notice: 'Claim submitted successfully.' } });
      },
      error: err => {
        this.submitting.set(false);
        this.error.set(err?.error?.detail || err?.error?.message || 'Claim submission failed. Check required fields and API availability.');
      }
    });
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AssignClaimRequest, Claim, ClaimRequest, ClaimStatus, DecisionRequest, Page
} from './models';

@Injectable({ providedIn: 'root' })
export class ClaimsApiService {
  private readonly baseUrl = '/api/v1/claims';

  constructor(private readonly http: HttpClient) {}

  list(page = 0, size = 50, status?: ClaimStatus): Observable<Page<Claim>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', 'createdAt,desc');
    if (status) params = params.set('status', status);
    return this.http.get<Page<Claim>>(this.baseUrl, { params });
  }

  getById(id: string): Observable<Claim> {
    return this.http.get<Claim>(`${this.baseUrl}/${id}`);
  }

  submit(request: ClaimRequest): Observable<Claim> {
    return this.http.post<Claim>(this.baseUrl, request);
  }

  assign(id: string, request: AssignClaimRequest): Observable<Claim> {
    return this.http.patch<Claim>(`${this.baseUrl}/${id}/assignment`, request);
  }

  updateStatus(id: string, status: ClaimStatus): Observable<Claim> {
    const params = new HttpParams().set('status', status);
    return this.http.patch<Claim>(`${this.baseUrl}/${id}/status`, null, { params });
  }

  decide(id: string, request: DecisionRequest): Observable<Claim> {
    return this.http.post<Claim>(`${this.baseUrl}/${id}/decision`, request);
  }
}

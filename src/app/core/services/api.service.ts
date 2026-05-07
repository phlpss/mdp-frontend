import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FilterParams, PageRequest, PageResponse } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  get<T>(path: string, params?: FilterParams): Observable<T> {
    return this.http.get<T>(`${this.base}/${path}`, {
      params: this.buildParams(params),
    });
  }

  getPage<T>(path: string, page: PageRequest, filters?: FilterParams): Observable<PageResponse<T>> {
    const p = this.buildParams({
      page: page.page,
      size: page.size,
      sort: page.sort ? `${page.sort},${page.direction ?? 'asc'}` : undefined,
      ...filters,
    });
    return this.http.get<PageResponse<T>>(`${this.base}/${path}`, { params: p });
  }

  getById<T>(path: string, id: string): Observable<T> {
    return this.http.get<T>(`${this.base}/${path}/${id}`);
  }

  post<T, B = unknown>(path: string, body: B): Observable<T> {
    return this.http.post<T>(`${this.base}/${path}`, body);
  }

  put<T, B = unknown>(path: string, id: string, body: B): Observable<T> {
    return this.http.put<T>(`${this.base}/${path}/${id}`, body);
  }

  patch<T, B = unknown>(path: string, id: string, body: B): Observable<T> {
    return this.http.patch<T>(`${this.base}/${path}/${id}`, body);
  }

  delete<T>(path: string, id: string): Observable<T> {
    return this.http.delete<T>(`${this.base}/${path}/${id}`);
  }

  private buildParams(params?: FilterParams | Record<string, unknown>): HttpParams {
    let httpParams = new HttpParams();
    if (!params) return httpParams;
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return httpParams;
  }
}

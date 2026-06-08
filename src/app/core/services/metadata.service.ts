import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '@env/environment';
import { BUILTIN_META_TYPES, MetaAttribute, MetaType } from '../models/meta.model';

@Injectable({ providedIn: 'root' })
export class MetadataService {
  private readonly base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getAllTypes(): Observable<MetaType[]> {
    return this.http.get<MetaType[]>(`${this.base}/meta/types`).pipe(
      catchError(() => of(BUILTIN_META_TYPES)) // STUB: fallback to built-in metadata
    );
  }

  getType(name: string): Observable<MetaType> {
    return this.http.get<MetaType>(`${this.base}/meta/types/${name}`).pipe(
      catchError(() => {
        const found = BUILTIN_META_TYPES.find(t => t.name === name);
        return of(found ?? BUILTIN_META_TYPES[0]);
      })
    );
  }

  createType(type: Partial<MetaType>): Observable<MetaType> {
    return this.http.post<MetaType>(`${this.base}/meta/types`, type);
  }

  updateType(name: string, type: Partial<MetaType>): Observable<MetaType> {
    return this.http.put<MetaType>(`${this.base}/meta/types/${name}`, type);
  }

  addAttribute(typeName: string, attr: Partial<MetaAttribute>): Observable<MetaAttribute> {
    return this.http.post<MetaAttribute>(`${this.base}/meta/types/${typeName}/attributes`, attr);
  }

  updateAttribute(typeName: string, attrName: string, attr: Partial<MetaAttribute>): Observable<MetaAttribute> {
    return this.http.put<MetaAttribute>(`${this.base}/meta/types/${typeName}/attributes/${attrName}`, attr);
  }

  deleteAttribute(typeName: string, attrName: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/meta/types/${typeName}/attributes/${attrName}`);
  }
}

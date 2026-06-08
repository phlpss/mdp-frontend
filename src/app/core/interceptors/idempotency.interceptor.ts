import { Injectable } from '@angular/core';
import {
  HttpRequest, HttpHandler, HttpEvent, HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { environment } from '@env/environment';

const IDEMPOTENCY_HEADER = 'Idempotency-Key';
const CACHE_KEY = 'mdp_idempotency_cache';

interface IdempotencyEntry {
  key: string;
  createdAt: number;
}

@Injectable()
export class IdempotencyInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (req.method !== 'POST') return next.handle(req);

    const key = this.generateKey(req);
    const modified = req.clone({ setHeaders: { [IDEMPOTENCY_HEADER]: key } });
    return next.handle(modified);
  }

  private generateKey(req: HttpRequest<unknown>): string {
    const cacheRaw = sessionStorage.getItem(CACHE_KEY);
    const cache: Record<string, IdempotencyEntry> = cacheRaw ? JSON.parse(cacheRaw) : {};

    // Clean up expired keys
    const now = Date.now();
    Object.keys(cache).forEach(k => {
      if (now - cache[k].createdAt > environment.idempotencyTtlMs) {
        delete cache[k];
      }
    });

    // Deterministic key for same URL + body combination
    const bodyStr = JSON.stringify(req.body ?? {});
    const cacheId = `${req.url}:${bodyStr}`;
    if (cache[cacheId]) {
      return cache[cacheId].key;
    }

    const newKey = uuidv4();
    cache[cacheId] = { key: newKey, createdAt: now };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    return newKey;
  }
}

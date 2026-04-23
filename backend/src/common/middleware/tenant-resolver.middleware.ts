import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import {
  Tenant,
  TenantDocument,
} from '../../modules/tenants/schemas/tenant.schema';
import {
  Domain,
  DomainDocument,
} from '../../modules/domains/schemas/domain.schema';
import { REDIS_CLIENT } from '../../redis/redis.module';

const TENANT_CACHE_TTL = 300; // 5 minutes

/**
 * Resolves the tenant context from the incoming request.
 *
 * Resolution order:
 *  1. `x-tenant-id` header — explicit API calls from frontend
 *  2. Custom domain — e.g. mybarbershop.com → domains collection
 *  3. Subdomain — e.g. cool-lounge.bookingplatform.com → tenants.slug
 *
 * Uses Redis cache to avoid DB lookups on every single request.
 * The resolved tenant is attached to `req.tenantContext`.
 */
@Injectable()
export class TenantResolverMiddleware implements NestMiddleware {
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(Domain.name) private domainModel: Model<DomainDocument>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    let tenantId: string | null = null;
    let slug: string | null = null;

    // ── 1. Explicit header ────────────────────────────────────────────────────
    const headerTenantId = req.headers['x-tenant-id'] as string | undefined;
    if (headerTenantId) {
      const resolved = await this.resolveById(headerTenantId);
      if (resolved) {
        tenantId = resolved.tenantId;
        slug = resolved.slug;
      }
    }

    // ── 2. Custom domain ──────────────────────────────────────────────────────
    if (!tenantId) {
      const hostname = req.hostname;
      const platformDomain =
        process.env.PLATFORM_DOMAIN || 'bookingplatform.com';

      if (
        hostname &&
        !hostname.endsWith(platformDomain) &&
        hostname !== 'localhost' &&
        !hostname.startsWith('127.')
      ) {
        const resolved = await this.resolveByDomain(hostname);
        if (resolved) {
          tenantId = resolved.tenantId;
          slug = resolved.slug;
        }
      }
    }

    // ── 3. Subdomain ──────────────────────────────────────────────────────────
    if (!tenantId) {
      const hostname = req.hostname;
      const platformDomain =
        process.env.PLATFORM_DOMAIN || 'bookingplatform.com';

      if (hostname && hostname.endsWith(platformDomain)) {
        const subdomain = hostname.replace(`.${platformDomain}`, '');
        if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
          const resolved = await this.resolveBySlug(subdomain);
          if (resolved) {
            tenantId = resolved.tenantId;
            slug = resolved.slug;
          }
        }
      }
    }

    if (tenantId) {
      (req as any).tenantContext = { tenantId, slug };
    }

    next();
  }

  // ── Cached resolution helpers ──────────────────────────────────────────────

  private async resolveById(id: string): Promise<{ tenantId: string; slug: string } | null> {
    const cacheKey = `tenant:id:${id}`;
    return this.cachedLookup(cacheKey, async () => {
      const tenant = await this.tenantModel.findById(id).select('_id slug').lean();
      return tenant ? { tenantId: tenant._id.toString(), slug: tenant.slug } : null;
    });
  }

  private async resolveByDomain(hostname: string): Promise<{ tenantId: string; slug: string } | null> {
    const cacheKey = `tenant:domain:${hostname}`;
    return this.cachedLookup(cacheKey, async () => {
      const domainDoc = await this.domainModel
        .findOne({ domain: hostname, isVerified: true })
        .select('tenantId')
        .lean();
      if (!domainDoc) return null;
      const tenant = await this.tenantModel.findById(domainDoc.tenantId).select('_id slug').lean();
      return tenant ? { tenantId: tenant._id.toString(), slug: tenant.slug } : null;
    });
  }

  private async resolveBySlug(slug: string): Promise<{ tenantId: string; slug: string } | null> {
    const cacheKey = `tenant:slug:${slug}`;
    return this.cachedLookup(cacheKey, async () => {
      const tenant = await this.tenantModel.findOne({ slug }).select('_id slug').lean();
      return tenant ? { tenantId: tenant._id.toString(), slug: tenant.slug } : null;
    });
  }

  private async cachedLookup(
    key: string,
    fallback: () => Promise<{ tenantId: string; slug: string } | null>,
  ): Promise<{ tenantId: string; slug: string } | null> {
    try {
      const cached = await this.redis.get(key);
      if (cached) return JSON.parse(cached);
    } catch {
      // Redis down — fall through to DB
    }

    const result = await fallback();

    if (result) {
      try {
        await this.redis.set(key, JSON.stringify(result), 'EX', TENANT_CACHE_TTL);
      } catch {
        // Non-critical — next request will just hit DB again
      }
    }

    return result;
  }
}

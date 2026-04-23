import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { randomBytes } from 'crypto';
import { REDIS_CLIENT } from './redis.module';

/**
 * Distributed lock service built on Redis SET NX EX (single-instance Redlock).
 *
 * ┌───────────────────────────────────────────────────────────┐
 * │  Why Redis locks on top of Mongo transactions?            │
 * │                                                           │
 * │  MongoDB's $expr-based atomic update already prevents     │
 * │  overbooking at the DB layer. However, two concurrent     │
 * │  requests for the SAME slot group will both enter the     │
 * │  transaction, one succeeds and one gets a write-conflict  │
 * │  retry — which is expensive.                              │
 * │                                                           │
 * │  The Redis lock serializes writes to the same slot group  │
 * │  so only one transaction runs at a time:                  │
 * │                                                           │
 * │    User A → acquires lock → writes → releases             │
 * │    User B → waits for lock → writes → releases            │
 * │                                                           │
 * │  If Redis is down, we fall through to the Mongo-level     │
 * │  safety net — bookings still can't exceed capacity.       │
 * └───────────────────────────────────────────────────────────┘
 */
@Injectable()
export class RedisLockService {
  private readonly logger = new Logger(RedisLockService.name);

  /** Default lock time-to-live in seconds. Must be > max expected transaction time. */
  private readonly DEFAULT_TTL_SEC = 10;

  /** Retry interval in ms when waiting for a lock. */
  private readonly RETRY_DELAY_MS = 100;

  /** Max retry attempts before giving up. */
  private readonly MAX_RETRIES = 50; // 50 × 100ms = 5 seconds max wait

  private redisAvailable = true;

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {
    this.redis.on('error', (err) => {
      if (this.redisAvailable) {
        this.logger.warn(`Redis connection error — falling back to DB-only safety: ${err.message}`);
        this.redisAvailable = false;
      }
    });

    this.redis.on('connect', () => {
      if (!this.redisAvailable) {
        this.logger.log('Redis reconnected — distributed locks re-enabled');
      }
      this.redisAvailable = true;
    });
  }

  // ─── PUBLIC API ──────────────────────────────────────────────────────────────

  /**
   * Acquire a distributed lock.
   *
   * @param key    Unique lock key (e.g. `lock:slot:{tenantId}:{serviceId}:{date}:{startTime}`)
   * @param ttlSec Lock auto-expiry in seconds (safety net if holder crashes)
   * @returns      A token string to pass to `unlock()`, or `null` if Redis is down
   *               (caller should proceed with DB-level safety only)
   */
  async acquireLock(
    key: string,
    ttlSec: number = this.DEFAULT_TTL_SEC,
  ): Promise<string | null> {
    if (!this.redisAvailable) {
      this.logger.debug(`Redis unavailable — skipping lock for ${key}`);
      return null; // graceful degradation
    }

    const token = randomBytes(16).toString('hex');

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        // SET key token NX EX ttl — only sets if key does NOT exist
        const result = await this.redis.set(key, token, 'EX', ttlSec, 'NX');

        if (result === 'OK') {
          this.logger.debug(`Lock acquired: ${key} (token: ${token.slice(0, 8)}…)`);
          return token;
        }

        // Lock held by someone else — wait and retry
        await this.sleep(this.RETRY_DELAY_MS);
      } catch (err: any) {
        this.logger.warn(`Redis lock error on ${key}: ${err.message}`);
        return null; // fall through to DB safety
      }
    }

    // Exhausted retries — the slot is very contended
    this.logger.warn(`Lock acquisition timed out for ${key} after ${this.MAX_RETRIES} retries`);
    return null;
  }

  /**
   * Release a lock, but ONLY if we still own it (token matches).
   * Uses a Lua script for atomic compare-and-delete.
   */
  async releaseLock(key: string, token: string | null): Promise<void> {
    if (!token) return; // lock was never acquired (Redis was down)
    if (!this.redisAvailable) return;

    // Atomic: only delete if the value matches our token
    const luaScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    try {
      await this.redis.eval(luaScript, 1, key, token);
      this.logger.debug(`Lock released: ${key}`);
    } catch (err: any) {
      this.logger.warn(`Failed to release lock ${key}: ${err.message}`);
      // Lock will auto-expire via TTL — this is safe
    }
  }

  /**
   * Execute a callback while holding a lock.
   * Guarantees the lock is released even if the callback throws.
   *
   * If Redis is unavailable, the callback runs WITHOUT a lock (DB safety net).
   */
  async withLock<T>(
    key: string,
    callback: () => Promise<T>,
    ttlSec: number = this.DEFAULT_TTL_SEC,
  ): Promise<T> {
    const token = await this.acquireLock(key, ttlSec);
    try {
      return await callback();
    } finally {
      await this.releaseLock(key, token);
    }
  }

  // ─── BOOKING-SPECIFIC KEY BUILDERS ───────────────────────────────────────────

  /**
   * Builds a lock key that covers all slots a booking will touch.
   * Format: `lock:booking:{tenantId}:{serviceId}:{date}:{startTime}`
   *
   * This ensures two bookings for the SAME service + date + start time
   * are serialized, while bookings for different start times proceed in parallel.
   */
  slotLockKey(
    tenantId: string,
    serviceId: string,
    date: string,
    startTime: string,
  ): string {
    return `lock:booking:${tenantId}:${serviceId}:${date}:${startTime}`;
  }

  /**
   * Check if Redis is currently connected and available.
   */
  isAvailable(): boolean {
    return this.redisAvailable;
  }

  // ─── Private ─────────────────────────────────────────────────────────────────

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

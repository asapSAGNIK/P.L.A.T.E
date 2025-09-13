"use client"

// Advanced caching system with multiple layers and strategies
export interface CacheEntry<T> {
  data: T
  timestamp: number
  hits: number
  lastAccessed: number
  ttl: number
  tags?: string[]
}

export interface CacheMetrics {
  totalRequests: number
  cacheHits: number
  cacheMisses: number
  averageResponseTime: number
  memoryUsage: number
}

export interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  tags?: string[] // Tags for cache invalidation
  priority?: 'low' | 'medium' | 'high' // Cache priority for eviction
}

export class AdvancedCache<T> {
  private cache = new Map<string, CacheEntry<T>>()
  private metrics: CacheMetrics = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageResponseTime: 0,
    memoryUsage: 0
  }
  private maxSize: number
  private defaultTTL: number

  constructor(maxSize: number = 1000, defaultTTL: number = 15 * 60 * 1000) {
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL

    // Start metrics collection
    this.startMetricsCollection()
  }

  /**
   * Get item from cache with performance tracking
   */
  async get(key: string): Promise<T | null> {
    const startTime = performance.now()
    this.metrics.totalRequests++

    try {
      const entry = this.cache.get(key)

      if (!entry) {
        this.metrics.cacheMisses++
        return null
      }

      // Check if expired
      if (this.isExpired(entry)) {
        this.cache.delete(key)
        this.metrics.cacheMisses++
        return null
      }

      // Update access statistics
      entry.hits++
      entry.lastAccessed = Date.now()

      this.metrics.cacheHits++
      this.updateAverageResponseTime(performance.now() - startTime)

      return entry.data
    } finally {
      this.updateAverageResponseTime(performance.now() - startTime)
    }
  }

  /**
   * Set item in cache with advanced options
   */
  set(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl || this.defaultTTL

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      hits: 0,
      lastAccessed: Date.now(),
      ttl,
      tags: options.tags
    }

    // Evict if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictEntries()
    }

    this.cache.set(key, entry)
    this.updateMemoryUsage()
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    return (Date.now() - entry.timestamp) > entry.ttl
  }

  /**
   * Evict entries based on LRU and priority
   */
  private evictEntries(): void {
    const entries = Array.from(this.cache.entries())

    // Sort by priority and then by LRU
    entries.sort((a, b) => {
      const priorityA = this.getPriorityScore(a[1])
      const priorityB = this.getPriorityScore(b[1])

      if (priorityA !== priorityB) {
        return priorityB - priorityA // Higher priority first
      }

      return a[1].lastAccessed - b[1].lastAccessed // LRU
    })

    // Remove least valuable entries
    const toRemove = Math.ceil(this.maxSize * 0.2) // Remove 20%
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      this.cache.delete(entries[i][0])
    }
  }

  /**
   * Calculate priority score for eviction
   */
  private getPriorityScore(entry: CacheEntry<T>): number {
    const age = Date.now() - entry.timestamp
    const accessFrequency = entry.hits / Math.max(1, age / (1000 * 60)) // Hits per minute
    const recency = Date.now() - entry.lastAccessed

    // Higher score = more valuable (less likely to be evicted)
    return (accessFrequency * 10) + (entry.hits * 2) - (recency / (1000 * 60)) // Bonus for recency
  }

  /**
   * Invalidate cache entries by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    let invalidated = 0

    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags && entry.tags.some(tag => tags.includes(tag))) {
        this.cache.delete(key)
        invalidated++
      }
    }

    this.updateMemoryUsage()
    return invalidated
  }

  /**
   * Clear expired entries
   */
  async cleanup(): Promise<number> {
    let cleaned = 0

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key)
        cleaned++
      }
    }

    this.updateMemoryUsage()
    return cleaned
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheMetrics & {
    size: number
    hitRate: number
    averageTTL: number
  } {
    const totalEntries = this.cache.size
    const hitRate = this.metrics.totalRequests > 0
      ? (this.metrics.cacheHits / this.metrics.totalRequests) * 100
      : 0

    const averageTTL = totalEntries > 0
      ? Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.ttl, 0) / totalEntries
      : 0

    return {
      ...this.metrics,
      size: totalEntries,
      hitRate,
      averageTTL
    }
  }

  /**
   * Update memory usage estimate
   */
  private updateMemoryUsage(): void {
    // Rough estimate: 1KB per entry + data size
    const baseSizePerEntry = 1024 // 1KB
    const estimatedSize = this.cache.size * baseSizePerEntry
    this.metrics.memoryUsage = estimatedSize
  }

  /**
   * Update average response time
   */
  private updateAverageResponseTime(responseTime: number): void {
    const alpha = 0.1 // Smoothing factor
    this.metrics.averageResponseTime =
      (alpha * responseTime) + ((1 - alpha) * this.metrics.averageResponseTime)
  }

  /**
   * Start periodic metrics collection and cleanup
   */
  private startMetricsCollection(): void {
    // Cleanup expired entries every 5 minutes
    setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)

    // Log metrics every 10 minutes
    setInterval(() => {
      const stats = this.getStats()
      console.log('Cache Stats:', {
        hitRate: `${stats.hitRate.toFixed(2)}%`,
        size: stats.size,
        memoryUsage: `${(stats.memoryUsage / 1024).toFixed(2)}KB`,
        totalRequests: stats.totalRequests
      })
    }, 10 * 60 * 1000)
  }
}

// Specialized caches for different data types
export const ingredientCache = new AdvancedCache<any>(500, 30 * 60 * 1000) // 30 min TTL
export const compatibilityCache = new AdvancedCache<any>(300, 15 * 60 * 1000) // 15 min TTL
export const suggestionCache = new AdvancedCache<any>(200, 20 * 60 * 1000) // 20 min TTL
export const recipeCache = new AdvancedCache<any>(100, 10 * 60 * 1000) // 10 min TTL

/**
 * Cache warming for frequently used ingredients
 */
export async function warmIngredientCache(): Promise<void> {
  const commonIngredients = [
    'chicken', 'beef', 'rice', 'pasta', 'onion', 'garlic', 'tomato',
    'potato', 'carrot', 'eggs', 'milk', 'cheese', 'bread', 'flour'
  ]

  console.log('Warming ingredient cache...')

  for (const ingredient of commonIngredients) {
    try {
      // Check if already cached
      const cacheKey = `ingredient:${ingredient}`
      const cached = await ingredientCache.get(cacheKey)

      if (!cached) {
        // This would normally call the AI classification service
        // For demo purposes, we'll simulate caching
        ingredientCache.set(cacheKey, {
          ingredient,
          category: 'common',
          cached: true
        }, {
          tags: ['ingredient', 'common'],
          ttl: 60 * 60 * 1000 // 1 hour for common ingredients
        })
      }
    } catch (error) {
      console.warn(`Failed to warm cache for ${ingredient}:`, error)
    }
  }

  console.log('Ingredient cache warming complete')
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  /**
   * Time a function execution
   */
  async timeExecution<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - start
      this.recordMetric(name, duration)
      return result
    } catch (error) {
      const duration = performance.now() - start
      this.recordMetric(`${name}_error`, duration)
      throw error
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }

    const values = this.metrics.get(name)!
    values.push(value)

    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift()
    }
  }

  /**
   * Get performance statistics
   */
  getStats(name: string): {
    average: number
    median: number
    p95: number
    min: number
    max: number
    count: number
  } | null {
    const values = this.metrics.get(name)
    if (!values || values.length === 0) return null

    const sorted = [...values].sort((a, b) => a - b)
    const count = values.length
    const average = values.reduce((sum, val) => sum + val, 0) / count
    const median = sorted[Math.floor(count / 2)]
    const p95 = sorted[Math.floor(count * 0.95)]
    const min = Math.min(...values)
    const max = Math.max(...values)

    return { average, median, p95, min, max, count }
  }

  /**
   * Get all performance metrics
   */
  getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {}

    for (const [name, values] of this.metrics.entries()) {
      stats[name] = this.getStats(name)
    }

    return stats
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance()

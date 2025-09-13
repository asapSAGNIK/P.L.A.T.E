"use client"

// A/B Testing Framework for Smart Ingredient System
export type ExperimentVariant = 'control' | 'smart_compatibility' | 'enhanced_suggestions' | 'full_system'

export interface ExperimentConfig {
  name: string
  variants: ExperimentVariant[]
  weights: number[] // Distribution weights for variants
  enabled: boolean
  targetPercentage: number // Percentage of users to include (0-100)
}

export interface ExperimentResult {
  experimentName: string
  variant: ExperimentVariant
  userId: string
  metrics: {
    recipeGenerationTime: number
    compatibilityScore: number
    userSatisfaction: number
    fallbackRecipeUsage: number
    suggestionAcceptance: number
  }
  timestamp: number
}

export interface UserExperiment {
  userId: string
  experimentName: string
  variant: ExperimentVariant
  assignedAt: number
  completed: boolean
}

class ABTestingFramework {
  private experiments: Map<string, ExperimentConfig> = new Map()
  private userAssignments: Map<string, UserExperiment[]> = new Map()
  private results: ExperimentResult[] = []

  constructor() {
    this.initializeExperiments()
    this.loadUserAssignments()
  }

  /**
   * Initialize default experiments
   */
  private initializeExperiments(): void {
    // Main smart ingredient system experiment
    this.experiments.set('smart_ingredients_main', {
      name: 'Smart Ingredients Main',
      variants: ['control', 'smart_compatibility', 'enhanced_suggestions', 'full_system'],
      weights: [25, 25, 25, 25], // Equal distribution
      enabled: true,
      targetPercentage: 100 // Include all users
    })

    // Compatibility analysis experiment
    this.experiments.set('compatibility_analysis', {
      name: 'Compatibility Analysis',
      variants: ['control', 'smart_compatibility'],
      weights: [50, 50],
      enabled: true,
      targetPercentage: 80
    })

    // Suggestions experiment
    this.experiments.set('smart_suggestions', {
      name: 'Smart Suggestions',
      variants: ['control', 'enhanced_suggestions'],
      weights: [40, 60], // 60% get enhanced suggestions
      enabled: true,
      targetPercentage: 70
    })
  }

  /**
   * Assign user to experiment variant
   */
  assignUserToExperiment(userId: string, experimentName: string): ExperimentVariant {
    const experiment = this.experiments.get(experimentName)
    if (!experiment || !experiment.enabled) {
      return 'control' // Default fallback
    }

    // Check if user is already assigned
    const existingAssignments = this.userAssignments.get(userId) || []
    const existingAssignment = existingAssignments.find(a => a.experimentName === experimentName)

    if (existingAssignment) {
      return existingAssignment.variant
    }

    // Check if user should be included in experiment
    if (!this.shouldIncludeUser(userId, experiment.targetPercentage)) {
      return 'control'
    }

    // Assign variant based on weights
    const variant = this.selectVariantByWeight(experiment.variants, experiment.weights)

    const assignment: UserExperiment = {
      userId,
      experimentName,
      variant,
      assignedAt: Date.now(),
      completed: false
    }

    // Store assignment
    const userAssignments = this.userAssignments.get(userId) || []
    userAssignments.push(assignment)
    this.userAssignments.set(userId, userAssignments)

    // Persist to localStorage (in production, this would be a database)
    this.saveUserAssignments()

    console.log(`Assigned user ${userId} to ${experimentName}:${variant}`)
    return variant
  }

  /**
   * Get user's experiment variant
   */
  getUserVariant(userId: string, experimentName: string): ExperimentVariant {
    const assignments = this.userAssignments.get(userId) || []
    const assignment = assignments.find(a => a.experimentName === experimentName)

    if (assignment) {
      return assignment.variant
    }

    // Assign if not already assigned
    return this.assignUserToExperiment(userId, experimentName)
  }

  /**
   * Record experiment result
   */
  recordResult(result: ExperimentResult): void {
    this.results.push(result)

    // Mark user experiment as completed
    const userAssignments = this.userAssignments.get(result.userId) || []
    const assignment = userAssignments.find(a =>
      a.experimentName === result.experimentName && a.variant === result.variant
    )

    if (assignment) {
      assignment.completed = true
      this.saveUserAssignments()
    }

    console.log(`Recorded result for ${result.experimentName}:${result.variant} - User: ${result.userId}`)
  }

  /**
   * Get experiment statistics
   */
  getExperimentStats(experimentName: string): {
    totalParticipants: number
    variantDistribution: Record<ExperimentVariant, number>
    averageMetrics: Record<string, number>
    confidenceIntervals: Record<string, { min: number; max: number }>
  } | null {
    const experiment = this.experiments.get(experimentName)
    if (!experiment) return null

    const experimentResults = this.results.filter(r => r.experimentName === experimentName)

    if (experimentResults.length === 0) {
      return {
        totalParticipants: 0,
        variantDistribution: {} as any,
        averageMetrics: {},
        confidenceIntervals: {}
      }
    }

    // Calculate variant distribution
    const variantDistribution: Record<ExperimentVariant, number> = {} as any
    for (const variant of experiment.variants) {
      variantDistribution[variant] = experimentResults.filter(r => r.variant === variant).length
    }

    // Calculate average metrics
    const metrics = ['recipeGenerationTime', 'compatibilityScore', 'userSatisfaction', 'fallbackRecipeUsage', 'suggestionAcceptance']
    const averageMetrics: Record<string, number> = {}

    for (const metric of metrics) {
      const values = experimentResults.map(r => r.metrics[metric as keyof typeof r.metrics])
      averageMetrics[metric] = values.reduce((sum, val) => sum + val, 0) / values.length
    }

    // Calculate confidence intervals (simplified)
    const confidenceIntervals: Record<string, { min: number; max: number }> = {}
    for (const metric of metrics) {
      const values = experimentResults.map(r => r.metrics[metric as keyof typeof r.metrics])
      const mean = averageMetrics[metric]
      const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length)
      const confidence = 1.96 * (stdDev / Math.sqrt(values.length)) // 95% confidence

      confidenceIntervals[metric] = {
        min: Math.max(0, mean - confidence),
        max: mean + confidence
      }
    }

    return {
      totalParticipants: experimentResults.length,
      variantDistribution,
      averageMetrics,
      confidenceIntervals
    }
  }

  /**
   * Check if user should be included in experiment
   */
  private shouldIncludeUser(userId: string, targetPercentage: number): boolean {
    // Use consistent hashing to determine inclusion
    const hash = this.simpleHash(userId)
    const percentage = (hash % 100) + 1
    return percentage <= targetPercentage
  }

  /**
   * Select variant based on weights
   */
  private selectVariantByWeight(variants: ExperimentVariant[], weights: number[]): ExperimentVariant {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
    const random = Math.random() * totalWeight

    let cumulativeWeight = 0
    for (let i = 0; i < variants.length; i++) {
      cumulativeWeight += weights[i]
      if (random <= cumulativeWeight) {
        return variants[i]
      }
    }

    return variants[0] // Fallback
  }

  /**
   * Simple hash function for consistent user assignment
   */
  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  /**
   * Load user assignments from localStorage
   */
  private loadUserAssignments(): void {
    // Only run in browser environment
    if (typeof window === 'undefined') {
      return
    }

    try {
      const stored = localStorage.getItem('ab_testing_assignments')
      if (stored) {
        const assignments = JSON.parse(stored)
        this.userAssignments = new Map(assignments)
      }
    } catch (error) {
      console.warn('Failed to load user assignments:', error)
    }
  }

  /**
   * Save user assignments to localStorage
   */
  private saveUserAssignments(): void {
    // Only run in browser environment
    if (typeof window === 'undefined') {
      return
    }

    try {
      const assignments = Array.from(this.userAssignments.entries())
      localStorage.setItem('ab_testing_assignments', JSON.stringify(assignments))
    } catch (error) {
      console.warn('Failed to save user assignments:', error)
    }
  }

  /**
   * Get all active experiments
   */
  getActiveExperiments(): ExperimentConfig[] {
    return Array.from(this.experiments.values()).filter(exp => exp.enabled)
  }

  /**
   * Enable/disable experiment
   */
  setExperimentEnabled(experimentName: string, enabled: boolean): void {
    const experiment = this.experiments.get(experimentName)
    if (experiment) {
      experiment.enabled = enabled
      console.log(`${enabled ? 'Enabled' : 'Disabled'} experiment: ${experimentName}`)
    }
  }

  /**
   * Reset experiment data (for testing)
   */
  resetExperiment(experimentName: string): void {
    // Remove all results for this experiment
    this.results = this.results.filter(r => r.experimentName !== experimentName)

    // Remove assignments for this experiment
    for (const [userId, assignments] of this.userAssignments.entries()) {
      const filteredAssignments = assignments.filter(a => a.experimentName !== experimentName)
      if (filteredAssignments.length === 0) {
        this.userAssignments.delete(userId)
      } else {
        this.userAssignments.set(userId, filteredAssignments)
      }
    }

    this.saveUserAssignments()
    console.log(`Reset experiment: ${experimentName}`)
  }
}

// Export singleton instance
export const abTesting = new ABTestingFramework()

/**
 * Feature flag system integrated with A/B testing
 */
export class FeatureFlags {
  private static instance: FeatureFlags
  private flags: Map<string, boolean> = new Map()

  static getInstance(): FeatureFlags {
    if (!FeatureFlags.instance) {
      FeatureFlags.instance = new FeatureFlags()
    }
    return FeatureFlags.instance
  }

  /**
   * Check if feature is enabled for user
   */
  isEnabled(featureName: string, userId?: string): boolean {
    // Check experiment-based features first
    switch (featureName) {
      case 'smart_compatibility':
        if (userId) {
          const variant = abTesting.getUserVariant(userId, 'compatibility_analysis')
          return variant === 'smart_compatibility'
        }
        return false

      case 'enhanced_suggestions':
        if (userId) {
          const variant = abTesting.getUserVariant(userId, 'smart_suggestions')
          return variant === 'enhanced_suggestions'
        }
        return false

      case 'full_smart_system':
        if (userId) {
          const variant = abTesting.getUserVariant(userId, 'smart_ingredients_main')
          return variant === 'full_system'
        }
        return false
    }

    // Check static feature flags
    return this.flags.get(featureName) ?? false
  }

  /**
   * Set feature flag
   */
  setFlag(featureName: string, enabled: boolean): void {
    this.flags.set(featureName, enabled)
  }

  /**
   * Get all feature flags
   */
  getAllFlags(): Record<string, boolean> {
    const result: Record<string, boolean> = {}

    for (const [name, enabled] of this.flags.entries()) {
      result[name] = enabled
    }

    return result
  }
}

// Export singleton instance
export const featureFlags = FeatureFlags.getInstance()

/**
 * Analytics tracking for A/B testing
 */
export class AnalyticsTracker {
  private static instance: AnalyticsTracker
  private events: any[] = []

  static getInstance(): AnalyticsTracker {
    if (!AnalyticsTracker.instance) {
      AnalyticsTracker.instance = new AnalyticsTracker()
    }
    return AnalyticsTracker.instance
  }

  /**
   * Track user interaction with smart features
   */
  trackEvent(eventType: string, userId: string, data: any): void {
    const event = {
      type: eventType,
      userId,
      data,
      timestamp: Date.now()
    }

    this.events.push(event)

    // In production, this would send to analytics service
    console.log('Analytics Event:', event)

    // Keep only last 1000 events in memory
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000)
    }
  }

  /**
   * Track recipe generation metrics
   */
  trackRecipeGeneration(userId: string, variant: ExperimentVariant, metrics: {
    generationTime: number
    ingredientCount: number
    compatibilityLevel: string
    usedFallback: boolean
    suggestionsShown: number
    suggestionsAccepted: number
  }): void {
    this.trackEvent('recipe_generation', userId, {
      variant,
      ...metrics
    })

    // Record experiment result
    const result: ExperimentResult = {
      experimentName: 'smart_ingredients_main',
      variant,
      userId,
      metrics: {
        recipeGenerationTime: metrics.generationTime,
        compatibilityScore: this.getCompatibilityScore(metrics.compatibilityLevel),
        userSatisfaction: 0, // Would be collected via user feedback
        fallbackRecipeUsage: metrics.usedFallback ? 1 : 0,
        suggestionAcceptance: metrics.suggestionsAccepted / Math.max(1, metrics.suggestionsShown)
      },
      timestamp: Date.now()
    }

    abTesting.recordResult(result)
  }

  /**
   * Convert compatibility level to score
   */
  private getCompatibilityScore(level: string): number {
    switch (level) {
      case 'excellent': return 90
      case 'good': return 75
      case 'limited': return 45
      case 'incompatible': return 20
      default: return 50
    }
  }

  /**
   * Get analytics summary
   */
  getAnalyticsSummary(): {
    totalEvents: number
    eventsByType: Record<string, number>
    recentEvents: any[]
  } {
    const eventsByType: Record<string, number> = {}

    for (const event of this.events) {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1
    }

    return {
      totalEvents: this.events.length,
      eventsByType,
      recentEvents: this.events.slice(-10) // Last 10 events
    }
  }
}

// Export singleton instance
export const analyticsTracker = AnalyticsTracker.getInstance()

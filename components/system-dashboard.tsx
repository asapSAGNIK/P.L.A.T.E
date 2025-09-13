"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import {
  Database,
  TrendingUp,
  Users,
  Zap,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  Activity
} from "lucide-react"
import {
  ingredientCache,
  compatibilityCache,
  suggestionCache,
  recipeCache,
  performanceMonitor
} from "@/lib/advanced-cache"
import { abTesting, analyticsTracker } from "@/lib/ab-testing"

interface CacheStats {
  name: string
  size: number
  hitRate: number
  memoryUsage: string
  averageTTL: string
}

interface ExperimentStats {
  name: string
  totalParticipants: number
  variants: Array<{
    name: string
    count: number
    percentage: number
  }>
  metrics: {
    recipeGenerationTime: { average: number; p95: number }
    compatibilityScore: { average: number }
    userSatisfaction: { average: number }
  }
}

export function SystemDashboard() {
  const [cacheStats, setCacheStats] = useState<CacheStats[]>([])
  const [experimentStats, setExperimentStats] = useState<ExperimentStats[]>([])
  const [performanceStats, setPerformanceStats] = useState<any>({})
  const [analyticsSummary, setAnalyticsSummary] = useState<any>({})

  const loadStats = () => {
    // Load cache statistics
    const ingredientStats = ingredientCache.getStats()
    const compatibilityStats = compatibilityCache.getStats()
    const suggestionStats = suggestionCache.getStats()
    const recipeStats = recipeCache.getStats()

    const stats: CacheStats[] = [
      {
        name: 'Ingredients',
        size: ingredientStats.size,
        hitRate: ingredientStats.hitRate,
        memoryUsage: `${(ingredientStats.memoryUsage / 1024).toFixed(1)}KB`,
        averageTTL: `${(ingredientStats.averageTTL / (1000 * 60)).toFixed(1)}min`
      },
      {
        name: 'Compatibility',
        size: compatibilityStats.size,
        hitRate: compatibilityStats.hitRate,
        memoryUsage: `${(compatibilityStats.memoryUsage / 1024).toFixed(1)}KB`,
        averageTTL: `${(compatibilityStats.averageTTL / (1000 * 60)).toFixed(1)}min`
      },
      {
        name: 'Suggestions',
        size: suggestionStats.size,
        hitRate: suggestionStats.hitRate,
        memoryUsage: `${(suggestionStats.memoryUsage / 1024).toFixed(1)}KB`,
        averageTTL: `${(suggestionStats.averageTTL / (1000 * 60)).toFixed(1)}min`
      },
      {
        name: 'Recipes',
        size: recipeStats.size,
        hitRate: recipeStats.hitRate,
        memoryUsage: `${(recipeStats.memoryUsage / 1024).toFixed(1)}KB`,
        averageTTL: `${(recipeStats.averageTTL / (1000 * 60)).toFixed(1)}min`
      }
    ]
    setCacheStats(stats)

    // Load experiment statistics
    const experiments = abTesting.getActiveExperiments()
    const expStats: ExperimentStats[] = experiments.map(exp => {
      const stats = abTesting.getExperimentStats(exp.name)
      if (!stats) return null

      const variants = Object.entries(stats.variantDistribution).map(([name, count]) => ({
        name,
        count,
        percentage: stats.totalParticipants > 0 ? (count / stats.totalParticipants) * 100 : 0
      }))

      return {
        name: exp.name,
        totalParticipants: stats.totalParticipants,
        variants,
        metrics: {
          recipeGenerationTime: stats.averageMetrics.recipeGenerationTime || { average: 0, p95: 0 },
          compatibilityScore: stats.averageMetrics.compatibilityScore || { average: 0 },
          userSatisfaction: stats.averageMetrics.userSatisfaction || { average: 0 }
        }
      }
    }).filter(Boolean) as ExperimentStats[]

    setExperimentStats(expStats)

    // Load performance statistics
    setPerformanceStats(performanceMonitor.getAllStats())

    // Load analytics summary
    setAnalyticsSummary(analyticsTracker.getAnalyticsSummary())
  }

  useEffect(() => {
    loadStats()

    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Dashboard</h2>
          <p className="text-gray-600">Monitor performance, caching, and A/B testing metrics</p>
        </div>
        <Button onClick={loadStats} size="sm" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="cache" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cache" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Cache
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="experiments" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            A/B Tests
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cache" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cacheStats.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{stat.name} Cache</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Size</span>
                      <Badge variant="secondary">{stat.size} items</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Hit Rate</span>
                      <Badge variant={stat.hitRate > 80 ? "default" : stat.hitRate > 50 ? "secondary" : "destructive"}>
                        {stat.hitRate.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Memory</span>
                      <span className="text-sm font-medium">{stat.memoryUsage}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">TTL</span>
                      <span className="text-sm font-medium">{stat.averageTTL}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Cache Performance
              </CardTitle>
              <CardDescription>Hit rates and memory usage across different caches</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cacheStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="hitRate" fill="#8884d8" name="Hit Rate (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(performanceStats).map(([name, stats]: [string, any]) => (
              <Card key={name}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium capitalize">
                    {name.replace('_', ' ')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Average</span>
                      <Badge variant="secondary">
                        {stats?.average?.toFixed(2)}ms
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">95th Percentile</span>
                      <Badge variant="secondary">
                        {stats?.p95?.toFixed(2)}ms
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Samples</span>
                      <Badge variant="outline">{stats?.count || 0}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="experiments" className="space-y-4">
          {experimentStats.map((experiment, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{experiment.name}</CardTitle>
                <CardDescription>
                  {experiment.totalParticipants} participants
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Variant Distribution</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={experiment.variants}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                          outerRadius={60}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {experiment.variants.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Performance Metrics</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Avg Generation Time</span>
                        <Badge variant="secondary">
                          {experiment.metrics.recipeGenerationTime.average?.toFixed(2)}ms
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">95th Percentile</span>
                        <Badge variant="secondary">
                          {experiment.metrics.recipeGenerationTime.p95?.toFixed(2)}ms
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Compatibility Score</span>
                        <Badge variant="secondary">
                          {experiment.metrics.compatibilityScore.average?.toFixed(1)}/100
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {experimentStats.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">No active experiments</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {analyticsSummary.totalEvents || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Event Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {Object.keys(analyticsSummary.eventsByType || {}).length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
              <CardDescription>Latest user interactions and system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {analyticsSummary.recentEvents?.map((event: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium text-sm">{event.type}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        User: {event.userId?.slice(0, 8)}...
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                )) || (
                  <p className="text-center text-gray-500 py-4">No recent events</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { ensureAuthenticated, getAuthTokenForAPI, getSupabaseSession, getUserInfo } from '../../lib/simplified-auth';

export default function DebugAuthPage() {
  const [supabaseSession, setSupabaseSession] = useState<any>(null);
  const [backendToken, setBackendToken] = useState<string | null>(null);
  const [cachedToken, setCachedToken] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<string>('Unknown');
  const [loading, setLoading] = useState(false);

  const checkAuthStatus = async () => {
    setLoading(true);
    try {
      // Check Supabase session
      const { session } = await getSupabaseSession();
      setSupabaseSession(session);

      // Check auth token
      const token = await getAuthTokenForAPI();
      setBackendToken(token);

      // Check overall auth status
      const isAuth = await ensureAuthenticated();
      setAuthStatus(isAuth ? 'Authenticated' : 'Not Authenticated');

      // Get user info
      const userInfo = await getUserInfo();
      console.log('User Info:', userInfo);

    } catch (error) {
      console.error('Auth check error:', error);
      setAuthStatus('Error');
    } finally {
      setLoading(false);
    }
  };

  const testApiCall = async () => {
    try {
      const token = await getAuthTokenForAPI();
      if (!token) {
        alert('No Supabase token available');
        return;
      }

      // Test the recipe API directly
      const testRequest = {
        ingredients: ['chicken', 'tomatoes'],
        filters: { maxTime: 30, servings: 2 }
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipes/find-by-ingredients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(testRequest)
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Recipe API Success! Found ${data.length} recipes.${data.length > 0 ? ` First recipe: ${data[0].title}` : ''}`);
      } else {
        const errorData = await response.json();
        alert(`API Error: ${response.status} - ${JSON.stringify(errorData, null, 2)}`);
      }
    } catch (error) {
      alert(`API Error: ${error}`);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Authentication Debug Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Supabase Session</CardTitle>
            <CardDescription>Current Supabase authentication status</CardDescription>
          </CardHeader>
          <CardContent>
            {supabaseSession ? (
              <div className="space-y-2">
                <Badge variant="secondary">Authenticated</Badge>
                <p><strong>User ID:</strong> {supabaseSession.user?.id}</p>
                <p><strong>Email:</strong> {supabaseSession.user?.email}</p>
                <p><strong>Provider:</strong> {supabaseSession.user?.app_metadata?.provider}</p>
              </div>
            ) : (
              <Badge variant="destructive">No Session</Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supabase Token</CardTitle>
            <CardDescription>Access token from Supabase session</CardDescription>
          </CardHeader>
          <CardContent>
            {backendToken ? (
              <div className="space-y-2">
                <Badge variant="secondary">Token Available</Badge>
                <p><strong>Token (first 20 chars):</strong> {backendToken.substring(0, 20)}...</p>
              </div>
            ) : (
              <Badge variant="destructive">No Token</Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overall Status</CardTitle>
            <CardDescription>Combined authentication status</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant={authStatus === 'Authenticated' ? 'default' : 'destructive'}>
              {authStatus}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="flex space-x-4">
        <Button onClick={checkAuthStatus} disabled={loading}>
          {loading ? 'Checking...' : 'Refresh Status'}
        </Button>
        <Button onClick={testApiCall} variant="outline">
          Test API Call
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Environment Check</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'Not set'}</p>
            <p><strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set'}</p>
            <p><strong>Supabase Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

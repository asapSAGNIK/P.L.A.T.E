// Test script for Supabase Edge Functions
// This script tests all Edge Functions to identify issues

const SUPABASE_URL = 'https://lmdoqtkotwbgbsudreff.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtZG9xdGtvdHdiZ2JzdWRyZWZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MDM5MzYsImV4cCI6MjA2NTQ3OTkzNn0.UbGOSX9xPQaGgkuD_WQIwnLrxyHDPzQ_CIpNhqslIwY'

// Test functions
const functions = [
  'generate-recipes',
  'save-recipe', 
  'get-saved-recipes',
  'remove-recipe',
  'check-rate-limit',
  'get-recipe-history',
  'spoonacular-search',
  'ai-commentary'
]

async function testFunction(functionName, testData = {}) {
  console.log(`\n🧪 Testing ${functionName}...`)
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    })
    
    const result = await response.text()
    console.log(`Status: ${response.status}`)
    console.log(`Response: ${result}`)
    
    if (response.status === 401) {
      console.log('✅ Function is deployed and responding (401 expected without proper auth)')
    } else if (response.status === 200) {
      console.log('✅ Function working correctly')
    } else {
      console.log(`⚠️ Function returned status ${response.status}`)
    }
    
  } catch (error) {
    console.log(`❌ Error testing ${functionName}:`, error.message)
  }
}

async function testAllFunctions() {
  console.log('🚀 Testing all Supabase Edge Functions...')
  console.log(`Supabase URL: ${SUPABASE_URL}`)
  
  for (const func of functions) {
    await testFunction(func, { test: true })
  }
  
  console.log('\n📋 Test Summary:')
  console.log('- 401 responses are expected (functions are deployed but need proper auth)')
  console.log('- 200 responses indicate functions are working')
  console.log('- 500 responses indicate server errors (check environment variables)')
  console.log('- Network errors indicate functions are not deployed')
}

// Run tests
testAllFunctions().catch(console.error)

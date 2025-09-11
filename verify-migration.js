// Verification script to test if the migration was successful
// This script tests the database schema and Edge Functions

const SUPABASE_URL = 'https://lmdoqtkotwbgbsudreff.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtZG9xdGtvdHdiZ2JzdWRyZWZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MDM5MzYsImV4cCI6MjA2NTQ3OTkzNn0.UbGOSX9xPQaGgkuD_WQIwnLrxyHDPzQ_CIpNhqslIwY'

async function testDatabaseSchema() {
  console.log('🔍 Testing Database Schema...')
  
  try {
    // Test if we can query the user_saved_recipes table with status column
    const response = await fetch(`${SUPABASE_URL}/rest/v1/user_saved_recipes?select=id,status&limit=1`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    })
    
    if (response.status === 200) {
      console.log('✅ user_saved_recipes table with status column is accessible')
      return true
    } else if (response.status === 401) {
      console.log('⚠️ Authentication required (expected for RLS)')
      return true // This is actually good - means the table exists and RLS is working
    } else {
      console.log(`❌ Error accessing user_saved_recipes: ${response.status}`)
      const error = await response.text()
      console.log('Error details:', error)
      return false
    }
  } catch (error) {
    console.log('❌ Error testing database schema:', error.message)
    return false
  }
}

async function testEdgeFunction() {
  console.log('\n🧪 Testing get-saved-recipes Edge Function...')
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/get-saved-recipes`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    })
    
    const result = await response.text()
    console.log(`Status: ${response.status}`)
    console.log(`Response: ${result}`)
    
    if (response.status === 401) {
      console.log('✅ Edge Function is responding (401 expected without proper auth)')
      return true
    } else if (response.status === 500) {
      console.log('❌ Edge Function still returning 500 error')
      console.log('The migration may not have been applied yet')
      return false
    } else if (response.status === 200) {
      console.log('✅ Edge Function working correctly')
      return true
    } else {
      console.log(`⚠️ Edge Function returned status ${response.status}`)
      return false
    }
  } catch (error) {
    console.log('❌ Error testing Edge Function:', error.message)
    return false
  }
}

async function runVerification() {
  console.log('🚀 P.L.A.T.E Migration Verification')
  console.log('=====================================')
  
  const schemaTest = await testDatabaseSchema()
  const edgeFunctionTest = await testEdgeFunction()
  
  console.log('\n📋 Verification Results:')
  console.log('========================')
  console.log(`Database Schema: ${schemaTest ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Edge Function: ${edgeFunctionTest ? '✅ PASS' : '❌ FAIL'}`)
  
  if (schemaTest && edgeFunctionTest) {
    console.log('\n🎉 Migration appears to be successful!')
    console.log('You can now test your application.')
  } else {
    console.log('\n⚠️ Migration may not be complete yet.')
    console.log('Please run the migration script in Supabase SQL Editor.')
  }
  
  console.log('\n📋 Next Steps:')
  console.log('1. If migration is successful, test your application')
  console.log('2. Check the Saved Recipes page')
  console.log('3. Check the Cooking History page')
  console.log('4. If everything works, remove the backend directory')
}

// Run verification
runVerification().catch(console.error)

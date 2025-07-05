# Application Flow Document
# Plate - Your Personal AI Chef

## User Journey Overview

### 1. Landing Page
- Welcome screen with app introduction
- **Sign in with Google (Supabase Auth) only**
- Quick feature overview
- Optional demo mode

### 2. Authentication Flow
#### Google Sign-In (Supabase)
1. User clicks "Sign in with Google"
2. Authenticates via Google (Supabase Auth UI)
3. On success, user is redirected to dashboard
4. Session is managed by Supabase; JWT is issued by Supabase and sent with API requests

### 3. Main Application Flow

#### Dashboard
- Quick access to:
  - "Cook within the Fridge"
  - "Out of the Fridge"
  - Chef's History
  - User Profile
  - Settings

#### A. Cook within the Fridge Flow
1. User selects "Cook within the Fridge"
2. Ingredient Input:
   - Manual ingredient entry
   - Optional: Upload ingredient photo
   - Optional: Voice input
3. AI Processing:
   - Analyze available ingredients
   - Generate recipe suggestions
   - Apply Gordon Ramsay personality
4. Recipe Display:
   - Show possible recipes
   - Display cooking instructions
   - Optional: Voice guidance
5. User Actions:
   - Select recipe
   - Save to history
   - Start cooking mode
   - Get additional tips

#### B. Out of the Fridge Flow
1. User selects "Out of the Fridge"
2. Recipe Discovery:
   - Browse categories
   - Search by cuisine
   - Filter by preferences
   - View trending recipes
3. Recipe Selection:
   - View recipe details
   - Check ingredients needed
   - Read cooking instructions
   - View AI chef commentary
4. User Actions:
   - Save recipe
   - Start cooking mode
   - Share recipe
   - Rate and review

#### C. Chef's History Flow
1. Access saved recipes
2. View cooking history
3. Filter and search
4. Manage saved recipes:
   - Edit notes
   - Delete
   - Share
   - Rate

### 4. Cooking Mode Flow
1. Start cooking mode
2. Step-by-step guidance:
   - Display instructions
   - Optional: Voice guidance
   - Timer integration
   - Tips and tricks
3. Progress tracking
4. Completion and feedback

### 5. AI Interaction Flow
1. Recipe Generation:
   - Process ingredients
   - Generate recipes
   - Apply personality
   - Add creative twists
2. Voice Interaction:
   - Enable/disable voice
   - Adjust voice settings
   - Voice commands
3. Real-time Assistance:
   - Answer questions
   - Provide tips
   - Handle substitutions

### 6. Error Handling Flows
1. Authentication Errors:
   - Google sign-in failure
   - Session timeout
   - Account locked
2. Recipe Generation Errors:
   - No recipes found
   - API failures
   - Invalid ingredients
3. Voice Interaction Errors:
   - Voice synthesis issues
   - Command recognition failures
4. General Errors:
   - Network issues
   - Server errors
   - Invalid inputs

### 7. Settings and Preferences
1. User Profile:
   - Update information
   - **(Password change not applicable; managed by Google)**
   - Manage preferences
2. Application Settings:
   - Voice settings
   - Notification preferences
   - Display options
3. Dietary Preferences:
   - Set restrictions
   - Allergies
   - Cuisine preferences

## State Management
1. User Session
2. Recipe Generation State
3. Cooking Mode State
4. Voice Interaction State
5. Error States

## Data Flow
1. User Input → Backend Processing
2. API Integration → Recipe Generation
3. AI Processing → User Interface
4. User Actions → History Updates
5. Settings → Application State

## Security Considerations
1. Authentication Flow (**Supabase Google Auth required for all authenticated flows; no email/password**)
2. Data Encryption
3. API Security (CORS enforced, allowed origins set in backend)
4. User Data Protection (Supabase with RLS)
5. Session Management (Supabase JWT stored securely)
6. Rate Limiting (100/min for authenticated, 20/min for unauthenticated)
7. Type Safety and Data Shape Consistency (frontend and backend types in sync)
8. Error Handling (consistent error response structure)
9. Environment Variables (NEXT_PUBLIC_API_URL for API calls; update for each environment)
10. Testing Flows (use Postman/curl for API testing)
11. Backward Compatibility (auth and API flows maintained) 
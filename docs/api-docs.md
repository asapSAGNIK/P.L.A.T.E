# API Documentation
# Plate - Your Personal AI Chef

## Base URL
```
https://api.plate-app.com/v1
```

## Authentication
All API requests require authentication using JWT tokens.
Include the token in the Authorization header:
```
Authorization: Bearer <token>
```
- Both Google OAuth and email/password authentication are supported. The backend issues a JWT for both flows.
- Store JWT securely (prefer httpOnly cookie for web, or secure storage for mobile).
- All endpoints are CORS-enabled for allowed frontend origins.
- Supabase (PostgreSQL) is used as the database, with Row-Level Security (RLS) enabled for user data.

## API Endpoints

### Authentication

#### Register User
```http
POST /auth/register
```
Request Body:
```json
{
  "email": "string",
  "password": "string",
  "name": "string",
  "dietaryPreferences": ["string"],
  "allergies": ["string"]
}
```
Response:
```json
{
  "token": "string",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string"
  }
}
```

#### Login
```http
POST /auth/login
```
Request Body:
```json
{
  "email": "string",
  "password": "string"
}
```
Response:
```json
{
  "token": "string",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string"
  }
}
```

#### Google OAuth
```http
GET /auth/google
```
- Redirects to Google for authentication, then issues a JWT on callback.
- Use the JWT for all subsequent API requests.

### User Management

#### Get User Profile
```http
GET /users/profile
```
Response:
```json
{
  "id": "string",
  "email": "string",
  "profile": {
    "name": "string",
    "dietaryPreferences": ["string"],
    "allergies": ["string"],
    "cookingSkillLevel": "string",
    "preferredCuisines": ["string"]
  },
  "settings": {
    "voiceEnabled": "boolean",
    "notifications": "boolean",
    "theme": "string"
  }
}
```

#### Update User Profile
```http
PUT /users/profile
```
Request Body:
```json
{
  "profile": {
    "name": "string",
    "dietaryPreferences": ["string"],
    "allergies": ["string"],
    "cookingSkillLevel": "string",
    "preferredCuisines": ["string"]
  },
  "settings": {
    "voiceEnabled": "boolean",
    "notifications": "boolean",
    "theme": "string"
  }
}
```

### Recipe Management

#### Get Recipes by Ingredients
```http
POST /recipes/find-by-ingredients
```
Request Body:
```json
{
  "ingredients": ["string"],
  "filters": {
    "cuisine": "string",
    "diet": "string",
    "maxTime": "number",
    "difficulty": "string"
  }
}
```
Response:
```json
{
  "recipes": [{
    "id": "string",
    "title": "string",
    "description": "string",
    "ingredients": [{
      "name": "string",
      "amount": "number",
      "unit": "string"
    }],
    "metadata": {
      "difficulty": "string",
      "prepTime": "number",
      "cookTime": "number",
      "servings": "number"
    }
  }]
}
```

#### Get Recipe Details
```http
GET /recipes/{recipeId}
```
Response:
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "ingredients": [{
    "name": "string",
    "amount": "number",
    "unit": "string",
    "category": "string"
  }],
  "instructions": [{
    "step": "number",
    "description": "string",
    "tips": "string",
    "timeEstimate": "number"
  }],
  "metadata": {
    "difficulty": "string",
    "prepTime": "number",
    "cookTime": "number",
    "servings": "number",
    "cuisine": "string",
    "tags": ["string"]
  },
  "aiEnhancements": {
    "gordonRamsayCommentary": "string",
    "creativeTwists": ["string"],
    "tips": ["string"]
  }
}
```

#### Save Recipe
```http
POST /recipes/{recipeId}/save
```
Request Body:
```json
{
  "notes": "string",
  "customizations": {
    "ingredientSubstitutions": [{
      "original": "string",
      "substitute": "string"
    }],
    "modifications": ["string"]
  }
}
```

### AI Chef Features

#### Get Gordon Ramsay Commentary
```http
POST /recipes/ai/commentary
```
Request Body:
```json
{
  "recipeId": "string",
  "title": "string",
  "ingredients": ["string"],
  "instructions": ["string"]
}
```
Response:
```json
{
  "commentary": "string",
  "tips": ["string"]
}
```

#### Get Creative Twists
```http
POST /recipes/ai/twist
```
Request Body:
```json
{
  "recipeId": "string",
  "title": "string",
  "ingredients": ["string"],
  "instructions": ["string"]
}
```
Response:
```json
{
  "twist": "string"
}
```

### Voice Interaction

#### Get Voice Instructions
```http
POST /voice/instructions
```
Request Body:
```json
{
  "recipeId": "string",
  "step": "number",
  "voiceStyle": "string"
}
```
Response:
```json
{
  "audioUrl": "string",
  "text": "string"
}
```

## Integration Notes
- All frontend API calls should use the environment variable: `${process.env.NEXT_PUBLIC_API_URL}`
- CORS is enabled for allowed origins. If you get a CORS error, check your backend CORS config.
- Data shape between backend and frontend is consistent and type-safe.
- Error responses follow this structure:
```json
{
  "error": "string",
  "message": "string",
  "details": {}
}
```
- Rate limiting is enforced (100 requests/min for authenticated, 20/min for unauthenticated).
- Versioning: All endpoints are versioned (e.g., /v1/...). Breaking changes only in major versions.
- Test endpoints using Postman, curl, or your preferred API client.
- Gemini is used for AI commentary and creative twists. Spoonacular is used for recipe data.
- Supabase is the database, with RLS for user data security.
- Backward compatibility is maintained for authentication and API flows.

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "string",
  "message": "string",
  "details": {}
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## Rate Limiting
- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users
- Rate limit headers included in all responses:
  - X-RateLimit-Limit
  - X-RateLimit-Remaining
  - X-RateLimit-Reset

## WebSocket Endpoints

### Real-time Cooking Guidance
```
ws://api.plate-app.com/v1/cooking-guidance
```
Events:
- `start_session`: Start cooking session
- `step_complete`: Mark step as complete
- `get_tip`: Request cooking tip
- `voice_command`: Voice command processing

## API Versioning
- Version included in URL path
- Current version: v1
- Deprecation notices provided 6 months in advance
- Breaking changes only in major versions 
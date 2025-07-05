# API Documentation
# Plate - Your Personal AI Chef

## Base URL
```
https://api.plate-app.com/v1
```

## Authentication
All API requests require authentication using a **Supabase JWT** obtained via Google sign-in.
Include the token in the Authorization header:
```
Authorization: Bearer <supabase_jwt>
```
- **Only Google sign-in via Supabase is supported.**
- The backend verifies Supabase JWTs for all protected endpoints.
- Store JWT securely (Supabase manages session).
- All endpoints are CORS-enabled for allowed frontend origins.
- Supabase (PostgreSQL) is used as the database, with Row-Level Security (RLS) enabled for user data.

## API Endpoints

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
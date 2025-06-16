# Schema Design Document
# Plate - Your Personal AI Chef

## Database Overview
The application will use **Supabase (PostgreSQL)** as the primary database, with Redis for caching and session management. Prisma ORM will be used for type-safe database access.

## Table Schemas

### 1. Users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  cooking_skill_level TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  is_verified BOOLEAN DEFAULT FALSE
);

-- User preferences (dietary, allergies, cuisines) could be stored as JSONB or in separate lookup tables
-- For simplicity, let's keep them as JSONB for now or define them as separate tables if they are highly structured.
-- For dietary_preferences, allergies, preferred_cuisines, let's consider them as separate tables if they are predefined options.
-- For initial setup, we can keep them in a JSONB column or simple array types if supported by ORM and application logic.
-- Assuming simple array for direct storage, or separate tables for predefined options. Let's make them array of text for now.

ALTER TABLE users
ADD COLUMN dietary_preferences TEXT[],
ADD COLUMN allergies TEXT[],
ADD COLUMN preferred_cuisines TEXT[];

CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  voice_enabled BOOLEAN DEFAULT FALSE,
  notifications BOOLEAN DEFAULT TRUE,
  theme TEXT DEFAULT 'light',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Recipes
```sql
CREATE TYPE recipe_source_enum AS ENUM ('Spoonacular', 'Gemini', 'UserGenerated');
CREATE TYPE recipe_difficulty_enum AS ENUM ('Easy', 'Medium', 'Hard');

CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  servings INTEGER,
  cuisine TEXT,
  difficulty recipe_difficulty_enum,
  source recipe_source_enum NOT NULL,
  original_recipe_id TEXT, -- For Spoonacular recipes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE recipe_instructions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  tips TEXT,
  time_estimate_minutes INTEGER,
  UNIQUE (recipe_id, step_number) -- Ensure unique step numbers per recipe
);

CREATE TABLE recipe_ai_enhancements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID UNIQUE REFERENCES recipes(id) ON DELETE CASCADE,
  gordon_ramsay_commentary TEXT,
  creative_twists TEXT[],
  tips TEXT[]
);

CREATE TABLE recipe_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  UNIQUE (recipe_id, tag)
);
```

### 3. Ingredients
```sql
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  category TEXT,
  common_units TEXT[],
  substitutions TEXT[],
  shelf_life_days INTEGER,
  storage_tips TEXT,
  nutritional_info JSONB -- Store as JSONB for flexibility
);

CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(10, 2) NOT NULL,
  unit TEXT NOT NULL,
  UNIQUE (recipe_id, ingredient_id)
);
```

### 4. UserSavedRecipes
```sql
CREATE TABLE user_saved_recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'saved', -- e.g., 'saved', 'cooked'
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  last_cooked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, recipe_id) -- A user can save a recipe only once
);

CREATE TABLE user_recipe_customizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_saved_recipe_id UUID UNIQUE REFERENCES user_saved_recipes(id) ON DELETE CASCADE,
  ingredient_substitutions JSONB, -- Array of { original: String, substitute: String }
  modifications TEXT[]
);
```

### 5. CookingSessions
```sql
CREATE TYPE session_status_enum AS ENUM ('in-progress', 'completed', 'aborted');

CREATE TABLE cooking_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  status session_status_enum DEFAULT 'in-progress',
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  feedback JSONB, -- { rating, comments, difficulties }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cooking_session_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES cooking_sessions(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  time_spent_seconds INTEGER,
  UNIQUE (session_id, step_number)
);
```

### 6. UserIngredients (What the user has in their fridge/pantry)
```sql
CREATE TABLE user_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(10, 2) NOT NULL,
  unit TEXT NOT NULL,
  expiry_date DATE,
  location TEXT, -- e.g., 'fridge', 'pantry'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, ingredient_id, location) -- A user has a specific ingredient in a specific location
);
```

## Relationships (Revised)

### One-to-Many
- `users` → `user_settings`
- `users` → `user_saved_recipes`
- `users` → `cooking_sessions`
- `users` → `user_ingredients`
- `recipes` → `recipe_instructions`
- `recipes` → `recipe_tags`
- `recipes` → `recipe_ingredients`
- `recipes` → `user_saved_recipes`
- `recipes` → `cooking_sessions`
- `cooking_sessions` → `cooking_session_progress`
- `user_saved_recipes` → `user_recipe_customizations`
- `ingredients` → `recipe_ingredients`
- `ingredients` → `user_ingredients`

### One-to-One
- `recipes` → `recipe_ai_enhancements`

## Indexes (Revised)

### Users Table
- `CREATE INDEX idx_users_email ON users (email);`
- `CREATE INDEX idx_users_created_at ON users (created_at);`

### Recipes Table
- `CREATE INDEX idx_recipes_title ON recipes (title);`
- `CREATE INDEX idx_recipes_cuisine ON recipes (cuisine);`
- `CREATE INDEX idx_recipes_difficulty ON recipes (difficulty);`
- `CREATE INDEX idx_recipes_created_at ON recipes (created_at);`

### UserSavedRecipes Table
- `CREATE INDEX idx_user_saved_recipes_user_id ON user_saved_recipes (user_id);`
- `CREATE INDEX idx_user_saved_recipes_recipe_id ON user_saved_recipes (recipe_id);`
- `CREATE INDEX idx_user_saved_recipes_status ON user_saved_recipes (status);`
- `CREATE INDEX idx_user_saved_recipes_last_cooked_at ON user_saved_recipes (last_cooked_at);`

### CookingSessions Table
- `CREATE INDEX idx_cooking_sessions_user_id ON cooking_sessions (user_id);`
- `CREATE INDEX idx_cooking_sessions_recipe_id ON cooking_sessions (recipe_id);`
- `CREATE INDEX idx_cooking_sessions_status ON cooking_sessions (status);`
- `CREATE INDEX idx_cooking_sessions_start_time ON cooking_sessions (start_time);`

### Ingredients Table
- `CREATE INDEX idx_ingredients_name ON ingredients (name);`
- `CREATE INDEX idx_ingredients_category ON ingredients (category);`

### UserIngredients Table
- `CREATE INDEX idx_user_ingredients_user_id ON user_ingredients (user_id);`
- `CREATE INDEX idx_user_ingredients_ingredient_id ON user_ingredients (ingredient_id);`
- `CREATE INDEX idx_user_ingredients_expiry_date ON user_ingredients (expiry_date);`

## Data Validation Rules (Revised)

### Users
- `email` must be unique and valid (enforced by `UNIQUE` constraint).
- `password_hash` must be present.
- `created_at`, `updated_at` are automatically managed timestamps.

### Recipes
- `title` must be present.
- `source` must be one of the defined `recipe_source_enum` values.
- `difficulty` must be one of the defined `recipe_difficulty_enum` values.
- `prep_time_minutes`, `cook_time_minutes`, `servings` should be positive integers.

### Recipe Instructions
- `step_number` must be unique for a given `recipe_id`.
- `description` must be present.

### Ingredients
- `name` must be unique and present.
- `nutritional_info` (JSONB) can be validated at the application level.

### User Saved Recipes
- `user_id` and `recipe_id` must reference existing entries.
- `rating` must be between 1 and 5 (enforced by `CHECK` constraint).
- A user can only save a specific recipe once (`UNIQUE (user_id, recipe_id)`).

### Cooking Sessions
- `user_id` and `recipe_id` must reference existing entries.
- `status` must be one of the defined `session_status_enum` values.
- `start_time` is automatically managed.

### User Ingredients
- `user_id` and `ingredient_id` must reference existing entries.
- `quantity` must be positive.
- `unit` must be present.
- A user can only have a specific ingredient in a specific location once (`UNIQUE (user_id, ingredient_id, location)`).

## Caching Strategy

### Redis Caches
1. User Sessions
   - Key: `session:{userId}`
   - TTL: 24 hours

2. Recipe Cache
   - Key: `recipe:{recipeId}`
   - TTL: 1 hour

3. User Preferences
   - Key: `prefs:{userId}`
   - TTL: 12 hours

4. Popular Recipes
   - Key: `popular:recipes`
   - TTL: 6 hours

## Data Migration Strategy
1. Version control for schema changes (e.g., using Prisma Migrate).
2. Migration scripts for updates.
3. Backup strategy.
4. Rollback procedures.

## Security Considerations
1. Password hashing (using `bcrypt` or similar on the backend).
2. Data encryption (at rest and in transit, handled by Supabase).
3. Row-Level Security (RLS) in PostgreSQL via Supabase.
4. Access control (handled by Supabase policies and backend authorization).
5. Audit logging.
6. Data sanitization. 
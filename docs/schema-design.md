# Schema Design Document
# Plate - Your Personal AI Chef

## Database Overview
The application uses **Supabase (PostgreSQL)** as the primary database. **User authentication is managed by Supabase Auth (Google provider only).**

## Table Schemas

### 1. Users
- **User authentication and identity are managed by Supabase (`auth.users` table).**
- All user-related tables reference the Supabase user ID (`auth.users.id`).

CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  voice_enabled BOOLEAN DEFAULT FALSE,
  notifications BOOLEAN DEFAULT TRUE,
  theme TEXT DEFAULT 'light',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
- `auth.users` → `user_settings`
- `auth.users` → `user_saved_recipes`
- `auth.users` → `cooking_sessions`
- `auth.users` → `user_ingredients`
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
- **User authentication and identity are managed by Supabase (`auth.users` table).**

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
- `status`
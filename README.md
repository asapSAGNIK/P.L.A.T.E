# P.L.A.T.E 🍳

**Personalized Learning And Assistance For Taste Enhancement**


An intelligent AI-powered recipe generation platform that transforms your available ingredients into delicious, personalized recipes. Whether you're cooking with what's in your fridge or exploring new culinary adventures, P.L.A.T.E is your personal AI chef assistant.

 Live Application: [https://plate-liard.vercel.app/find-recipes](https://plate-liard.vercel.app/find-recipes)

---

##  Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [User Flow](#-user-flow)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [Key Components](#-key-components)
- [API Architecture](#-api-architecture)
- [Database Schema](#-database-schema)
- [AI Integration](#-ai-integration)
- [Contributing](#-contributing)
- [License](#-license)

---

##  Features

###  Core Features

- **Dual Recipe Generation Modes**
  - **Fridge Mode**: Generate recipes from your available ingredients
  - **Explore Mode**: Discover recipes based on mood, cravings, and preferences

- **AI-Powered Intelligence**
  - Smart ingredient compatibility analysis using Google Gemini AI
  - Intelligent recipe suggestions based on what you have
  - Automatic ingredient categorization and pairing recommendations

- **Recipe Management**
  - Save favorite recipes to your personal collection
  - Track your cooking history with timestamps
  - View detailed recipe instructions with ingredient lists

- **Smart Features**
  - Real-time ingredient compatibility checking
  - Fallback recipes for incompatible ingredient combinations
  - Smart ingredient suggestions to improve recipe quality
  - Rate limiting to ensure fair usage

- **User Experience**
  - Guest mode to try the platform without registration
  - Google OAuth authentication for seamless sign-in
  - Beautiful, responsive UI with smooth animations
  - Mobile-first design approach

###  Authentication & Security

- Supabase Authentication with Google OAuth
- Row Level Security (RLS) for database protection
- JWT token validation
- Secure session management
- Rate limiting (20 recipe generations per day)

---

##  Tech Stack

### Frontend
- **Framework**: Next.js 15.2.4 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4.17
- **UI Components**: Radix UI with custom design system
- **State Management**: React Context API
- **Icons**: Lucide React, Phosphor React
- **Animations**: Tailwind CSS Animate, Lottie

### Backend & Database
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Runtime**: Deno (for Edge Functions)
- **Database**: PostgreSQL with RLS
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime subscriptions

### AI & External Services
- **AI Provider**: Google Gemini 1.5 Flash
- **Recipe API**: Spoonacular API (for ingredient suggestions)
- **Caching**: Multi-layer in-memory caching system
- **Performance**: Custom performance monitoring

### Development & Deployment
- **Package Manager**: pnpm
- **Version Control**: Git
- **Deployment**: 
  - Frontend: Vercel
  - Backend: Supabase Edge Functions
- **Linting**: ESLint with Next.js config

---

##  Project Architecture

```
┌─────────────────────────────────────────────────────┐
│                   User Interface                     │
│              (Next.js 15 + React)                    │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│            Authentication Layer                      │
│         (Supabase Auth + Google OAuth)              │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│              API Gateway Layer                       │
│        (Supabase Edge Functions - Deno)             │
├──────────────────────────────────────────────────────┤
│  • generate-recipes    • ingredient-compatibility    │
│  • save-recipe         • smart-suggestions           │
│  • get-saved-recipes   • fallback-recipes           │
│  • remove-recipe       • rate-limit-check           │
└─────────────────┬───────────────────────────────────┘
                  │
      ┌───────────┼───────────┐
      │           │           │
┌─────▼─────┐ ┌──▼───────┐ ┌▼─────────────┐
│ PostgreSQL │ │ Gemini AI│ │ Spoonacular  │
│  Database  │ │   API    │ │     API      │
└────────────┘ └──────────┘ └──────────────┘
```

---

##  User Flow

### 1. Landing Page Experience

```
User arrives → Landing Page → Choose:
                               ├─ "Visit Kitchen" (Guest Mode)
                               └─ "Continue with Google" (Sign In)
```

### 2. Guest Mode Flow

```
Guest Mode → Find Recipes Page → Add Ingredients → Sign In Required
                                                   ↓
                                             Google OAuth
                                                   ↓
                                         Generate Recipes
```

### 3. Authenticated User Flow

```
Sign In → Find Recipes Page
           ├─ Fridge Mode
           │   ├─ Add ingredients (min 3)
           │   ├─ AI Compatibility Analysis
           │   ├─ Generate 2 recipes
           │   └─ Save/View recipes
           │
           └─ Explore Mode
               ├─ Select mood/craving
               ├─ Choose preferences
               ├─ Generate recipes
               └─ Save/View recipes
```

### 4. Recipe Generation Process

```
User Input → Validation → Compatibility Check → Recipe Generation
                             ↓                        ↓
                    [Incompatible?]          [Gemini AI Process]
                         ↓                           ↓
                  Fallback Recipes              2 Diverse Recipes
                         ↓                           ↓
                    Display Results ←─────────┘
                         ↓
                  Save to Collection
```

### 5. Key User Interactions

- **Landing Page**: Welcome animation with slot machine logo
- **Mode Selection**: Toggle between Fridge and Explore modes
- **Ingredient Input**: Smart autocomplete with suggestions
- **Recipe Generation**: Loading states with progress indicators
- **Recipe Display**: Detailed cards with save functionality
- **Navigation**: Sidebar for easy access to all features

---

##  Getting Started

### Prerequisites

- Node.js 18+ or compatible runtime
- pnpm (recommended) or npm
- Supabase account
- Google Cloud Platform account (for Gemini AI API)
- Google OAuth credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/plate.git
   cd plate
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Spoonacular API (optional)
   NEXT_PUBLIC_SPOONACULAR_API_KEY=your_spoonacular_api_key
   ```

4. **Set up Supabase Edge Functions**
   
   Navigate to the Supabase directory and configure:
   ```bash
   cd supabase
   ```
   
   Update `supabase/config.toml` with your project details.
   
   Set up Edge Function environment variables in Supabase Dashboard:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

5. **Run database migrations**
   ```bash
   supabase db push
   ```

6. **Start the development server**
   ```bash
   pnpm dev
   ```

7. **Open your browser**
   ```
   http://localhost:3000
   ```

### Deploying to Production

**Frontend (Vercel)**
```bash
vercel --prod
```

**Backend (Supabase)**
```bash
cd supabase
supabase functions deploy generate-recipes
supabase functions deploy ingredient-compatibility
supabase functions deploy smart-suggestions
# ... deploy other functions
```

---

##  Environment Variables

### Frontend (.env.local)

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `NEXT_PUBLIC_SPOONACULAR_API_KEY` | Spoonacular API key (for ingredient suggestions) | Optional |

### Backend (Supabase Edge Functions)

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini AI API key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `SUPABASE_URL` | Supabase project URL | Yes |

---

##  Project Structure

```
P.L.A.T.E/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Landing page
│   ├── layout.tsx                # Root layout with providers
│   ├── globals.css               # Global styles
│   ├── find-recipes/             # Main recipe generation page
│   │   ├── page.tsx             # Recipe finder UI
│   │   ├── layout.tsx           # Page layout
│   │   └── loading.tsx          # Loading state
│   ├── saved/                    # Saved recipes page
│   ├── history/                  # Cooking history page
│   ├── profile/                  # User profile page
│   └── settings/                 # Settings page
│
├── components/                   # React components
│   ├── ui/                       # Reusable UI components
│   │   ├── button.tsx           # Button component
│   │   ├── card.tsx             # Card component
│   │   ├── input.tsx            # Input component
│   │   └── ...                  # Other UI components
│   ├── auth-provider.tsx         # Authentication context
│   ├── guest-mode-provider.tsx   # Guest mode management
│   ├── app-sidebar.tsx           # Navigation sidebar
│   ├── recipe-card.tsx           # Recipe display component
│   ├── ingredients-input.tsx     # Smart ingredient input
│   ├── meal-type-selector.tsx    # Meal type selection
│   ├── mood-selector.tsx         # Mood/craving selection
│   └── ...                       # Other components
│
├── lib/                          # Utility libraries
│   ├── supabase/                 # Supabase configuration
│   │   ├── client.ts            # Client-side Supabase client
│   │   ├── server.ts            # Server-side Supabase client
│   │   └── api.ts               # API wrapper functions
│   ├── ingredient-compatibility.ts # AI compatibility analysis
│   ├── smart-suggestions.ts      # AI-powered suggestions
│   ├── fallback-recipes.ts       # Fallback recipe system
│   ├── advanced-cache.ts         # Multi-layer caching
│   ├── ab-testing.ts             # A/B testing framework
│   └── utils.ts                  # General utilities
│
├── supabase/                     # Backend configuration
│   ├── functions/                # Edge Functions (Deno)
│   │   ├── generate-recipes/    # AI recipe generation
│   │   │   └── index.ts
│   │   ├── ingredient-compatibility/ # Compatibility analysis
│   │   │   └── index.ts
│   │   ├── smart-suggestions/   # Smart suggestions
│   │   │   └── index.ts
│   │   ├── fallback-recipes/    # Fallback recipes
│   │   │   └── index.ts
│   │   ├── save-recipe/         # Save recipe function
│   │   ├── get-saved-recipes/   # Retrieve saved recipes
│   │   ├── remove-recipe/       # Delete recipe function
│   │   └── check-rate-limit/    # Rate limiting check
│   ├── migrations/               # Database migrations
│   │   ├── 20250108000000_create_recipe_tables.sql
│   │   └── 20250108000001_fix_database_schema.sql
│   └── config.toml               # Supabase configuration
│
├── public/                       # Static assets
├── styles/                       # Additional styles
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.ts            # Tailwind CSS configuration
└── next.config.mjs               # Next.js configuration
```

---

##  Key Components

### 1. Authentication System

**AuthProvider** (`components/auth-provider.tsx`)
- Manages user authentication state
- Provides sign-in/sign-out functionality
- Handles Google OAuth integration
- Maintains session persistence

```typescript
interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
}
```

**GuestModeProvider** (`components/guest-mode-provider.tsx`)
- Enables guest users to explore features
- Persists form data in sessionStorage
- Seamless upgrade to authenticated mode
- Preserves user input during sign-in

### 2. Recipe Generation

**Find Recipes Page** (`app/find-recipes/page.tsx`)
- Dual mode interface (Fridge/Explore)
- Smart ingredient input with validation
- Real-time compatibility analysis
- Recipe display with save functionality

**Key Features**:
- Minimum 3 ingredients for Fridge Mode
- Mood-based recipe generation for Explore Mode
- Live ingredient compatibility feedback
- Smart ingredient suggestions
- Fallback recipes for incompatible combinations

### 3. Ingredient Analysis

**Ingredient Compatibility** (`lib/ingredient-compatibility.ts`)
- AI-powered ingredient classification
- Compatibility scoring system
- Smart grouping algorithms
- Fallback analysis for service failures

**Compatibility Levels**:
- **Excellent** (90+): Perfect ingredient combinations
- **Good** (75-89): Compatible with great potential
- **Limited** (60-74): Some compatibility issues
- **Incompatible** (<60): Poor ingredient pairing
- **Insufficient** (<3): Not enough ingredients

### 4. UI Components

**Sidebar Navigation** (`components/app-sidebar.tsx`)
- Persistent navigation menu
- User profile display
- Quick access to all features
- Sign in/out functionality

**Recipe Card** (`components/recipe-card.tsx`)
- Beautiful recipe display
- Ingredient lists with amounts
- Cooking instructions
- Save/unsave functionality
- Difficulty and time indicators

---

##  API Architecture

### Supabase Edge Functions

All backend logic runs on Supabase Edge Functions (Deno runtime) for serverless scalability.

#### 1. Generate Recipes
**Endpoint**: `generate-recipes`
**Purpose**: Generate AI-powered recipes using Gemini AI

**Request**:
```typescript
{
  ingredients?: string[]
  query?: string
  mode: 'fridge' | 'explore'
  filters?: {
    maxTime?: number
    servings?: number
    cuisine?: string
    diet?: string
    mealType?: string
  }
}
```

**Response**:
```typescript
{
  recipes: AIRecipe[]
  rateLimit: {
    currentCount: number
    maxRequests: number
    remaining: number
  }
}
```

**Features**:
- Smart ingredient grouping (3-4+ ingredients)
- Dual difficulty recipes (Easy + Medium/Hard)
- Tiered ingredient constraint system
- Automatic recipe diversity enforcement
- Caching for improved performance

#### 2. Ingredient Compatibility
**Endpoint**: `ingredient-compatibility`
**Purpose**: Analyze ingredient combinations

**Request**:
```typescript
{
  ingredients: string[]
}
```

**Response**:
```typescript
{
  analysis: {
    level: CompatibilityLevel
    score: number
    message: string
    suggestions: string[]
    categories: {
      proteins: string[]
      vegetables: string[]
      fruits: string[]
      grains: string[]
      dairy: string[]
      spices: string[]
    }
  }
}
```

#### 3. Smart Suggestions
**Endpoint**: `smart-suggestions`
**Purpose**: Generate ingredient improvement suggestions

**Request**:
```typescript
{
  ingredients: string[]
  compatibilityLevel?: string
}
```

**Response**:
```typescript
{
  suggestions: SmartSuggestion[]
  message: string
}
```

#### 4. Fallback Recipes
**Endpoint**: `fallback-recipes`
**Purpose**: Generate alternative recipes for incompatible ingredients

**Request**:
```typescript
{
  userIngredients: string[]
  compatibilityReason: string
}
```

**Response**:
```typescript
{
  recipes: FallbackRecipe[]
  message: string
}
```

#### 5. Save/Manage Recipes
- `save-recipe`: Save recipe to user collection
- `get-saved-recipes`: Retrieve user's saved recipes
- `remove-recipe`: Delete recipe from collection
- `get-recipe-history`: Get recipe generation history

---

##  Database Schema

### Core Tables

#### `users` (Managed by Supabase Auth)
- `id`: UUID (Primary Key)
- `email`: TEXT
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

#### `recipes`
```sql
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  servings INTEGER,
  cuisine TEXT,
  difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  source TEXT CHECK (source IN ('Spoonacular', 'Gemini', 'UserGenerated')),
  original_recipe_id TEXT,
  image_url TEXT,
  instructions TEXT,
  ingredients JSONB,
  rating DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `user_saved_recipes`
```sql
CREATE TABLE user_saved_recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'saved',
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  last_cooked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, recipe_id)
);
```

#### `recipe_generation_history`
```sql
CREATE TABLE recipe_generation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_data JSONB NOT NULL,
  mode TEXT CHECK (mode IN ('fridge', 'explore')),
  ingredients_used TEXT[],
  query_used TEXT,
  filters JSONB,
  generated_at TIMESTAMP DEFAULT NOW()
);
```

#### `user_rate_limits`
```sql
CREATE TABLE user_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  recipe_generations INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);
```

### Row Level Security (RLS)

All tables have RLS policies to ensure users can only access their own data:

```sql
-- Users can only read their own saved recipes
CREATE POLICY "Users can view own saved recipes"
ON user_saved_recipes FOR SELECT
USING (auth.uid() = user_id);

-- Users can only insert their own saved recipes
CREATE POLICY "Users can create own saved recipes"
ON user_saved_recipes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Similar policies for other tables...
```

---

##  AI Integration

### Google Gemini 1.5 Flash

**Configuration**:
```typescript
{
  model: 'gemini-1.5-flash',
  temperature: 0.8,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 2048
}
```

### Prompt Engineering Strategy

#### 1. Structured Recipe Format
```
Title: [Recipe Name]
Description: [Brief description]
Cooking Time: [X] minutes
Difficulty: [Easy/Medium/Hard]
Servings: [X]
Ingredients:
- [ingredient with amount]
Instructions:
1. [First step]
2. [Second step]
```

#### 2. Difficulty-Based Generation

**Easy Recipe (Recipe 1)**:
- Only basic, common ingredients
- Max 4-5 simple steps
- Basic cooking methods
- Beginner-friendly
- Detailed cooking instructions

**Medium/Hard Recipe (Recipe 2)**:
- Creative and adventurous ingredients
- 5-10 detailed steps
- Advanced techniques
- Restaurant-quality focus
- Complex flavor profiles

#### 3. Mode-Specific Instructions

**Fridge Mode**:
- Strict ingredient constraints
- Practical combinations
- Use ONLY provided ingredients + basic seasonings
- Detailed raw ingredient cooking instructions

**Explore Mode**:
- Full pantry access
- Creative freedom
- Sophisticated techniques
- Culinary exploration focus

#### 4. Smart Ingredient Grouping

```typescript
// For 4+ ingredients
if (ingredients.length >= 4) {
  const midPoint = Math.ceil(ingredients.length / 2)
  groups = [
    ingredients.slice(0, midPoint),    // Recipe 1
    ingredients.slice(midPoint)         // Recipe 2
  ]
}

// For 3 ingredients
else if (ingredients.length === 3) {
  groups = [
    ingredients.slice(0, 2),           // Recipe 1: First 2
    ingredients                         // Recipe 2: All 3
  ]
}
```

### Caching Strategy

**Multi-Layer Cache System**:
- **Ingredient Cache**: 30-minute TTL
- **Compatibility Cache**: 20-minute TTL
- **Recipe Cache**: 15-minute TTL
- **Suggestion Cache**: 20-minute TTL

**Benefits**:
- Reduced AI API calls
- Faster response times
- Lower costs
- Better user experience

---

##  Design System

### Color Palette

```css
/* Primary Brand Colors */
--orange-600: #ea580c;    /* Primary actions, CTA buttons */
--orange-700: #c2410c;    /* Hover states */
--orange-100: #fed7aa;    /* Light backgrounds */

/* Semantic Colors */
--green-600: #16a34a;     /* Success states */
--red-600: #dc2626;       /* Error states, delete actions */
--blue-600: #2563eb;      /* Info states, links */
--purple-600: #9333ea;    /* Explore mode accent */

/* Neutral Colors */
--gray-50: #f9fafb;       /* Light backgrounds */
--gray-900: #111827;      /* Primary text */
--gray-600: #4b5563;      /* Secondary text */
```

### Typography

- **Primary Font**: Inter (system font stack)
- **Display Font**: Yatra One (brand personality)
- **Font Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### Component Patterns

- **Cards**: Rounded corners, subtle shadows, hover effects
- **Buttons**: Gradient backgrounds, smooth transitions
- **Inputs**: Clear focus states, validation feedback
- **Modals**: Backdrop blur, centered layout
- **Toasts**: Bottom-right position, auto-dismiss

---

##  Testing

### Running Tests

```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Testing Strategy

1. **Unit Tests**: Component and utility function testing
2. **Integration Tests**: API endpoint testing
3. **E2E Tests**: Critical user flow testing
4. **Performance Tests**: Load and stress testing

---

##  Performance Optimization

### Frontend Optimizations

- **Code Splitting**: Route-based dynamic imports
- **Image Optimization**: Next.js Image component with lazy loading
- **Bundle Analysis**: Regular monitoring with `@next/bundle-analyzer`
- **Tree Shaking**: Automatic unused code elimination

### Backend Optimizations

- **Edge Functions**: Serverless functions for low latency
- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: Efficient database connections
- **Rate Limiting**: 20 recipe generations per day per user

### Caching Strategy

- Multi-layer in-memory caching
- LRU (Least Recently Used) eviction policy
- Tag-based cache invalidation
- Performance metrics tracking

---

##  Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Follow the existing code style

---

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

##  Acknowledgments

- **Google Gemini AI** for powerful recipe generation capabilities
- **Supabase** for backend infrastructure and authentication
- **Vercel** for seamless frontend deployment
- **Radix UI** for accessible component primitives
- **Tailwind CSS** for beautiful styling utilities

---

##  Contact & Support

- **Developer**: Sagnik
- **Live Demo**: [https://plate-liard.vercel.app/find-recipes](https://plate-liard.vercel.app/find-recipes)
- **Issues**: Please report bugs through GitHub Issues

---

##  Roadmap

### Short-term (1-3 months)
- [ ] Recipe rating system
- [ ] Advanced filtering options
- [ ] Nutritional information
- [ ] Built-in cooking timer
- [ ] Recipe scaling for serving sizes

### Medium-term (3-6 months)
- [ ] Social features (recipe sharing)
- [ ] Meal planning and shopping lists
- [ ] Advanced dietary preferences
- [ ] Recipe collections
- [ ] PWA capabilities for offline access

### Long-term (6+ months)
- [ ] AI Chef chatbot assistant
- [ ] Image recognition for ingredient upload
- [ ] Voice commands
- [ ] Smart kitchen device integration
- [ ] Multi-language support

---

<div align="center">

**Made with ❤️ for food lovers everywhere**

[Website](https://plate-liard.vercel.app/find-recipes) • [Documentation](#) • [Report Bug](#) • [Request Feature](#)

</div>


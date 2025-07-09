### Project Roadmap: Plate - Your Personal AI Chef

This roadmap is designed to be iterative, allowing us to build a solid foundation before adding more complex features. Each phase has specific goals and deliverables.

---

### **Phase 1: Foundation (Sprint 1-2)** ✅

**Goal:** Establish the core infrastructure, user authentication, and basic recipe display to get a functional prototype.

**Key Tasks:**

1.  **Project Setup & Version Control:** ✅
    *   Initialize Git repository (`plate/`) with the documented folder structure. ✅
    *   Set up initial `frontend/` (Next.js) and `backend/` (Node.js/Express) directories. ✅
    *   Configure `tsconfig.json`, `package.json`, `tailwind.config.ts`, `postcss.config.js`. ✅

2.  **Database Setup (Supabase/PostgreSQL):** ✅
    *   Create a Supabase project. ✅
    *   Implement the `user_settings`, `ingredients`, and `recipes` tables based on `schema-design.md`. ✅
    *   Set up initial Row-Level Security (RLS) policies in Supabase for user data. ✅

3.  **Backend Core (Node.js/Express):** ✅
    *   Set up Express server with basic routing. ✅
    *   **Integrate Supabase Auth (Google provider only) for authentication.** ✅
    *   Connect to Supabase using a suitable ORM (e.g., Prisma, if decided) or direct client. ✅
    *   **Resolve all linter/type errors and ensure robust environment variable management and error handling.** ✅

4.  **Frontend Core (Next.js):** ✅
    *   Develop the Landing Page (`/` route) with **Sign in with Google (Supabase Auth) UI**. ✅
    *   Implement authentication flow using Supabase client SDK. ✅
    *   Set up Redux Toolkit for user authentication state management (using Supabase session). ⏳ (Basic state handled, full Redux integration can be added later)
    *   Create a basic Dashboard page (`/dashboard`) that authenticated users can access. ✅

5.  **Initial External API Integration (Spoonacular):** ✅
    *   Create a Next.js API route (`/api/spoonacular/search`) as a Backend-for-Frontend (BFF) proxy to call the Spoonacular API (to hide API key). ✅ (Implemented as backend route)
    *   Implement `POST /recipes/find-by-ingredients` API route in the backend to utilize the Spoonacular proxy. ✅

6.  **Basic Recipe Display:** ✅
    *   Develop a page (e.g., `/recipes/browse`) to display recipes fetched from Spoonacular. ✅ (Displayed in dashboard)
    *   Create `RecipeCard` components to show basic recipe information. ✅ (Basic card in dashboard)

**Expected Outcome (End of Phase 1):** ✅ A functional web application where users can sign in with Google (Supabase Auth) and browse/search for basic recipes using Spoonacular data.

---

### **Phase 2: Core Features (Sprint 3-6)**

**Goal:** Implement the main "Cook within/out of the fridge" logic, integrate AI personalities, and establish recipe management.

**Key Tasks:**

1.  **"Cook within the Fridge" Logic:** ✅ (Ingredient management UI and backend implemented)
    *   Develop UI for ingredient input (manual entry, suggestions). ✅
    *   Implement `user_ingredients` table and associated backend API to manage user's available ingredients. ✅
    *   Refine `POST /recipes/find-by-ingredients` API to intelligently match user's ingredients with Spoonacular recipes. ✅

2.  **Advanced AI Integration (Gemini for Commentary & Twists):** ✅ (Backend endpoints complete)
    *   **Implement backend endpoints for Gemini AI commentary and creative twists (`POST /recipes/ai/commentary`, `POST /recipes/ai/twist`).** ✅
    *   Integrate Gemini to generate Gordon Ramsay-style commentary and creative recipe twists. ✅
    *   Update `recipes` and `recipe_ai_enhancements` tables in Supabase to store AI-generated content. ✅
    *   Display AI commentary and twists on recipe detail pages. ✅
    *   All frontend API calls use backend endpoints via NEXT_PUBLIC_API_URL. ✅
    *   JWT authentication and Google OAuth integration. ✅
    *   Type safety and linter error resolution. ✅
    *   CORS and data shape compatibility. ✅
    *   Error handling and testing. ✅
    *   Systematic update of all API calls and flows. ✅

3.  **Recipe Management ("Chef's History"):**
    *   Implement `user_saved_recipes` and `user_recipe_customizations` tables in Supabase. ⏳
    *   Develop backend APIs for saving, retrieving, and managing user's recipes (`POST /recipes/{recipeId}/save`, `GET /users/profile` to include saved recipes). ⏳
    *   Create the "Chef's History" page (`/history`) in the frontend, allowing users to view and manage their saved recipes. ⏳

4.  **Cooking Mode:**
    *   Implement `cooking_sessions` and `cooking_session_progress` tables in Supabase. ⏳
    *   Develop backend APIs for starting, updating, and completing cooking sessions (`POST /cooking-sessions`, `PUT /cooking-sessions/{sessionId}/progress`, `PUT /cooking-sessions/{sessionId}/complete`). ⏳
    *   Implement the real-time WebSocket (`ws://api.plate-app.com/v1/cooking-guidance`) for step-by-step guidance, timers, and real-time AI tips during cooking. ⏳
    *   Develop the interactive Cooking Mode UI in the frontend, displaying steps, managing timers, and integrating voice guidance. ⏳

5.  **User Preferences & Settings:**
    *   Implement backend API to update user settings (`PUT /users/profile`). ⏳
    *   Develop frontend UI for user profile and settings, including voice settings, dietary preferences, and theme. ⏳

**Expected Outcome (End of Phase 2):** ⏳ A fully functional core application where users can find recipes based on ingredients, get AI-powered commentary, use voice guidance during cooking, and manage their recipe history.

---

### **Phase 3: Enhancement & Optimization (Sprint 7-9+)**

**Goal:** Refine the user experience, enhance AI capabilities, improve performance, add social features, and prepare for deployment.

**Key Tasks:**

1.  **Advanced AI Capabilities:**
    *   Explore more sophisticated ingredient matching algorithms. ⏳
    *   Implement a personalized recipe recommendation engine (based on user history, ratings). ⏳
    *   Improve Gemini prompting for even more dynamic and engaging Ramsay-style interactions. ⏳

2.  **Social Features:**
    *   Allow users to share saved recipes. ⏳
    *   Implement user rating and review system for recipes. ⏳

3.  **Mobile Optimization / PWA:**
    *   Ensure the frontend is fully responsive across various devices. ⏳
    *   Implement Progressive Web App (PWA) features for improved user experience (offline capabilities, add to home screen). ⏳

4.  **Performance & Security Enhancements:**
    *   Optimize database queries and indexes (refer to `schema-design.md`). ⏳
    *   Implement Redis caching for frequently accessed data (e.g., popular recipes, user sessions). ⏳
    *   Strengthen backend security, including input validation and API rate limiting. ⏳
    *   Conduct security audits (e.g., OWASP ZAP as per `tech-stack.md`). ⏳

5.  **Comprehensive Testing & Deployment:**
    *   Implement unit, integration, and E2E tests (Jest, React Testing Library, Cypress). ⏳
    *   Set up a CI/CD pipeline (GitHub Actions) for automated testing and deployment to AWS/GCP. ⏳
    *   Configure monitoring and logging tools (Prometheus, Grafana). ⏳

6.  **User Feedback & Iteration:**
    *   Gather user feedback and continuously iterate on features and UI/UX. ⏳

**Expected Outcome (End of Phase 3):** ⏳ A robust, high-performance, and engaging cooking platform with advanced features, ready for public launch. 
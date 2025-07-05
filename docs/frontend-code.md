# Frontend Code Overview
# Plate - Your Personal AI Chef

## 1. Frontend Architecture

### Framework
- **Next.js 14 (React.js)**
  - Chosen for its hybrid rendering capabilities (SSR, SSG, ISR, CSR), built-in routing, API routes, and optimized performance features.
  - Leverages React for component-based UI development, ensuring reusability and maintainability.

### Folder Structure
```
frontend/
├── public/             # Static assets
├── src/
│   ├── app/            # Next.js App Router (pages/layouts/api)
│   │   ├── (auth)/     # Authentication routes (login, register)
│   │   ├── (main)/     # Main application routes (dashboard, fridge, recipes)
│   │   ├── api/        # Next.js API routes (for backend-for-frontend)
│   │   └── layout.tsx  # Root layout
│   ├── components/     # Reusable UI components
│   │   ├── common/     # General components (buttons, inputs, modals)
│   │   ├── specific/   # Feature-specific components (e.g., RecipeCard, IngredientInput)
│   │   └── ui/         # Tailwind-styled components (e.g., Accordion, Tabs)
│   ├── hooks/          # Custom React hooks for reusable logic
│   ├── lib/            # Utility functions and configurations
│   │   ├── api.ts      # API client setup (Axios)
│   │   ├── auth.ts     # Authentication helpers
│   │   ├── constants.ts
│   │   └── utils.ts
│   ├── store/          # Redux Toolkit store and slices
│   │   ├── index.ts
│   │   ├── authSlice.ts
│   │   └── recipeSlice.ts
│   ├── styles/         # Global styles and Tailwind configuration
│   │   ├── globals.css
│   │   └── tailwind.config.ts
│   ├── types/          # TypeScript type definitions
│   ├── middleware.ts   # Next.js middleware
│   └── next-env.d.ts
├── .env.local
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## 2. API Integration Best Practices
- **All API calls use the backend endpoints via the environment variable:**
  - `${process.env.NEXT_PUBLIC_API_URL}`
  - Do NOT use local Next.js API routes for backend data.
- **JWT Handling:**
  - Store JWT securely (prefer httpOnly cookie or secure storage).
  - Attach JWT in the Authorization header for all requests.
- **Google OAuth:**
  - Supported via backend; after login, use the issued JWT for all API calls.
- **Gemini Integration:**
  - AI commentary and creative twists are fetched from backend endpoints `/recipes/ai/commentary` and `/recipes/ai/twist`.
- **Supabase & RLS:**
  - All user data is stored in Supabase with Row-Level Security enabled for privacy.
- **Type Safety:**
  - All API responses are type-checked; keep frontend and backend types in sync.
- **CORS:**
  - All requests are CORS-enabled; ensure allowed origins are set in backend.
- **Error Handling:**
  - Handle errors gracefully; display user-friendly messages.
  - All error responses follow a consistent structure.
- **Environment Variables:**
  - Use `.env.local` for local development, `.env.production` for production.
  - Update `NEXT_PUBLIC_API_URL` as needed for different environments.

## 3. Component Design and Structure

### Atomic Design Principles
- **Atoms**: Basic HTML elements (buttons, inputs, labels, icons)
- **Molecules**: Groups of atoms (search bar, form fields)
- **Organisms**: Complex components made of molecules and atoms (header, recipe card, ingredient list)
- **Templates**: Page layouts with organized organisms
- **Pages**: Instances of templates with actual content

### Reusability
- Components are designed to be highly reusable across different parts of the application.
- Props are used to customize component behavior and appearance.

### Accessibility (A11y)
- Adhere to WCAG guidelines.
- Use semantic HTML, ARIA attributes, and focus management.
- Ensure keyboard navigation and screen reader compatibility.

## 4. State Management

### Global State: Redux Toolkit
- Manages complex application-wide state (user authentication, global settings, recipe data).
- Provides a centralized store, simplified state logic with slices, and asynchronous action handling.

### Local Component State: React `useState` and `useReducer`
- For simple UI states within individual components (e.g., form input values, toggle states).

### Data Fetching and Caching: React Query (or similar)
- Handles server-side data fetching, caching, synchronization, and error handling.
- Reduces boilerplate for API calls and improves user experience with optimistic updates and instant UI feedback.

## 5. Styling

### Tailwind CSS
- Utility-first CSS framework for rapid UI development.
- Enables consistent design through predefined scales and direct application of utility classes.
- Customization via `tailwind.config.ts` for theme, colors, and responsive breakpoints.

### CSS Modules / Global CSS
- Limited use for specific global styles or complex animations not easily achievable with Tailwind utilities.

## 6. Routing

### Next.js App Router
- Leverages file-system based routing for intuitive page creation.
- Supports nested routes, layouts, and loading states.
- Enables data fetching directly within components (server components).

## 7. Performance Optimization

### Image Optimization
- **Next.js Image Component**: Automatic image optimization, lazy loading, and responsive sizing.

### Code Splitting
- Next.js automatically splits code, loading only what's necessary for each page.

### Lazy Loading
- Dynamically import components or modules that are not immediately needed using `React.lazy` and `Suspense`.

### Caching
- Leveraging `React Query` for client-side data caching.
- Utilizing browser caching for static assets.

## 8. Accessibility

- Adhering to WCAG guidelines.
- Utilizing semantic HTML elements.
- Implementing ARIA attributes where necessary.
- Ensuring keyboard navigation and focus management.
- Providing clear and concise error messages.

## 9. Testing Strategy

### Unit Testing (Jest & React Testing Library)
- Testing individual React components and utility functions in isolation.
- Focus on component rendering, user interactions, and prop handling.

### Integration Testing (Jest & React Testing Library)
- Testing the interaction between multiple components or modules.

### End-to-End (E2E) Testing (Cypress)
- Simulating real user scenarios across the entire application.
- Testing full user flows, from login to recipe generation and cooking.

### Visual Regression Testing (Storybook & Chromatic - consideration)
- Ensuring UI consistency and detecting unintended visual changes.

## 10. Development Workflow

### Linting and Formatting
- **ESLint**: For code quality and catching potential errors.
- **Prettier**: For consistent code formatting.

### Type Checking
- **TypeScript**: Ensures type safety and improves code readability and maintainability.

### Version Control
- **Git & GitHub**: For collaborative development, pull requests, and code reviews.

## 11. Future Considerations

- **Internationalization (i18n)**: Supporting multiple languages.
- **Progressive Web App (PWA)**: Enhancing offline capabilities and installability.
- **Advanced Animations**: Implementing more sophisticated UI transitions.
- **Component Library**: Developing a reusable component library for consistency.

### Authentication
- **All authentication is handled via Supabase Auth (Google provider only).**
- Use Supabase client SDK to implement "Sign in with Google" button.
- No custom login/register forms or password reset flows.
- Use Supabase session/user state for authentication and API calls. 
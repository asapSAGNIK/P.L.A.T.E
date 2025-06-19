# Project Requirements Document (PRD)
# Plate - Your Personal AI Chef

## Project Overview
Plate is a web application that helps users cook meals using available ingredients or explore new recipes, with an engaging AI chef personality inspired by Gordon Ramsay. The platform combines real recipe data with AI-powered creative suggestions and interactive cooking guidance.

## Target Audience
- Primary: Cooking beginners and students
- Secondary: Home cooks looking for creative inspiration
- Tertiary: Experienced cooks seeking new ideas

## Core Features

### 1. User Authentication
- User registration and login
- Profile management
- Session management
- Password recovery
- **JWT authentication and Google OAuth are both supported**
- **JWT must be stored securely (prefer httpOnly cookie or secure storage)**

### 2. Main Cooking Paths
#### A. Cook within the Fridge
- Input available ingredients
- AI suggests possible recipes
- Creative cooking ideas based on ingredients
- Ingredient substitution suggestions

#### B. Out of the Fridge
- Browse new recipes
- Search by cuisine, diet, or preferences
- Save favorite recipes
- Get creative twists on traditional recipes

### 3. AI Chef Features
- Gordon Ramsay-style personality
- Step-by-step cooking instructions
- Creative recipe modifications
- Optional voice interaction
- Cooking tips and techniques
- **AI commentary and twist flows are powered by Gemini via backend endpoints**

### 4. Recipe Management
- Save recipes to "Chef's History"
- Rate and review recipes
- Track cooking history
- Share recipes with others

## Technical Requirements

### Frontend
- Responsive web design
- Intuitive user interface
- Real-time recipe suggestions
- Voice interaction capability
- Recipe history management
- **All frontend API calls now use backend endpoints via NEXT_PUBLIC_API_URL**
- **Type safety and data shape consistency are maintained**
- **Error handling and CORS are enforced**
- **Update environment variables for different environments**

### Backend
- Secure user authentication
- Recipe data management
- AI integration
- API management
- Data persistence
- **Supabase is the database with RLS**
- **Rate limiting and security best practices are enforced**

### AI Integration
- Spoonacular API for recipe data
- Gemini for personality and creative suggestions
- Voice synthesis for Gordon Ramsay style
- Recipe recommendation engine

## Success Metrics
1. User Engagement
   - Number of active users
   - Recipe generation frequency
   - User retention rate
   - Time spent on platform

2. Technical Performance
   - Recipe generation speed
   - AI response accuracy
   - System uptime
   - API response times

3. User Satisfaction
   - Recipe success rate
   - User feedback
   - Feature usage statistics
   - User retention

## Project Constraints
1. Technical
   - API rate limits (Spoonacular, Gemini)
   - Voice synthesis quality
   - Real-time processing requirements
   - Data storage limitations

2. Business
   - Development timeline
   - Resource availability
   - API costs
   - Hosting costs

## Future Considerations
1. Mobile application
2. Social features
3. Advanced AI capabilities
4. Recipe video integration
5. Community features

## Gaps and Considerations
1. **Missing Elements to Address:**
   - User preference management
   - Dietary restrictions handling
   - Ingredient quantity management
   - Recipe scaling functionality
   - Error handling for unavailable ingredients
   - Offline mode capabilities
   - Recipe difficulty levels
   - Cooking time estimates
   - Nutritional information
   - Ingredient measurement conversions

2. **Technical Considerations:**
   - API fallback mechanisms
   - Voice synthesis quality control
   - Recipe data validation
   - User data privacy
   - Content moderation
   - Performance optimization
   - Security measures

## Project Phases

### Phase 1: Foundation
- Basic user authentication
- Recipe search and display
- Simple AI integration
- Basic recipe history
- **All frontend API calls now use backend endpoints via NEXT_PUBLIC_API_URL**
- **JWT authentication and Google OAuth are both supported**
- **AI commentary and twist flows are powered by Gemini via backend endpoints**
- **Supabase is the database with RLS**
- **Error handling and CORS are enforced**
- **Type safety and data shape consistency are maintained**
- **Update environment variables for different environments**
- **Backward compatibility for authentication is maintained**
- **JWT must be stored securely**
- **Rate limiting and security best practices are enforced**
- **Test endpoints using Postman, curl, or your preferred API client**

### Phase 2: Core Features
- Advanced recipe generation
- Gordon Ramsay personality
- Voice interaction
- Enhanced recipe management

### Phase 3: Enhancement
- Advanced AI features
- Social features
- Mobile optimization
- Performance improvements

## Success Criteria
1. Successful user authentication
2. Accurate recipe generation
3. Engaging AI personality
4. Reliable voice interaction
5. Efficient recipe management
6. Positive user feedback
7. Stable system performance 
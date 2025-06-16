# Plate - Your Personal AI Chef 👨‍🍳

![Plate Logo (Placeholder)](./docs/assets/plate-logo.png)

Welcome to Plate, your intelligent culinary companion designed to help you cook delicious meals using ingredients you already have, or to explore new recipes with a fun, Gordon Ramsay-inspired twist!

## 🍽️ Project Overview

Plate is a web application that aims to demystify cooking, especially for beginners and students. It provides creative ideas for freestyle cooking and delivers step-by-step guidance in an engaging, personality-filled tone.

## ✨ Core Features

-   **User Authentication**: Secure registration and login to personalize your cooking journey.
-   **Cook within the Fridge**: Input your available ingredients and let our AI suggest recipes you can make right now.
-   **Out of the Fridge**: Discover new recipes from a vast database, filtered by cuisine, diet, and more.
-   **AI Chef Personality**: Enjoy cooking instructions and creative twists delivered in a lively, Gordon Ramsay-style tone.
-   **Optional Voice Guidance**: Get real-time, voice-guided cooking instructions (with the Gordon Ramsay voice option!).
-   **Chef's History**: Save your favorite recipes and track your cooking progress.

## 🚀 Tech Stack Highlights

Plate is built with a modern, scalable, and robust technology stack:

### Frontend
-   **Next.js 14 (React.js)**: For dynamic and optimized web interfaces.
-   **Tailwind CSS**: For rapid and responsive UI development.
-   **Redux Toolkit**: For efficient global state management.

### Backend
-   **Node.js with Express.js**: Our powerful and flexible API server.
-   **Supabase (PostgreSQL)**: Our primary database for structured data and built-in features.
-   **Redis**: For high-performance caching and session management.

### AI/ML Integration
-   **Google Gemini**: For generating creative recipe commentary, twists, and personality.
-   **Spoonacular API**: For accessing a vast database of real recipes and ingredient information.
-   **Amazon Polly**: For text-to-speech synthesis, bringing our AI chef's voice to life.

### DevOps & Infrastructure
-   **Docker**: For consistent development and deployment environments.
-   **Kubernetes**: For container orchestration and scaling (future).
-   **AWS / GCP**: For cloud hosting and services.

## 📂 Folder Structure

```
plate/
├── docs/              # Project documentation (PRD, App Flow, Schema, API, Tech Stack, Frontend Code, Roadmap)
├── frontend/          # Next.js frontend application
├── backend/           # Node.js/Express backend API
├── ai/                # AI-specific scripts or models
├── infrastructure/    # Deployment and infrastructure configurations
├── .gitignore         # Specifies intentionally untracked files to ignore
├── README.md          # Project overview and instructions
└── package.json       # Root package for shared scripts and monorepo management (if applicable)
```

## 🏁 Getting Started

### Prerequisites

-   Node.js (LTS version recommended)
-   npm or Yarn
-   Git
-   Supabase account (for database setup)
-   API keys for Spoonacular, Google Gemini, and Amazon Polly (will be configured in `.env` files)

### Installation (Initial Setup)

1.  **Clone the Repository:**
    ```bash
    git clone <your-repo-url>
    cd plate
    ```

2.  **Install Root Dependencies:**
    ```bash
    npm install # Or yarn install
    ```
    (This command assumes `workspaces` are configured in `package.json` for frontend/backend sub-projects)

3.  **Setup Environment Variables:**
    Create `.env` files in `backend/` and `frontend/` (and potentially a root `.env` if needed) based on `.env.example` templates that will be provided. These will contain your API keys and database credentials.

4.  **Database Setup (Supabase):**
    *   Follow instructions in `docs/schema-design.md` to set up your PostgreSQL database on Supabase.
    *   Ensure Row-Level Security (RLS) is configured as per the schema.

5.  **Run Development Servers:**
    *   **Frontend:**
        ```bash
        cd frontend
        npm run dev # Or yarn dev
        ```
    *   **Backend:**
        ```bash
        cd backend
        npm run dev # Or yarn dev (using nodemon/ts-node-dev)
        ```
    (Alternatively, a single root script `npm run dev` will be configured to start both simultaneously)

Your application should now be running! The frontend will typically be accessible at `http://localhost:3000` and the backend API at `http://localhost:5000` (or similar ports).

## 🗺️ Roadmap

Refer to `docs/ROADMAP.md` for a detailed breakdown of project phases, goals, and key tasks.

## 🤝 Contributing

We welcome contributions! Please refer to our `CONTRIBUTING.md` (to be created) for guidelines.

## 📄 License

This project is licensed under the MIT License - see the `LICENSE` file for details. 
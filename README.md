# TrackIntern: Next-Gen Placement Platform

Welcome to the team! TrackIntern is a modern, full-stack application designed to streamline the internship and placement process for students. This guide will help you get the project running on your local machine using our shared Supabase backend.

## Tech Stack

-   **Frontend**: React, Vite, TypeScript, Tailwind CSS
-   **Backend & Database**: Supabase (Shared)
-   **UI & Animation**: Framer Motion, Headless UI, Heroicons
-   **State Management**: Zustand

## Prerequisites

Before you begin, ensure you have the following installed on your system:

-   Node.js (v18 or later recommended)
-   npm (or a similar package manager)

## Getting Started: Step-by-Step Setup

Follow these instructions to get the project running locally.

### 1. Clone the Repository

First, clone the project repository to your local machine:

```bash
git clone <your-repository-url>
cd <repository-directory-name>

2. Install Project Dependencies
Install all the necessary Node.js packages using npm:
```bash
npm install


3. Configure Environment Variables
The application needs the Supabase API keys to connect to our shared project.

a. Create the .env File
In the root of the project, create a new file named .env by copying the example file:

```Bash
cp .env.example .env


b. Add the Supabase Keys
You will need the Project URL and the Anon Key from our shared Supabase project. I will send these to you securely.
Once you have them, add the keys to your .env file. It should look like this:

VITE_SUPABASE_URL=[https://xxxxxxxx.supabase.co](https://xxxxxxxx.supabase.co)
VITE_SUPABASE_ANON_KEY=ey...xxxx
4. Run the Application
Now that your environment is configured, you can start the local development server.

```Bash
npm run dev

The application will now be running at http://localhost:5173. Open this URL in your browser, and you should be connected to our shared backend.
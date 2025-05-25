# Be Automated CRM

This is a modern CRM application built with React, TypeScript, Firebase, and Tailwind CSS.

## Tech Stack

- React 18 + TypeScript
- Firebase (Authentication, Firestore, Cloud Functions)
- Tailwind CSS (with brand colors from the BE_AUTOMATED brand manual)
- Lucide React for icons
- Vite for building and development

## Project Structure

```
be-automated-crm/
├── .cursor/                # Cursor specific files (contains context provided)
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   │   ├── auth/           # Authentication components (e.g., LoginPage)
│   │   ├── layout/         # Layout components (e.g., MainLayout, Sidebar)
│   │   ├── contacts/       # Contacts feature components
│   │   ├── dashboard/      # Dashboard feature components
│   │   └── shared/         # Shared components (e.g., Buttons, Modals)
│   ├── hooks/              # Custom React hooks
│   ├── services/           # Services (e.g., Firebase)
│   │   └── firebase/       # Firebase specific services (auth, config, etc.)
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── App.tsx             # Main application component with routing
│   ├── main.tsx            # Main entry point (renders App)
│   └── index.css           # Tailwind CSS base styles and custom CSS
├── docs/
│   ├── PRD.md              # Product Requirements Document
│   └── brand-manual.md     # Brand Manual
├── index.html              # Main HTML file
├── package.json            # Project dependencies and scripts
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration
├── tsconfig.json           # TypeScript configuration
├── tsconfig.node.json      # TypeScript configuration for Node environment (Vite)
└── vite.config.ts          # Vite configuration
```

## Getting Started

1.  **Clone the repository (if applicable).**
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Set up Firebase:**
    *   Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/).
    *   In your Firebase project, enable Authentication (Email/Password provider at least) and Firestore.
    *   Get your Firebase project configuration object.
    *   Replace the placeholder values in `src/services/firebase/firebase.config.ts` with your actual Firebase project credentials.

4.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    The application will be available at `http://localhost:5173` (or another port if 5173 is busy).

## Available Scripts

-   `npm run dev`: Starts the development server.
-   `npm run build`: Builds the application for production.
-   `npm run lint`: Lints the codebase using ESLint.
-   `npm run preview`: Serves the production build locally for preview.

## Further Development

-   Implement the detailed CRM functionalities as per the design mockup and PRD.
-   Expand Firebase Firestore rules for data security.
-   Implement Firebase Cloud Functions for backend logic if needed.
-   Add more detailed UI components based on the brand manual.
-   Write unit and integration tests. 
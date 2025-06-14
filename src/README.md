# Flortune - Financial Management App

This is a Next.js application called Flortune, designed to help users manage their finances. It's built with Next.js (App Router), React, TypeScript, ShadCN UI, Tailwind CSS, and Genkit for AI features.

## Getting Started

1.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

2.  **Set up environment variables:**
    Create a `.env` file in the root of the project. You might need to add API keys for Genkit (e.g., Google AI Studio API Key if using Gemini).
    ```env
    # Example for Google AI
    GOOGLE_API_KEY=your_google_api_key_here
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    This will start the Next.js app (usually on port 3000 or 9003 as configured) and the Genkit development server (for flows).

4.  Open [http://localhost:9003](http://localhost:9003) (or your configured port) with your browser to see the result.

## Core Features (as per PRD)

*   **Financial Calendar**: View expenses and income.
*   **Skeleton Loading**: For smooth UX.
*   **Data Analysis**: Spending summaries.
*   **AI-Powered Smart Suggestions**: (Uses Genkit) Analyzes spending, suggests limits.
*   **Private Mode**: Toggle to hide sensitive data.
*   **History and Trends**: Visual financial history.
*   **AI Auto-Categorization**: (Uses Genkit) Categorizes transactions.
*   **Module Sharing**: (Planned) Share modules with permissions.

## Style Guidelines

*   **Primary Color**: Deep Teal (`#16A381`)
*   **Background Color**: Light Teal (`#E0F2F1`, desaturated)
*   **Accent Color**: Mustard Yellow (`#FACC15`)
*   **Headline Font**: Poppins
*   **Body Font**: Inter
*   **Icons**: Minimalist, finance-related with a subtle floral theme, using `lucide-react`.

## Project Structure Highlights

*   `src/app/[locale]`: Internationalized routes using Next.js App Router and `next-intl`.
*   `src/components`: Shared UI components, layout components, and feature-specific components.
    *   `src/components/ui`: ShadCN UI components.
*   `src/lib`: Utility functions, constants.
*   `src/contexts`: React context for global state (e.g., `AppSettingsProvider`).
*   `src/hooks`: Custom React hooks.
*   `src/messages`: Translation files (`en.json`, `pt.json`, etc.).
*   `src/i18n.ts`: Configuration for `next-intl` (server-side).
*   `src/middleware.ts`: Handles internationalization routing for `next-intl`.
*   `src/ai`: Genkit flows and configuration.
    *   `src/ai/flows`: Specific AI agent implementations.
*   `public`: Static assets.

## Internationalization (i18n)

The application uses `next-intl` for internationalization.
*   Supported locales are defined in `src/config/locales.ts`.
*   Translation messages are in `messages/*.json`.
*   The `src/middleware.ts` handles locale detection and routing.
*   The `src/i18n.ts` file configures `next-intl` for server components and server-side data fetching.
*   Client components use hooks like `useTranslations` and `Link` from `next-intl/client`.
*   Server components use `getTranslations` from `next-intl/server`.

## Development Notes

*   Ensure your `.env` file is correctly configured if you plan to use Genkit AI features that require API keys.
*   The UI uses ShadCN components, which are built on top of Radix UI and styled with Tailwind CSS. You can add more ShadCN components using their CLI.
*   Pay attention to client vs. server components. Server components are default in the App Router. Use `"use client";` directive for components requiring client-side interactivity.

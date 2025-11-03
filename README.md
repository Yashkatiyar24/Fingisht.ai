# FinSight.ai

FinSight.ai is an AI-powered personal finance dashboard that analyzes bank and credit card statements to categorize expenses, track spending, create budgets, and forecast future expenses. Built with React, TypeScript, Tailwind CSS, Supabase (database + edge functions), and Clerk authentication, FinSight.ai aims to be "Google Analytics for your finances," giving individuals and small businesses insights into their money.

## Features

- **Transaction import:** Upload CSV, Excel, or PDF statements and map columns to import transactions.
- **Live dashboard & analytics:** Visualize spending over time, spending by category, and key metrics with real-time data pulled from Supabase.
- **Expense categorization:** Automatically categorize transactions using AI models; allow manual overrides.
- **Budgets:** Set budgets for different categories and track actual spend vs budget.
- **Forecasting:** Project future expenses based on historical spending patterns.
- **Authentication & multi-tenancy:** User authentication via Clerk; data stored securely in Supabase with RLS rules.

## Planned Improvements

- Extend file import support to handle various bank statement formats (PDF/Excel).
- Implement AI-powered categorization using machine learning models.
- Build budgeting and forecasting modules.
- Enhance dashboards with more charts and insights.
- Improve documentation and developer setup.

## Getting Started

To run FinSight.ai locally:

1. Clone the repository.
2. Install dependencies with `npm install` or `bun install`.
3. Configure Supabase and Clerk credentials as described in `AUTH_SETUP.md`.
4. Start the development server: `npm run dev` or `bun dev`.
5. Open the app at `http://localhost:3000`.

For detailed setup, see `DEVELOPMENT.md` and `SETUP_SUMMARY.md`.

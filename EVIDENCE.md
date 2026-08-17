# Cadence Build & Deployment Evidence

## 🌐 Live Application & Verification Endpoints
- **Live Vercel Application URL**: [https://cadence-ng.vercel.app](https://cadence-ng.vercel.app)
- **Main App Entry / Landing Page**: [https://cadence-ng.vercel.app](https://cadence-ng.vercel.app)
- **Judge Evidence Dashboard**: [https://cadence-ng.vercel.app/dashboard](https://cadence-ng.vercel.app/dashboard) (aggregates 28 verified vendors, ₦294,500 settled revenue, safety scorecard, P&L audit excel, and Paystack mode)
- **AI Safety Scorecard**: [https://cadence-ng.vercel.app/scorecard](https://cadence-ng.vercel.app/scorecard) (interactive client test harness evaluating AI alignment)
- **Platform Execution Traces**: [https://cadence-ng.vercel.app/logs](https://cadence-ng.vercel.app/logs) (live audited function logs with JSON export)
- **Onboarding Flow**: [https://cadence-ng.vercel.app/onboarding](https://cadence-ng.vercel.app/onboarding) (register merchant shop, payout banking credentials, and Ada AI persona in under 2 minutes)
- **Control Desk Log-In**: [https://cadence-ng.vercel.app/login](https://cadence-ng.vercel.app/login) (merchant portal sign-in)
- **Dynamic Buyer Storefront Chat**: [https://cadence-ng.vercel.app/shop/adas-textile-corner](https://cadence-ng.vercel.app/shop/adas-textile-corner) (grounded catalog chat with live WhatsApp closing trigger)
- **Telegram Buyer Webhook Receiver**: [https://cadence-ng.vercel.app/api/telegram-webhook](https://cadence-ng.vercel.app/api/telegram-webhook) (receives buyer messages, parses `/start <shop_slug>`, and processes tool calls via Ada engine)

## ☁️ Cloud Environments & Production Infrastructure

### 🚀 Vercel & Google Cloud Platform
- **Live Vercel Production Deployment**: Deployed live at **[https://cadence-ng.vercel.app](https://cadence-ng.vercel.app)** with instant serverless routing and dynamic API routes.
- **Google Cloud Run Ready**: Next.js 16 standalone container build (`output: 'standalone'`) configured with `scripts/copy-static.js` postbuild asset bundling.
- **Google Firebase Firestore**: Connected to production Cloud Firestore (`shops`, `conversations`, `products`, `businesses`, `payments`, `expenses`, `logs`, `telegram_chats` collections). Includes zero-downtime offline fallback to local deterministic ledger (`scripts/local-data.json`).
- **Google Gemini 2.5 AI Engine**: Ada operator agent powered by Google Gemini API (`GEMINI_API_KEY`) with deterministic function calls (`check_inventory`, `present_payment_details`, `ValidatorGate`).

### 📱 Telegram Bot & Paystack Webhooks
- **Telegram Webhook Engine**: Endpoint at `https://cadence-ng.vercel.app/api/telegram-webhook` supporting multi-tenant shop linking (`/start <shop_slug>`), buyer conversation state persistence in `telegram_chats` Firestore collection, and instant human takeover in the **Takeover Inbox** dashboard tab.
- **Paystack Payment Gateway**: Endpoint at `https://cadence-ng.vercel.app/api/payments/webhook` processing real-time settlement notifications, generating ₦294,500 ($213 USD) settled merchant revenue statements.

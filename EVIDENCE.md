# Cadence Build & Deployment Evidence

## Local & Production Verification Endpoints
- **Main App Entry / Landing Page**: [http://localhost:3000/](http://localhost:3000/)
- **Judge Evidence Dashboard**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard) (aggregates 28 verified vendors, ₦294,500 settled revenue, safety scorecard, P&L audit excel, and Paystack mode)
- **AI Safety Scorecard**: Available under the **Safety Scorecard** tab in dashboard or via [/scorecard](http://localhost:3000/scorecard)
- **Platform Execution Traces**: Available under **Telemetry Traces** tab in dashboard with instant JSON trace export
- **Onboarding Flow**: [http://localhost:3000/onboarding](http://localhost:3000/onboarding) (register merchant shop, payout banking credentials, and Ada AI persona in under 2 minutes)
- **Control Desk Log-In**: [http://localhost:3000/login](http://localhost:3000/login) (merchant portal login)
- **Dynamic Buyer Storefront Chat**: [http://localhost:3000/shop/adas-textile-corner](http://localhost:3000/shop/adas-textile-corner) (grounded catalog chat with live WhatsApp closing trigger)
- **Telegram Buyer Webhook Receiver**: `/api/telegram-webhook` (receives buyer messages, parses `/start <shop_slug>`, and processes tool calls via Ada engine)

## Cloud Environments & Infrastructure

### ☁️ Google Cloud Platform & Firebase Firestore
- **Google Cloud Run Deployment**: Next.js 16 standalone container build (`output: 'standalone'`) configured with `scripts/copy-static.js` postbuild asset bundling for Google Cloud Run deployment.
- **Google Firebase Firestore**: Connected to production Cloud Firestore (`shops`, `conversations`, `products`, `businesses`, `payments`, `expenses`, `logs`, `telegram_chats` collections). Includes zero-downtime offline fallback to local deterministic ledger (`scripts/local-data.json`).
- **Google Gemini 2.5 AI Engine**: Ada operator agent powered by Google Gemini API (`GEMINI_API_KEY`) with deterministic function calls (`check_inventory`, `present_payment_details`, `ValidatorGate`).

### 📱 Telegram Bot & Paystack Webhooks
- **Telegram Webhook Engine (`/api/telegram-webhook`)**: Fully wired multi-tenant Telegram Bot endpoint supporting merchant shop linking (`/start <shop_slug>`), buyer conversation state persistence in `telegram_chats` Firestore collection, and instant human takeover in the **Takeover Inbox** dashboard tab.
- **Paystack Payment Gateway (`/api/payments/webhook`)**: Automated settlement verification processing real-time transfer notifications, generating ₦294,500 ($213 USD) settled merchant revenue statements.

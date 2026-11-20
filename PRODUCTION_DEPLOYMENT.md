# Production deployment

Target architecture:

- Frontend: Vercel (Next.js, Singapore compute, global CDN).
- Backend: Railway paid service in Singapore, always running.
- PostgreSQL and Redis: managed services in the same Railway Singapore project.
- Uploads: Railway persistent volume mounted at `/data`, with `UPLOAD_DIR=/data/uploads`.
- Domains: `www.example.com` for the frontend and `api.example.com` for the backend.

Do not deploy the backend as a serverless function. It owns WebSocket connections,
scheduled jobs, Redis queues, and uploaded files.

## 1. DOKU production account

Activate DOKU Checkout and QRIS in DOKU Dashboard first. QRIS activation normally
requires verified KTP/NPWP. Create **Production** Client ID and Secret Key; sandbox
credentials cannot receive real payments.

Configure the stable notification URL in DOKU Dashboard:

`https://api.example.com/api/payments/doku/notify`

Never use a tunnel URL for production and never put DOKU/JWT/database secrets in
Git or in `NEXT_PUBLIC_*` variables.

## 2. Railway backend

1. Create a paid Railway project and set the service root directory to `/backend`.
2. Select `Southeast Asia (Singapore)`; Railway will detect `backend/Dockerfile`.
3. Add PostgreSQL and Redis services in the same project/private network.
4. Attach a persistent volume at `/data`. Keep one backend replica while using
   local persistent uploads.
5. Copy the keys from `backend/.env.production.example` to Railway Variables and
   replace every placeholder. Set `REDIS_HOST`, `REDIS_PORT`, and `DATABASE_URL`
   using Railway reference variables.
6. Generate two independent random JWT secrets of at least 32 bytes.
7. In Deploy settings set pre-deploy command `npm run prisma:deploy`, start command
   `node dist/src/main.js`, healthcheck `/api/health` (180 seconds), restart policy
   `Always`, and one replica. Set `RAILWAY_RUN_UID=0` because Railway volumes are
   mounted as root, then deploy.
8. Add the custom domain `api.example.com`. Verify that
   `https://api.example.com/api/health` returns HTTP 200.

The pre-deploy command applies committed Prisma migrations before new traffic is
switched to the deployment. Swagger is disabled in production by default.

## 3. Initial database and Rp1/Rp2 live smoke test

Only on the new database, temporarily set:

`LIVE_PAYMENT_TEST_PRICES=true`

Then run the seed once with production owner credentials. Product prices become
Rp2, Rp4, Rp6, and so on. Because checkout charges a 50% DP, the first two DP
amounts are Rp1 and Rp2. Choose **Pickup** so delivery fees stay Rp0.

After the live payment succeeds, set `LIVE_PAYMENT_TEST_PRICES=false`, restore
the intended catalog prices in the admin panel, and redeploy. Do not repeatedly
run the full seed after real orders exist.

## 4. Vercel frontend

1. Import the repository as a Vercel project with root directory `/frontend`.
2. Add the variables from `frontend/.env.production.example`; set
   `NEXT_PUBLIC_API_URL=https://api.example.com/api`.
3. Deploy first to Preview, run the checks below, then promote to Production.
4. Add `www.example.com` and the apex domain. Vercel supplies HTTPS and CDN.
5. Update backend `FRONTEND_URL` and `ALLOWED_ORIGINS` to the final HTTPS domains,
   then redeploy the backend.

## 5. Go-live checks

- `/api/health` is 200 and Swagger `/api/docs` is not exposed.
- Browser requests use HTTPS only and no secret appears in frontend bundles.
- Register/login, international phone input, cart, checkout, and Pickup work.
- Create a Rp1/Rp2 DP, open the DOKU-hosted checkout, choose QRIS, and pay yourself.
- The signed notification changes the order to paid; refresh/status polling also
  reconciles through DOKU Check Status if the webhook arrives late.
- A reused/modified notification signature and wrong amount are rejected.
- Uploaded product images remain after a backend redeploy.
- Configure an external uptime monitor for `/api/health`, database backups, Redis
  persistence as needed, and Railway volume backups.

Do not declare the site live until DOKU Dashboard shows QRIS active and the real
Rp1/Rp2 transaction reaches a paid/success state in both DOKU and the order page.

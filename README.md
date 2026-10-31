# Flight Management

Flight operations dashboard and REST API. The frontend supports flight search, schedule/status review, and admin flight create, edit, delete, and AviationStack sync. MongoDB stores flights; Redis caches the flight list for 60 seconds.

## Run on Windows

### 1. Start MongoDB

Install MongoDB Community Server as a Windows service if it is not already installed. Open **PowerShell as Administrator** and run:

```powershell
Start-Service MongoDB
Get-Service MongoDB
```

The service should show `Running`. Set `MONGO_URL` in `backend/.env` to your local MongoDB URL, for example:

```text
MONGO_URL=mongodb://127.0.0.1:27017/flight_management
```

### 2. Start Redis

Redis is configured at `localhost:6379`. The easiest Windows option is Docker Desktop. Start Docker Desktop, then run this once:

```powershell
docker run --name flight-redis -p 6379:6379 -d redis
```

For later runs, start the existing container:

```powershell
docker start flight-redis
```

Check Redis with:

```powershell
docker exec flight-redis redis-cli ping
```

The response should be `PONG`. Alternatively, install Redis in WSL and start it with `sudo service redis-server start`.

### 3. Start the API and frontend locally

Keep MongoDB and Redis running. In separate PowerShell terminals from the project root:

```powershell
cd backend
npm install
npm run dev
```

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL printed in the frontend terminal (normally `http://localhost:5173`). The API runs on port `3000`.

`backend/.env` also needs a `JWT_SECRET`. `AVIATION_API_KEY` is only needed for the AviationStack sync action.

Local Vite requests use `/api`; the Vite development proxy forwards these requests to `http://localhost:3000`. No frontend API URL is needed locally.

The database starts empty. To load clearly labeled example flights for the dashboard, run `npm run seed:demo` from `backend/`. This command only inserts demo flights when the flight collection is empty; it never replaces existing flights. They are sample records, not real-world flight information.

## Flight API

All flight routes require `Authorization: Bearer <token>`. Create, edit, delete, and sync routes require an admin token.

| Method | Route | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/flights` | Signed in | List flights |
| `GET` | `/api/flights/:id` | Signed in | Flight details |
| `POST` | `/api/flights` | Admin | Add a flight |
| `PATCH` | `/api/flights/:id` | Admin | Update flight fields |
| `DELETE` | `/api/flights/:id` | Admin | Delete a flight |
| `POST` | `/api/flights/sync` | Admin | Import/update AviationStack data |

New sign-ups have the `user` role. To grant a trusted account admin access, connect `mongosh` to the database named in `MONGO_URL` and run:

```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

Sign in again after changing the role so the JWT contains the admin role.

## Deploy frontend to Vercel and API to AWS Elastic Beanstalk

The frontend and API are separate deployments, so they do not share a localhost server in production. The browser calls the public AWS API URL directly.

### Vercel frontend

Create a Vercel project with the repository's `frontend` directory as its **Root Directory**. Vercel detects Vite; use `npm run build` and `dist` if prompted. Add this environment variable in Vercel for **Production** (and Preview if required):

```text
VITE_API_BASE_URL=https://YOUR-AWS-API-DOMAIN/api
```

Replace the example with the HTTPS URL of the deployed Elastic Beanstalk API. Redeploy after changing frontend environment variables. `frontend/vercel.json` sends client-side React Router URLs back to the app.

### AWS Elastic Beanstalk API

Create an Elastic Beanstalk **Node.js** environment and deploy the contents of the `backend` directory as the application source. `backend/Procfile` and the production `npm start` script start `node server.js`; Elastic Beanstalk supplies the `PORT`.

Configure these values under the environment's software/environment properties. Use managed production services, not localhost:

```text
NODE_ENV=production
MONGO_URL=<your hosted MongoDB connection string>
JWT_SECRET=<a long random secret>
REDIS_URL=<your hosted Redis connection URL>
CORS_ORIGINS=https://YOUR-VERCEL-DOMAIN
AVIATION_API_KEY=<your AviationStack key, if using live sync>
```

Set `CORS_ORIGINS` to the exact Vercel origin (scheme and hostname, no path); add additional origins comma-separated if needed. Store secrets in AWS environment settings, never commit them or include a `.env` file in the deployment. Ensure the AWS API is publicly reachable over HTTPS and its security/network settings allow connections to the hosted MongoDB and Redis.

### How the frontend connects

`frontend/src/api.js` prefixes requests with `VITE_API_BASE_URL`. Locally it defaults to `/api`, and `frontend/vite.config.js` proxies that path to the Node API. In production it uses the AWS URL configured in Vercel. The Express CORS allowlist in `backend/src/app.js` permits the configured Vercel origin.

## Dockerize the backend

The backend has its own `backend/Dockerfile`. It builds a production Node.js image and exposes only the API port (`3000`). MongoDB and Redis should be managed services in production; pass their connection URLs to the container as environment variables rather than exposing their ports or baking credentials into the image.

From the project root, build the image:

```powershell
docker build -t flight-management-api ./backend
```

For the local container test, the backend uses the MongoDB and Redis URLs in `backend/.env`. If those services are running directly on Windows, use `host.docker.internal` because `127.0.0.1` inside a container refers to that container. Ensure `backend/.env` has `PORT=3000` and these local connection URLs before running:

```powershell
docker run --name flight-api --env-file backend/.env -e PORT=10000 -e MONGO_URL=mongodb://host.docker.internal:27017/flight_management_api -e REDIS_URL=redis://host.docker.internal:6379 -p 10000:10000 flight-management-api
```

The `.env` file is read by Docker at runtime and excluded from the image. Keep it private and do not commit it. For deployment, provide hosted MongoDB/Redis URLs through the platform's environment settings instead of using `host.docker.internal`. Render provides the `PORT` environment variable; the image documents port `10000` with `EXPOSE`. For this local container command, `-e PORT=10000` makes the app listen on the port mapped by `-p 10000:10000`. Express binds to `0.0.0.0` so container platforms can reach it. Deploy this backend image/Dockerfile; Vercel continues to build the React frontend from `frontend`.

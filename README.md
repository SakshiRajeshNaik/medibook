# MediBook — Hospital Appointment Booking System

Production-ready **MERN** hospital appointment platform with **Docker**, **Jenkins**, **Nginx**, and **GitHub Actions** CI/CD.

Repository: https://github.com/SakshiRajeshNaik/medibook

| | |
|---|---|
| **Team** | Poornima Devangamath, Sakshi Rajesh Naik |
| **Guide** | Mohammed Adnan — NIE Mysuru |

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, Vite, Tailwind CSS, Redux Toolkit, React Router, Socket.io Client |
| Backend | Node.js, Express.js, MongoDB, Mongoose, JWT, Socket.io |
| DevOps | Docker, Docker Compose, Nginx, Jenkins, GitHub Actions |

## Features

- **JWT authentication** with role-based access (Patient, Doctor, Admin)
- **Doctor search & filtering** by specialization, department, rating
- **Appointment booking** with hourly slots from doctor schedules
- **Real-time slot locking** (Socket.io + TTL locks)
- **Video consultation** via Jitsi Meet rooms
- **Prescription PDF** generation (PDFKit)
- **Email notifications** (Nodemailer, optional SMTP)
- **Payment gateway** (Stripe + mock mode for demos)
- **Ratings & reviews** with aggregated doctor scores
- **Queue management** for doctors
- **Admin analytics dashboard**
- **Doctor schedule management**
- **Live notifications** via Socket.io

## Project Structure

```
├── backend/                 # Express API (MVC)
│   └── src/
│       ├── config/          # DB, env, logger
│       ├── controllers/
│       ├── middleware/
│       ├── models/          # Mongoose schemas
│       ├── routes/
│       ├── services/        # Email, PDF, payments, slots
│       ├── socket/
│       └── scripts/seed.js
├── frontend/                # React SPA
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── store/           # Redux Toolkit slices
│       └── services/
├── nginx/                   # Reverse proxy config
├── docker-compose.yml
├── Jenkinsfile
└── .github/workflows/ci-cd.yml
```

## Quick Start (Docker)

```bash
cd "devops project"
cp .env.example .env
# Edit JWT_SECRET in .env for production

docker compose up --build -d
docker compose exec api node src/scripts/seed.js
```

Open **http://localhost:8080**

### Demo Accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@medibook.com | admin123 |
| Patient | patient@medibook.com | patient123 |
| Doctor | sarah@medibook.com | doctor123 |

## Local Development

### Backend

```bash
cd backend
npm install
# Start MongoDB locally or use Docker: docker run -d -p 27017:27017 mongo:7
export MONGODB_URI=mongodb://localhost:27017/medibook
export JWT_SECRET=dev-secret
npm run dev
npm run seed
```

API: **http://localhost:5000**

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: **http://localhost:5173** (proxies `/api` and `/socket.io` to backend)

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register (patient/doctor) |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET | `/api/doctors` | Search doctors |
| GET | `/api/doctors/:id/slots?date=` | Available slots |
| POST | `/api/appointments/lock` | Lock slot (5 min) |
| POST | `/api/appointments` | Book appointment |
| GET | `/api/appointments` | List appointments |
| POST | `/api/payments/checkout` | Create payment session |
| POST | `/api/payments/mock-confirm` | Demo payment |
| GET | `/api/prescriptions/:id/pdf` | Download prescription PDF |
| POST | `/api/reviews` | Submit review |
| GET | `/api/queue?doctorId=&date=&time=` | Queue list |
| GET | `/api/admin/analytics` | Admin dashboard stats |

## Environment Variables

See `.env.example` for all options:

- `JWT_SECRET` — required in production
- `MONGODB_URI` — MongoDB connection string
- `STRIPE_SECRET_KEY` — enables real payments (omit for mock)
- `SMTP_*` — enables real emails (omit to log to console)

## DevOps

### Docker Compose Services

| Service | Port | Role |
|---------|------|------|
| nginx | 8080 | Reverse proxy |
| api | 5000 (internal) | Express + Socket.io |
| frontend | 80 (internal) | React static build |
| mongo | 27017 (internal) | MongoDB |

### Jenkins Pipeline

1. Checkout  
2. Validate structure  
3. `docker compose build`  
4. `docker compose up -d`  
5. Seed database  
6. Health check on `/api/health`

### GitHub Actions

On push to `main`/`master`: build images, start stack, seed DB, run health check.

## Architecture

```
Client → Nginx:8080
           ├── /api/*     → Express API :5000
           ├── /socket.io → Socket.io
           └── /*         → React SPA
                              ↓
                           MongoDB
```

## Deployment Steps (Production)

1. Provision a Linux server with Docker and Docker Compose.
2. Clone the repository and configure `.env` (strong `JWT_SECRET`, SMTP, Stripe).
3. Run `docker compose up --build -d`.
4. Run seed once: `docker compose exec api node src/scripts/seed.js`.
5. Point your domain to the server; terminate TLS at Nginx or a load balancer.
6. Configure Jenkins with the included `Jenkinsfile` for automated deploys on push.

## License

Academic project — NIE Mysuru.

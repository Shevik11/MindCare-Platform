# MindCare Platform — Frontend

React 18 + Vite + Chakra UI frontend for the MindCare Platform.

## Setup

```bash
npm install
npm run dev     # http://localhost:5173
```

The frontend proxies all API requests to the backend gateway at `http://localhost:5000`. Make sure the backend is running before starting the frontend.

## Scripts

| Command         | Description                        |
|-----------------|------------------------------------|
| `npm run dev`   | Start development server           |
| `npm run build` | Build for production               |
| `npm run preview` | Preview production build         |

## Structure

```
src/
  pages/          Page components (one per route)
  components/     Shared UI components (Header, CustomToast)
  context/        AuthContext — JWT auth state
  utils/          imageUrl helper
  App.jsx         Router setup
```

## API

All requests go to `http://localhost:5000/api/...` via the backend gateway.

| Prefix               | Service       |
|----------------------|---------------|
| `/api/auth`          | Auth (5001)   |
| `/api/psychologists` | Psychologist (5002) |
| `/api/articles`      | Article (5003) |
| `/api/appointments`  | Appointment (5004) |
| `/api/admin`         | Admin (5005)  |
| `/api/comments`      | Comment (5006) |
| `/uploads/*`         | Static files  |

## Environment

Create a `.env` file in the `frontend/` directory if you need to override defaults:

```env
VITE_API_URL=http://localhost:5000
```

# PeopleSoft (Local Full-Stack)

Backend: Go (Gin) + PostgreSQL  
Frontend: React (Vite) + Bootstrap  
Auth: JWT (Register/Login)  
Modules: Employees, Leaves, Performance

## Run Backend (local Postgres)
1. Create a PostgreSQL DB `peoplesoft_db` and update `.env` in `backend/` if needed.
2. Install Go 1.20+
3. In `backend/`:
   ```bash
   go mod tidy
   go run main.go
   ```

## Run Frontend
1. In `frontend/`:
   ```bash
   npm install
   npm run dev
   ```
2. Open http://localhost:5173

## API Base
- Backend: http://localhost:8080

## Optional: Docker Compose (backend+db)
In `backend/`:
```bash
docker compose up --build
```

Then run the frontend as above.

# Sistema de Seguimiento de Egresados ICCI

- `backend/`: API REST con NestJS + Prisma + MySQL. Swagger en http://localhost:3000/docs
- `frontend/`: aplicación Angular. Corre en http://localhost:4200

## Cómo levantarlo

1. Iniciar MySQL desde el panel de XAMPP.
2. Backend:
   ```bash
   cd backend
   npm install
   npx prisma migrate dev
   npm run prisma:seed
   npm run start:dev
   ```
3. Frontend (en otra terminal):
   ```bash
   cd frontend
   npm install
   npm start
   ```

Cuenta de administrador del seed: `admin@icci.cl` / `Admin1234`.

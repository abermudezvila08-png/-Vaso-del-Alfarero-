# La Mesa Dorada — Sistema de Reservación de Restaurante

Sistema completo de reservación de restaurante con prepago, política de cancelación escalonada, e interfaces diferenciadas para clientes y personal.

## Características

- **Flujo de reservación**: Fecha → Horario → Mesa(s) → Paquete de almuerzo → Prepago
- **Política de cancelación transparente**:
  - Más de 24h antes: 100% de reembolso
  - 24–20h antes: 10% de penalización
  - 19–12h antes: 20% de penalización
  - 11–0h antes: 45% de penalización
- **Bloqueo de mesa**: Solo se bloquea después del prepago
- **Doble interfaz**:
  - Clientes: autenticación con email y contraseña
  - Personal: autenticación triple (email + contraseña + código de empresa)
- **Panel de administrador**: Único que puede cancelar en las últimas 24 horas
- **Diseño responsive**: Funciona en escritorio y móvil
- **Paleta**: Negro, naranja y oro

## Tecnologías

- **Backend**: FastAPI + SQLAlchemy + SQLite
- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Autenticación**: JWT con bcrypt

## Instalación

### Backend

```bash
cd restaurant-reservation
python -m venv .venv
source .venv/bin/activate
pip install -e .
uvicorn backend.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Cuentas de prueba

| Rol | Email | Contraseña | Código de Empresa |
|-----|-------|------------|-------------------|
| Admin | admin@restaurante.com | admin123 | STAFF2024 |
| Personal | staff@restaurante.com | staff123 | STAFF2024 |

Los clientes se registran directamente en la aplicación.

## API Docs

Con el backend corriendo: http://localhost:8000/docs

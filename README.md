# Vaso del Alfarero

Descripción
-----------
Vaso del Alfarero es una plataforma comunitaria para el intercambio de conocimientos, interacción entre usuarios, realización de quizzes y una pequeña tienda temática. Este repositorio contiene el backend (Node.js / Express) y el esquema de base de datos (PostgreSQL). El frontend está planificado en Flutter (no incluido en este repositorio).

Características principales
--------------------------
- Autenticación de usuarios (registro / login con JWT).
- Feeds / publicaciones.
- Mensajería entre usuarios (chat).
- Gestión de quizzes.
- Sección de tienda (productos).
- Geolocalización / ubicaciones.
- Esquema SQL para PostgreSQL incluido en database/schema.sql.

Contenido del repositorio
-------------------------
- backend/ — API en Node.js con Express.
  - index.js — servidor con rutas principales (registro, login, feeds, chat, quizzes, stores, locations). Actualmente usa almacenamiento en memoria.
  - package.json — dependencias y scripts.
- database/
  - schema.sql — esquema para PostgreSQL (tablas: usuarios, publicaciones, mensajes, quizzes, productos, ubicaciones, deborat_ai_logs, trigger de ejemplo).
- .gitignore
- README.md (este archivo)

Stack técnico
-------------
- Backend: Node.js + Express
- Autenticación: JWT (jsonwebtoken)
- Base de datos: PostgreSQL (esquema incluido)
- Frontend (planificado): Flutter

Requisitos previos
------------------
- Node.js (v16+ recomendado)
- npm o yarn
- PostgreSQL si deseas usar la base de datos real
- (Opcional) herramienta psql para aplicar el esquema

Instalación y ejecución (backend)
--------------------------------
1. Clona el repositorio:
   git clone https://github.com/abermudezvila08-png/-Vaso-del-Alfarero-.git

2. Entra en la carpeta del backend:
   cd -Vaso-del-Alfarero-/backend

3. Instala dependencias:
   npm install

4. Variables de entorno recomendadas (crear un archivo `.env` en `backend/`):
   - PORT=3000
   - JWT_SECRET=un_secreto_fuerte
   - DATABASE_URL=postgresql://usuario:password@host:puerto/nombre_bd

5. Ejecutar:
   npm start
   El servidor por defecto escucha en http://localhost:3000

Nota: El archivo `backend/index.js` en esta versión utiliza almacenamiento en memoria (arrays) y una clave JWT de ejemplo. Antes de usar en producción debes conectar un sistema de persistencia (PostgreSQL u otra DB), hashear contraseñas y usar un JWT_SECRET seguro.

Base de datos
-------------
En `database/schema.sql` hay un esquema completo para PostgreSQL. Para aplicarlo en tu base de datos:

1. Crea la base de datos en PostgreSQL:
   createdb vaso_del_alfarero

2. Aplica el esquema:
   psql -d vaso_del_alfarero -f database/schema.sql

Puntos importantes de seguridad y producción
-------------------------------------------
- No almacenes contraseñas en texto plano: usa bcrypt (o similar) para hashear passwords.
- No mantengas `JWT_SECRET` en el código; úsalo desde variables de entorno.
- Cambia la implementación en memoria por una conexión a la base de datos (ej. usando pg, Sequelize u otro ORM).
- Habilita CORS y control de rate-limiting si el API estará público.
- Agrega logging y manejo de errores centralizado.
- Implementa validación (ej. Joi / express-validator) para la entrada de datos.

Rutas principales de la API (según backend/index.js)
----------------------------------------------------
- POST /api/auth/register
  - Body: { username, password }
  - Registro de usuario (actualmente guarda en memoria).
- POST /api/auth/login
  - Body: { username, password }
  - Devuelve JWT si las credenciales coinciden.
- GET /api/feeds
  - Lista de feeds/publicaciones.
- POST /api/feeds
  - Crear feed.
- GET /api/chat
  - Lista de mensajes de chat.
- POST /api/chat
  - Enviar mensaje.
- GET /api/quizzes
  - Lista de quizzes.
- POST /api/quizzes
  - Crear quiz.
- GET /api/stores
  - Lista de productos/tiendas.
- POST /api/stores
  - Crear entrada de tienda/producto.
- GET /api/locations
  - Lista de ubicaciones.
- POST /api/locations
  - Registrar ubicación.

Limitaciones actuales (detectadas)
----------------------------------
- El backend usa almacenamiento en memoria (arrays). Los datos se pierden al reiniciar el servidor.
- Contraseñas sin hashear en la implementación actual.
- No hay tests automatizados.
- No se encontró código de frontend en este repositorio.
- Faltan políticas de CORS, validación y manejo de errores robusto.

Qué agregué al README
---------------------
- Descripción ampliada del proyecto.
- Secciones de instalación y ejecución.
- Instrucciones para aplicar el esquema de PostgreSQL.
- Lista de rutas/endpoint disponibles (documentación básica).
- Advertencias de seguridad y recomendaciones para producción.
- Secciones de requerimientos y limitaciones actuales.

Contribuciones
--------------
Si deseas contribuir:
1. Haz fork del repositorio.
2. Crea una rama con tu cambio: git checkout -b feature/mi-cambio
3. Haz commits atómicos y descriptivos.
4. Abre un Pull Request describiendo el cambio.

Licencia
--------
Este proyecto no incluye un archivo de licencia específico en el repositorio. Se recomienda añadir un archivo LICENSE (por ejemplo MIT) si quieres permitir uso abierto. Si quieres, puedo añadir una plantilla MIT o la licencia que prefieras.

Contacto
--------
Para preguntas o coordinación del proyecto, usa el perfil del autor: https://github.com/abermudezvila08-png

README completado
-----------------
El README ahora documenta el estado actual del repositorio y añade instrucciones y recomendaciones prácticas para continuar el desarrollo o desplegar el backend.

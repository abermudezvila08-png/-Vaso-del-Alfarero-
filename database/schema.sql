-- PostgreSQL database schema for Vaso del Alfarero

-- Table for usuarios (users)
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    contraseña VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for publicaciones (posts)
CREATE TABLE publicaciones (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    contenido TEXT NOT NULL,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    fecha_publicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for mensajes (messages)
CREATE TABLE mensajes (
    id SERIAL PRIMARY KEY,
    contenido TEXT NOT NULL,
    usuario_envia_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    usuario_recibe_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    fecha_mensaje TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for quizzes
CREATE TABLE quizzes (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for productos (products)
CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for ubicaciones (locations)
CREATE TABLE ubicaciones (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    latitud DECIMAL(9, 6) NOT NULL,
    longitud DECIMAL(9, 6) NOT NULL
);

-- Table for Deborat AI validation logs
CREATE TABLE deborat_ai_logs (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    mensaje TEXT NOT NULL
);

-- Function for synchronization support
CREATE OR REPLACE FUNCTION sync_logs() RETURNS TRIGGER AS $$
BEGIN
    -- Logic for synchronization can be added here
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_trigger
AFTER INSERT OR UPDATE OF mensaje ON deborat_ai_logs
FOR EACH ROW EXECUTE FUNCTION sync_logs();

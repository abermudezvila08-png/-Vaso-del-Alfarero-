// Importando los módulos de Express y otros necesarios.
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken'); // Para la autenticación con tokens

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Simulación de base de datos (en memoria)
let users = [];
let feeds = [];
let chats = [];
let quizzes = [];
let stores = [];
let locations = [];

// Rutas de autenticación
app.post('/api/auth/register', (req, res) => {
    const { username, password } = req.body;
    users.push({ username, password });
    res.status(201).send('Usuario registrado exitosamente.');
});

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        const token = jwt.sign({ username }, 'secreto', { expiresIn: '1h' });
        res.json({ token });
    } else {
        res.status(401).send('Credenciales no válidas.');
    }
});

// Rutas de feeds
app.get('/api/feeds', (req, res) => {
    res.json(feeds);
});
    
app.post('/api/feeds', (req, res) => {
    feeds.push(req.body);
    res.status(201).send('Feed creado');
});

// Rutas de chat
app.get('/api/chat', (req, res) => {
    res.json(chats);
});

app.post('/api/chat', (req, res) => {
    chats.push(req.body);
    res.status(201).send('Mensaje enviado');
});

// Rutas de cuestionarios
app.get('/api/quizzes', (req, res) => {
    res.json(quizzes);
});
    
app.post('/api/quizzes', (req, res) => {
    quizzes.push(req.body);
    res.status(201).send('Cuestionario creado');
});

// Rutas de tienda
app.get('/api/stores', (req, res) => {
    res.json(stores);
});

app.post('/api/stores', (req, res) => {
    stores.push(req.body);
    res.status(201).send('Tienda creada');
});

// Rutas de geolocalización
app.get('/api/locations', (req, res) => {
    res.json(locations);
});

app.post('/api/locations', (req, res) => {
    locations.push(req.body);
    res.status(201).send('Ubicación registrada');
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
// Importar Express
const express = require('express');

// Crear la aplicación
const app = express();

// Middleware para procesar JSON
app.use(express.json());

// Base de datos simulada (array en memoria)
let tareas = [
  { id: 1, titulo: 'Aprender Node.js', completada: false },
  { id: 2, titulo: 'Crear una API REST', completada: false }
];

// RUTA 1: GET - Obtener todas las tareas
app.get('/api/tareas', (req, res) => {
  res.json(tareas);
});

// RUTA 2: GET - Obtener una tarea por ID
app.get('/api/tareas/:id', (req, res) => {
  const tarea = tareas.find(t => t.id === parseInt(req.params.id));
  
  if (!tarea) {
    return res.status(404).json({ mensaje: 'Tarea no encontrada' });
  }
  
  res.json(tarea);
});

// RUTA 3: POST - Crear una nueva tarea
app.post('/api/tareas', (req, res) => {
  const nuevaTarea = {
    id: tareas.length + 1,
    titulo: req.body.titulo,
    completada: false
  };
  
  tareas.push(nuevaTarea);
  res.status(201).json(nuevaTarea);
});

// RUTA 4: PUT - Actualizar una tarea
app.put('/api/tareas/:id', (req, res) => {
  const tarea = tareas.find(t => t.id === parseInt(req.params.id));
  
  if (!tarea) {
    return res.status(404).json({ mensaje: 'Tarea no encontrada' });
  }
  
  tarea.titulo = req.body.titulo || tarea.titulo;
  tarea.completada = req.body.completada !== undefined ? req.body.completada : tarea.completada;
  
  res.json(tarea);
});

// RUTA 5: DELETE - Eliminar una tarea
app.delete('/api/tareas/:id', (req, res) => {
  const indice = tareas.findIndex(t => t.id === parseInt(req.params.id));
  
  if (indice === -1) {
    return res.status(404).json({ mensaje: 'Tarea no encontrada' });
  }
  
  const tareaEliminada = tareas.splice(indice, 1);
  res.json(tareaEliminada[0]);
});

// Iniciar el servidor
const PUERTO = 3000;
app.listen(PUERTO, () => {
  console.log(`Servidor corriendo en http://localhost:${PUERTO}`);
});

// RUTA 6: GET - creador de la api
app.get('/api/info', (req, res) => {
  res.json(// GET /api/info
{
  "nombre": "API de Tareas",
  "version": "1.0.0",
  "autor": "stiven"
});
});
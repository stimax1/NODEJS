// inicializacion
const express = require('express');
const app = express();
app.use(express.json()); 

const PORT = process.env.PORT || 3000;

//simula una base de datos
let tareas = [
  { id: 1, titulo: "Aprender Node.js", completada: true, fechaCreacion: new Date(), fechaActualizacion: new Date() },
  { id: 2, titulo: "Hacer ejercicio", completada: false, fechaCreacion: new Date(), fechaActualizacion: new Date() },
  { id: 3, titulo: "Leer documentación", completada: false, fechaCreacion: new Date(), fechaActualizacion: new Date() }
];

//Rutas básicas (GET / y GET /api/info)
app.get('/', (req, res) => {
  res.send('Bienvenido a mi api de informacion aqui podras aprender con nosotros');
});

app.get('/api/info', (req, res) => {
  res.json({
    nombre: "API de Tareas",
    version: "1.0.0",
    autor: "Stiven Macea"
  });
});

//api tarea
app.get('/api/tareas', (req, res) => {
  const { completada } = req.query; // 
  let resultado = tareas;

  if (completada === "true") resultado = tareas.filter(t => t.completada === true);
  else if (completada === "false") resultado = tareas.filter(t => t.completada === false);

  res.json(resultado);
});

//Crear tarea (POST) con validaciones y timestamps
app.post('/api/tareas', (req, res) => {
  const { titulo } = req.body;

  // Validaciones
  if (!titulo) return res.status(400).json({ error: "El título es obligatorio" });
  if (titulo.length < 3 || titulo.length > 100) {
    return res.status(400).json({ error: "El título debe tener entre 3 y 100 caracteres" });
  }

  const nueva = {
    id: tareas.length ? tareas[tareas.length - 1].id + 1 : 1,
    titulo,
    completada: false,
    fechaCreacion: new Date(),
    fechaActualizacion: new Date()
  };

  tareas.push(nueva);
  res.status(201).json(nueva);
});

//api buscar con get
app.get('/api/tareas/buscar', (req, res) => {
  const q = (req.query.q || "").toLowerCase();
  const resultados = tareas.filter(t => t.titulo.toLowerCase().includes(q));
  res.json(resultados);
});

//Paginación en /api/tareas (page & limit)
app.get('/api/tareas', (req, res) => {
  let { page = 1, limit = 5, completada } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);

  // filtro por completada si viene
  let resultado = tareas;
  if (completada === "true") resultado = resultado.filter(t => t.completada === true);
  else if (completada === "false") resultado = resultado.filter(t => t.completada === false);

  const total = resultado.length;
  const inicio = (page - 1) * limit;
  const fin = inicio + limit;
  const data = resultado.slice(inicio, fin);

  res.json({
    data,
    pagination: {
      pagina: page,
      limite: limit,
      total,
      totalPaginas: Math.ceil(total / limit)
    }
  });
});

//Actualizar tarea (PUT) y actualizar fechaActualizacion
app.put('/api/tareas/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { titulo, completada } = req.body;

  const tarea = tareas.find(t => t.id === id);
  if (!tarea) return res.status(404).json({ error: "Tarea no encontrada" });

  if (titulo !== undefined) {
    if (titulo.length < 3 || titulo.length > 100) {
      return res.status(400).json({ error: "El título debe tener entre 3 y 100 caracteres" });
    }
    tarea.titulo = titulo;
  }

  if (completada !== undefined) tarea.completada = completada;

  tarea.fechaActualizacion = new Date();

  res.json(tarea);
});

//Middleware centralizado de errores (opcional pero recomendado)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      mensaje: err.message || "Error interno del servidor",
      estado: err.status || 500
    }
  });
});


//inicia el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

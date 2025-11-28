
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware para procesar JSON
app.use(cors());
app.use(express.json());

// Importar rutas
const platosRoutes = require('./routes/platos');
const ordenesRoutes = require('./routes/ordenes');

// Registrar rutas (después de crear app)
app.use('/api/platos', platosRoutes);
app.use('/api/ordenes', ordenesRoutes);


// ===================================
// RUTA RAÍZ - Página de bienvenida
// ===================================
app.get('/', (req, res) => {
 res.json({
   mensaje: '🎉 ¡Bienvenido a mi API de Restaurante!',
   version: '2.0.0',
   descripcion: 'Esta API permite gestionar platos usando una base de datos SQLite3',
   endpoints: {
     'GET /api/platos': 'Obtener todos los platos',
     'GET /api/platos/:id': 'Obtener un plato expesifico',
     'POST /api/platos': 'Crear un plato',
     'PUT /api/platos/:id': 'Actualizar un plato',
     'DELETE /api/platos/:id': 'Eliminar un plato'
   },
   ejemplos: {
     'Crear platos(POST)': {
       metodo: 'POST',
       url: '/api/platos',
       body: {
         nombre: 'Bandeja paisa',
         precio: 30000,
         descripcion: 'Plato típico con carne, chorizo y fríjoles'
       }
     },
     'Actualizar platos (PUT)': {
       metodo: 'PUT',
       url: '/api/platos/1',
       body: {
        nombre: 'plato actualizado',
        precio: 400000
       }
     }
   }
 });
});




// ===================================
// MANEJO DE RUTAS NO ENCONTRADAS (404)
// ===================================
app.use((req, res) => {
 res.status(404).json({
   success: false,
   mensaje: 'Ruta no encontrada',
   ruta_solicitada: req.url,
   metodo: req.method
 });
});


// ===================================
// MANEJO DE ERRORES GLOBALES
// ===================================
app.use((err, req, res, next) => {
 console.error('Error:', err.stack);
  res.status(500).json({
   success: false,
   mensaje: 'Error interno del servidor'
 });
});


// ===================================
// INICIAR EL SERVIDOR
// ===================================
const PUERTO = 3000;

app.listen(PUERTO, () => {
 console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 SERVIDOR INICIADO EXITOSAMENTE 🚀                ║
║                                                       ║
║   📡 Puerto: ${PUERTO}                                ║
║   🌐 URL: http://localhost:${PUERTO}                  ║
║   🗄️  Base de datos: SQLite3                          ║
║   📁 Archivo DB: database/restaurante.db                   ║
║                                                       ║
║   📖 Documentación: http://localhost:${PUERTO}/       ║
║                                                       ║
║   Presiona Ctrl+C para detener el servidor            ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
 `);
});



// ===================================
// ARCHIVO: database/db.js
// PROPÓSITO: Configurar la conexión a SQLite3
// ===================================


const sqlite3 = require('sqlite3').verbose();
const path = require('path');


// Ruta donde se guardará el archivo de base de datos
const DB_PATH = path.join(__dirname, 'restaurante.db');


// Crear/abrir la base de datos
const db = new sqlite3.Database(DB_PATH, (err) => {
 if (err) {
   console.error(' Error al conectar a la base de datos del restaurante:', err.message);
 } else {
   console.log(' Conectado a la base de datos del resturante');

  
   // Crear la tabla de platos
   db.run(`
     CREATE TABLE IF NOT EXISTS platos (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       nombre TEXT NOT NULL,
       precio REAL NOT NULL,
       descripcion TEXT,
       fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
       fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
     )

   `, (err) => {
     if (err) {
       console.error(' Error al crear la tabla:', err.message);
     } else {
       console.log(' Tabla "platos" lista');
      
       // Insertar datos de ejemplo si la tabla está vacía
       db.get('SELECT COUNT(*) as count FROM platos', (err, row) => {
         if (row.count === 0) {
           console.log(' Insertando datos de ejemplo...');
          
           const platosEjemplo = [
              ['Bandeja paisa', 25000, 'Plato típico colombiano'],
              ['Sancocho', 18000, 'Sopa tradicional'],
              ['Arepa con queso', 8000, 'Arepa asada con queso']
            ];
           const stmt = db.prepare('INSERT INTO platos (nombre, precio, descripcion) VALUES (?, ?, ?)'
           );
          
           platosEjemplo.forEach(platos => {
             stmt.run(platos);
           });
          
           stmt.finalize(() => {
             console.log(' Datos de ejemplo insertados');
           });
         }
       });
     }
   });
 }
});

// TABLA ORDENES
db.run(`
  CREATE TABLE IF NOT EXISTS ordenes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente TEXT NOT NULL,
    mesa TEXT,
    estado TEXT DEFAULT 'pendiente',
    total REAL DEFAULT 0,
    fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TEXT
  )
`, (err) => {
  if (err) console.log("Error creando tabla ordenes:", err.message);
  else console.log('Tabla "ordenes" lista');
});

// TABLA ORDEN_ITEMS
db.run(`
  CREATE TABLE IF NOT EXISTS orden_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orden_id INTEGER NOT NULL,
    plato_id INTEGER NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario REAL NOT NULL,
    subtotal REAL NOT NULL,
    FOREIGN KEY (orden_id) REFERENCES ordenes(id),
    FOREIGN KEY (plato_id) REFERENCES platos(id)
  )
`, (err) => {
  if (err) console.log("Error creando tabla orden_items:", err.message);
  else console.log('Tabla "orden_items" lista');
});

// Exportar la base de datos para usarla en otros archivos
module.exports = db;




const express = require('express');
const router = express.Router();
const db = require('../database/db');

// ===================================
// RUTA 1: OBTENER TODOS LOS PLATOS (READ)
// ===================================
router.get('/', (req, res) => {
 const sql = 'SELECT * FROM platos ORDER BY id ASC';

  db.all(sql, [], (err, rows) => {  
   if (err) {
     return res.status(500).json({
       success: false,
       mensaje: 'Error al obtener los platos',
       error: err.message
     });
   }
  
   res.json({
     success: true,
     cantidad: rows.length,
     datos:rows
   });
 });
});


// ===================================
// RUTA 2: OBTENER UN PLATO POR ID (READ)
// ===================================
router.get('/:id', (req, res) => {
 const { id } = req.params;

 const sql = 'SELECT * FROM platos WHERE id = ?';

  db.get(sql, [id], (err, row) => {
   if (err) {
     return res.status(500).json({
       success: false,
       mensaje: 'Error al buscar el plato',
       error: err.message
     });
   }
  
   if (!row) {
     return res.status(404).json({
       success: false,
       mensaje: `No se encontró ningun plato con este ID ${id}`
     });
   }
  
   res.json({
     success: true,
     datos: row
   });
 });
});


// ===================================
// RUTA 3: CREAR UN NUEVO PLATO (CREATE)
// ===================================
router.post('/', (req, res) => {
 const { nombre, precio, descripcion } = req.body;
  // Validar que el nombre del plato exista 
 if (!nombre) {
   return res.status(400).json({
     success: false,
     mensaje: 'El nombre del plato es obligatorio'
   });
 }
// validar que tenga el precio  
 if (precio === undefined || isNaN(Number(precio))){
    return res. status(400).json({
       success:false,
       mensaje: 'El precio es obligatorio y debe ser un numero'
    }); 
 }
  const sql = 'INSERT INTO Platos (nombre, precio, descripcion) VALUES (?, ?, ?)';
  db.run(sql, [nombre, Number(precio), descripcion || ''], function(err) {
   if (err) {
     return res.status(500).json({
       success: false,
       mensaje: 'Error al crear el plato',
       error: err.message
     });
   }
  
   // this.lastID contiene el ID de la fila insertada
   const sqlSelect = 'SELECT * FROM platos WHERE id = ?';
  
   db.get(sqlSelect, [this.lastID], (err, row) => {
     if (err) {
       return res.status(500).json({
         success: false,
         mensaje: 'plato creado pero error al obtenerlo',
         error: err.message
       });
     }
    
     res.status(201).json({
       success: true,
       mensaje: 'plato creado exitosamente',
       datos: row
     });
   });
 });
});


// ===================================
// RUTA 4: ACTUALIZAR UN PLATO (UPDATE)
// ===================================
router.put('/:id', (req, res) => {
 const { id } = req.params;
 const { nombre, precio, descripcion, } = req.body;
  // Primero verificar que la tarea existe
 db.get('SELECT * FROM platos WHERE id = ?', [id], (err, row) => {
   if (err) {
     return res.status(500).json({
       success: false,
       mensaje: 'Error al buscar el plato',
       error: err.message
     });
   }
  
   if (!row) {
     return res.status(404).json({
       success: false,
       mensaje: `No se encontró ninguna tarea con el ID ${id}`
     });
   }
  
   // Construir la consulta SQL dinámicamente
   let campos = [];
   let valores = [];
  
   if (nombre !== undefined) {
     campos.push('nombre = ?');
     valores.push(nombre);
   }

   if (precio !== undefined) {
      if (isNaN(Number(precio))) {
        return res.status(400).json({
          success: false,
          mensaje: 'El precio debe ser un número'
        });
      }
            campos.push('precio = ?');
      valores.push(Number(precio));
    }
  
   if (descripcion !== undefined) {
     campos.push('descripcion = ?');
     valores.push(descripcion);
   }
      if (campos.length === 0) {
      return res.status(400).json({
        success: false,
        mensaje: 'No se enviaron campos para actualizar'
      });
    }
  
   // Agregar fecha de actualización ---------------------------------
   campos.push('fecha_actualizacion = CURRENT_TIMESTAMP');
   valores.push(id);
  
   const sql = `UPDATE platos SET ${campos.join(', ')} WHERE id = ?`;
  
   db.run(sql, valores, function(err) {
     if (err) {
       return res.status(500).json({
         success: false,
         mensaje: 'Error al actualizar el platos',
         error: err.message
       });
     }
    
     // Obtener la tarea actualizada
     db.get('SELECT * FROM platos WHERE id = ?', [id], (err, rowActualizado) => {
       if (err) {
         return res.status(500).json({
           success: false,
           mensaje: 'plato actualizado pero error al obtenerlo',
           error: err.message
         });
       }
      
       res.json({
         success: true,
         mensaje: 'plato actualizado exitosamente',
         datos: rowActualizado
       });
     });
   });
 });
});


// ===================================
// RUTA 5: ELIMINAR UNA PLATOS (DELETE)
// ===================================
router.delete('/:id', (req, res) => {
 const { id } = req.params;
  // Primero obtener la tarea para devolverla después
 db.get('SELECT * FROM platos WHERE id = ?', [id], (err, row) => {
   if (err) {
     return res.status(500).json({
       success: false,
       mensaje: 'Error al eliminar el plato',
       error: err.message
     });
   }
  
   if (!row) {
     return res.status(404).json({
       success: false,
       mensaje: `No existe un plato con el ID  ${id}`
     });
   }
  
   // Eliminar platos
   const sql = 'DELETE FROM platos WHERE id = ?';
  
   db.run(sql, [id], function(err) {
     if (err) {
       return res.status(500).json({
         success: false,
         mensaje: 'Error al eliminar el plato',
         error: err.message
       });
     }
    
     res.json({
       success: true,
       mensaje: 'Plato eliminado exitosamente',
       datos: row
     });
   });
 });
});


// Exportar el router
module.exports = router;

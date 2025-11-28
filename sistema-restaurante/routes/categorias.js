const express = require('express');
const router = express.Router();
const db = require('../database/db');

function resOK(res, mensaje, datos) {
  return res.status(200).json({ success: true, mensaje, datos });
}
function resCreated(res, mensaje, datos) {
  return res.status(201).json({ success: true, mensaje, datos });
}
function resError(res, status, mensaje) {
  return res.status(status).json({ success: false, mensaje });
}

router.get('/', (req, res) => {
  db.all('SELECT * FROM categorias', (err, rows) => {
    if (err) return resError(res, 500, 'Error al obtener categorías');
    return resOK(res, 'Categorías obtenidas', rows);
  });
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return resError(res, 400, 'ID inválido');
  db.get('SELECT * FROM categorias WHERE id = ?', [id], (err, row) => {
    if (err) return resError(res, 500, 'Error al buscar categoría');
    if (!row) return resError(res, 404, 'Categoría no encontrada');
    return resOK(res, 'Categoría encontrada', row);
  });
});

router.post('/', (req, res) => {
  const { nombre, descripcion } = req.body;
  if (!nombre || nombre.toString().trim() === '') return resError(res, 400, 'El campo nombre es requerido');
  db.run('INSERT INTO categorias (nombre, descripcion) VALUES (?,?)', [nombre, descripcion || null], function(err) {
    if (err) return resError(res, 500, 'Error al crear categoría');
    db.get('SELECT * FROM categorias WHERE id = ?', [this.lastID], (e, row) => {
      if (e) return resError(res, 500, 'Error al obtener la categoría creada');
      return resCreated(res, 'Categoría creada', row);
    });
  });
});

router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const { nombre, descripcion } = req.body;
  if (!Number.isInteger(id)) return resError(res, 400, 'ID inválido');
  if (!nombre || nombre.toString().trim() === '') return resError(res, 400, 'El campo nombre es requerido');
  db.get('SELECT * FROM categorias WHERE id = ?', [id], (err, row) => {
    if (err) return resError(res, 500, 'Error al buscar categoría');
    if (!row) return resError(res, 404, 'Categoría no encontrada');
    db.run('UPDATE categorias SET nombre = ?, descripcion = ? WHERE id = ?', [nombre, descripcion || null, id], function(e) {
      if (e) return resError(res, 500, 'Error al actualizar categoría');
      db.get('SELECT * FROM categorias WHERE id = ?', [id], (ee, updated) => {
        if (ee) return resError(res, 500, 'Error al obtener categoría actualizada');
        return resOK(res, 'Categoría actualizada', updated);
      });
    });
  });
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return resError(res, 400, 'ID inválido');
  db.get('SELECT COUNT(*) AS cnt FROM platos WHERE categoria_id = ?', [id], (err, row) => {
    if (err) return resError(res, 500, 'Error al verificar relaciones');
    if (row.cnt > 0) return resError(res, 400, 'No se puede eliminar la categoría: tiene platos asociados');
    db.run('DELETE FROM categorias WHERE id = ?', [id], function(e) {
      if (e) return resError(res, 500, 'Error al eliminar categoría');
      if (this.changes === 0) return resError(res, 404, 'Categoría no encontrada');
      return resOK(res, 'Categoría eliminada', { id });
    });
  });
});

module.exports = router;

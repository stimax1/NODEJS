const express = require('express');
const router = express.Router();
const db = require('../database/db');

// ===============================
// RESPUESTAS ESTÁNDAR
// ===============================
function resOK(res, mensaje, datos) {
  return res.status(200).json({ success: true, mensaje, datos });
}

function resCreated(res, mensaje, datos) {
  return res.status(201).json({ success: true, mensaje, datos });
}

function resError(res, status, mensaje) {
  return res.status(status).json({ success: false, mensaje });
}

// ===============================
// GET TODAS LAS ÓRDENES
// ===============================
router.get('/', (req, res) => {
  db.all('SELECT * FROM ordenes ORDER BY fecha_creacion DESC', (err, rows) => {
    if (err) return resError(res, 500, 'Error al obtener las órdenes');
    return resOK(res, 'Órdenes obtenidas', rows);
  });
});

// ===============================
// GET ORDEN POR ID
// ===============================
router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return resError(res, 400, 'ID inválido');

  db.get('SELECT * FROM ordenes WHERE id = ?', [id], (err, orden) => {
    if (err) return resError(res, 500, 'Error al buscar orden');
    if (!orden) return resError(res, 404, 'Orden no encontrada');

    db.all(
      `SELECT oi.*, p.nombre AS nombre_plato, p.precio AS precio_actual 
       FROM orden_items oi 
       LEFT JOIN platos p ON oi.plato_id = p.id 
       WHERE orden_id = ?`,
      [id],
      (e, items) => {
        if (e) return resError(res, 500, 'Error al obtener items');
        orden.items = items;
        return resOK(res, 'Orden encontrada', orden);
      }
    );
  });
});

// ===============================
// CREAR ORDEN 
// ===============================
router.post('/', (req, res) => {
  const { cliente, mesa, items } = req.body;

  if (!cliente)
    return resError(res, 400, 'El nombre del cliente es obligatorio');

  // ➤ Permitir 1 item o varios
  let itemsList = items;
  if (!Array.isArray(itemsList)) {
    itemsList = [itemsList];
  }

  if (itemsList.length === 0)
    return resError(res, 400, 'La orden debe tener al menos un ítem');

  const platoIds = itemsList.map(i => i.plato_id);
  const placeholders = platoIds.map(() => '?').join(',');

  db.all(
    `SELECT id, precio FROM platos WHERE id IN (${placeholders})`,
    platoIds,
    (err, rows) => {
      if (err) return resError(res, 500, 'Error al validar platos');
      if (rows.length !== platoIds.length)
        return resError(res, 400, 'Algunos platos no existen');

      db.run(
        'INSERT INTO ordenes (cliente, mesa, total, estado) VALUES (?,?,?,?)',
        [cliente, mesa || null, 0, 'pendiente'],
        function (err2) {
          if (err2) {
              console.error("SQL ERROR AL CREAR ORDEN:", err2);
              return resError(res, 500, 'Error al crear orden');
              }

          const ordenId = this.lastID;
          let total = 0;

          const stmt = db.prepare(
            `INSERT INTO orden_items (orden_id, plato_id, cantidad, precio_unitario, subtotal)
             VALUES (?,?,?,?,?)`
          );

          for (const item of itemsList) {
            const plato = rows.find(r => r.id === item.plato_id);
            const cantidad = Number(item.cantidad) || 1;
            const precioUnit = plato.precio;
            const subtotal = precioUnit * cantidad;
            total += subtotal;

            stmt.run(ordenId, item.plato_id, cantidad, precioUnit, subtotal);
          }

          stmt.finalize(err3 => {
            if (err3) return resError(res, 500, 'Error al insertar items');

            db.run(
              'UPDATE ordenes SET total = ? WHERE id = ?',
              [total, ordenId],
              err4 => {
                if (err4) return resError(res, 500, 'Error al actualizar total');

                db.get('SELECT * FROM ordenes WHERE id = ?', [ordenId], (err5, orden) => {
                  if (err5) return resError(res, 500, 'Error al obtener la orden creada');

                  db.all(
                    `SELECT oi.*, p.nombre AS nombre_plato
                     FROM orden_items oi
                     LEFT JOIN platos p ON oi.plato_id = p.id
                     WHERE orden_id = ?`,
                    [ordenId],
                    (err6, itemsRows) => {
                      if (err6) return resError(res, 500, 'Error al obtener items');

                      orden.items = itemsRows;
                      return resCreated(res, 'Orden creada correctamente', orden);
                    }
                  );
                });
              }
            );
          });
        }
      );
    }
  );
});

// ===============================
// ACTUALIZAR TODA LA ORDEN (cliente, mesa, items, estado)
// ===============================
router.put('/:id', (req, res) => {
  const ordenId = Number(req.params.id);
  const { cliente, mesa, estado, items } = req.body;

  if (!cliente) return resError(res, 400, 'El cliente es obligatorio');

  if (!Array.isArray(items) || items.length === 0)
    return resError(res, 400, 'La orden debe tener ítems');

  const estadosValidos = ['pendiente', 'preparando', 'listo', 'entregado', 'cancelado'];
  if (estado && !estadosValidos.includes(estado))
    return resError(res, 400, 'Estado inválido');

  // Validar que el ID exista
  db.get('SELECT * FROM ordenes WHERE id = ?', [ordenId], (err, existe) => {
    if (err) return resError(res, 500, 'Error al buscar la orden');
    if (!existe) return resError(res, 404, 'Orden no encontrada');

    // Validar platos
    const platoIds = items.map(i => i.plato_id);
    const placeholders = platoIds.map(() => '?').join(',');

    db.all(`SELECT id, precio FROM platos WHERE id IN (${placeholders})`, platoIds, (err2, platosBD) => {
      if (err2) return resError(res, 500, 'Error validando platos');

      if (platosBD.length !== items.length)
        return resError(res, 400, 'Uno o más platos no existen');

      // Actualizar datos de la orden
      db.run(
        `UPDATE ordenes SET cliente = ?, mesa = ?, estado = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?`,
        [cliente, mesa, estado || existe.estado, ordenId],
        err3 => {
          if (err3) return resError(res, 500, 'Error actualizando orden');

          // Borrar items viejos
          db.run(`DELETE FROM orden_items WHERE orden_id = ?`, [ordenId], err4 => {
            if (err4) return resError(res, 500, 'Error borrando ítems anteriores');

            const stmt = db.prepare(
              `INSERT INTO orden_items (orden_id, plato_id, cantidad, precio_unitario, subtotal)
               VALUES (?, ?, ?, ?, ?)`
            );

            let total = 0;

            // Insertar los nuevos ítems
            items.forEach(item => {
              const plato = platosBD.find(p => p.id === item.plato_id);
              const cantidad = item.cantidad || 1;
              const precio = plato.precio;
              const subtotal = precio * cantidad;

              total += subtotal;

              stmt.run(ordenId, item.plato_id, cantidad, precio, subtotal);
            });

            stmt.finalize(err5 => {
              if (err5) return resError(res, 500, 'Error guardando nuevos ítems');

              // Actualizar total
              db.run(`UPDATE ordenes SET total = ? WHERE id = ?`, [total, ordenId], err6 => {
                if (err6) return resError(res, 500, 'Error actualizando total');

                // Devolver la orden actualizada con items
                db.get('SELECT * FROM ordenes WHERE id = ?', [ordenId], (err7, ordenFinal) => {
                  if (err7) return resError(res, 500, 'Error obteniendo orden actualizada');

                  db.all(
                    `SELECT oi.*, p.nombre AS nombre_plato
                     FROM orden_items oi
                     LEFT JOIN platos p ON oi.plato_id = p.id
                     WHERE orden_id = ?`,
                    [ordenId],
                    (err8, itemsFinales) => {
                      if (err8) return resError(res, 500, 'Error obteniendo items');

                      ordenFinal.items = itemsFinales;

                      return resOK(res, 'Orden actualizada correctamente', ordenFinal);
                    }
                  );
                });
              });
            });
          });
        }
      );
    });
  });
});

// ===============================
// ELIMINAR ORDEN
// ===============================
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);

  db.run('DELETE FROM orden_items WHERE orden_id = ?', [id], err1 => {
    if (err1) return resError(res, 500, 'Error al eliminar items');

    db.run('DELETE FROM ordenes WHERE id = ?', [id], function (err2) {
      if (err2) return resError(res, 500, 'Error al eliminar la orden');
      if (this.changes === 0) return resError(res, 404, 'Orden no encontrada');

      return resOK(res, 'Orden eliminada correctamente', { id });
    });
  });
});

module.exports = router;

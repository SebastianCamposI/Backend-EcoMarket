const express = require('express');
const { executeQueryAll, executeQueryOne, executeNonQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateWaste, sanitizeInput } = require('../middleware/validation');

const router = express.Router();

// Aplicar sanitización a todas las rutas
router.use(sanitizeInput);

// Obtener todos los desechos (con filtros opcionales y paginación)
router.get('/', async (req, res) => {
  try {
    const { category, status, search, location, page = 1, limit = 12 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let query = `
      SELECT w.*, u.company_name, u.location as user_location
      FROM wastes w
      INNER JOIN users u ON w.user_id = u.id
      WHERE 1=1
    `;
    const params = {};

    if (category) {
      query += ' AND w.category = @category';
      params.category = category;
    }

    if (status) {
      query += ' AND w.status = @status';
      params.status = status;
    } else {
      query += ' AND w.status = @status';
      params.status = 'available';
    }

    if (search) {
      query += ' AND (w.title LIKE @search OR w.description LIKE @search)';
      params.search = `%${search}%`;
    }

    if (location) {
      query += ' AND (w.location LIKE @location OR u.location LIKE @location)';
      params.location = `%${location}%`;
    }

    // Contar total de registros (sin paginación)
    let countQuery = `
      SELECT COUNT(*) as total
      FROM wastes w
      INNER JOIN users u ON w.user_id = u.id
      WHERE 1=1
    `;
    const countParams = {};
    
    if (category) {
      countQuery += ' AND w.category = @category';
      countParams.category = category;
    }
    if (status) {
      countQuery += ' AND w.status = @status';
      countParams.status = status;
    } else {
      countQuery += ' AND w.status = @status';
      countParams.status = 'available';
    }
    if (search) {
      countQuery += ' AND (w.title LIKE @search OR w.description LIKE @search)';
      countParams.search = `%${search}%`;
    }
    if (location) {
      countQuery += ' AND (w.location LIKE @location OR u.location LIKE @location)';
      countParams.location = `%${location}%`;
    }
    
    const countResult = await executeQueryOne(countQuery, countParams);
    const total = countResult ? countResult.total : 0;

    // Agregar paginación
    query += ' ORDER BY w.created_at DESC';
    query += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
    params.offset = offset;
    params.limit = limitNum;

    const wastes = await executeQueryAll(query, params);

    res.json({
      wastes,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error obteniendo desechos:', error);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
});

// Obtener un desecho específico
router.get('/:id', async (req, res) => {
  try {
    const waste = await executeQueryOne(
      `SELECT w.*, u.company_name, u.location as user_location, u.phone, u.email
       FROM wastes w
       INNER JOIN users u ON w.user_id = u.id
       WHERE w.id = @id`,
      { id: req.params.id }
    );

    if (!waste) {
      return res.status(404).json({ error: 'Desecho no encontrado' });
    }

    res.json(waste);
  } catch (error) {
    console.error('Error obteniendo desecho:', error);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
});

// Crear un nuevo desecho (requiere autenticación)
router.post('/', authenticateToken, validateWaste, async (req, res) => {
  try {
    const { title, description, category, quantity, unit, location, price, image_url } = req.body;

    const insertResult = await executeNonQuery(
      `INSERT INTO wastes (user_id, title, description, category, quantity, unit, location, price, image_url, status)
       OUTPUT INSERTED.*
       VALUES (@user_id, @title, @description, @category, @quantity, @unit, @location, @price, @image_url, 'available')`,
      {
        user_id: req.user.id,
        title,
        description,
        category,
        quantity,
        unit,
        location: location || null,
        price: price || null,
        image_url: image_url || null
      }
    );

    const waste = insertResult.recordset[0];
    res.status(201).json({ message: 'Desecho publicado exitosamente', waste });
  } catch (error) {
    console.error('Error creando desecho:', error);
    res.status(500).json({ error: 'Error al crear desecho' });
  }
});

// Actualizar un desecho (solo el propietario)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, description, category, quantity, unit, location, price, image_url, status } = req.body;

    // Verificar que el desecho pertenece al usuario
    const waste = await executeQueryOne(
      'SELECT user_id FROM wastes WHERE id = @id',
      { id: req.params.id }
    );

    if (!waste) {
      return res.status(404).json({ error: 'Desecho no encontrado' });
    }

    if (waste.user_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para actualizar este desecho' });
    }

    await executeNonQuery(
      `UPDATE wastes 
       SET title = @title, description = @description, category = @category, 
           quantity = @quantity, unit = @unit, location = @location, 
           price = @price, image_url = @image_url, status = @status
       WHERE id = @id`,
      {
        title,
        description,
        category,
        quantity,
        unit,
        location: location || null,
        price: price || null,
        image_url: image_url || null,
        status: status || 'available',
        id: req.params.id
      }
    );

    const updatedWaste = await executeQueryOne(
      'SELECT * FROM wastes WHERE id = @id',
      { id: req.params.id }
    );

    res.json({ message: 'Desecho actualizado exitosamente', waste: updatedWaste });
  } catch (error) {
    console.error('Error actualizando desecho:', error);
    res.status(500).json({ error: 'Error al actualizar desecho' });
  }
});

// Eliminar un desecho (solo el propietario)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Verificar que el desecho pertenece al usuario
    const waste = await executeQueryOne(
      'SELECT user_id FROM wastes WHERE id = @id',
      { id: req.params.id }
    );

    if (!waste) {
      return res.status(404).json({ error: 'Desecho no encontrado' });
    }

    if (waste.user_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este desecho' });
    }

    // Eliminar favoritos asociados primero (debido a la restricción de FK)
    await executeNonQuery(
      'DELETE FROM favorites WHERE waste_id = @id',
      { id: req.params.id }
    );

    // Luego eliminar el desecho
    await executeNonQuery(
      'DELETE FROM wastes WHERE id = @id',
      { id: req.params.id }
    );

    res.json({ message: 'Desecho eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando desecho:', error);
    res.status(500).json({ error: 'Error al eliminar desecho' });
  }
});

// Obtener desechos del usuario autenticado
router.get('/my/wastes', authenticateToken, async (req, res) => {
  try {
    const wastes = await executeQueryAll(
      'SELECT * FROM wastes WHERE user_id = @user_id ORDER BY created_at DESC',
      { user_id: req.user.id }
    );
    res.json(wastes);
  } catch (error) {
    console.error('Error obteniendo mis desechos:', error);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
});

module.exports = router;

const express = require('express');
const { executeQueryOne, executeNonQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { sanitizeInput } = require('../middleware/validation');

const router = express.Router();

// Aplicar sanitización a todas las rutas
router.use(sanitizeInput);

// Obtener perfil del usuario autenticado
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await executeQueryOne(
      'SELECT id, email, company_name, description, location, phone, website, created_at FROM users WHERE id = @id',
      { id: req.user.id }
    );

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
});

// Actualizar perfil
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { company_name, description, location, phone, website } = req.body;

    await executeNonQuery(
      `UPDATE users 
       SET company_name = @company_name, description = @description, location = @location, 
           phone = @phone, website = @website 
       WHERE id = @id`,
      {
        company_name,
        description: description || null,
        location: location || null,
        phone: phone || null,
        website: website || null,
        id: req.user.id
      }
    );

    const updatedUser = await executeQueryOne(
      'SELECT id, email, company_name, description, location, phone, website FROM users WHERE id = @id',
      { id: req.user.id }
    );

    res.json({ message: 'Perfil actualizado exitosamente', user: updatedUser });
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

// Obtener perfil público de un usuario
router.get('/:id', async (req, res) => {
  try {
    const user = await executeQueryOne(
      'SELECT id, company_name, description, location, phone, website, created_at FROM users WHERE id = @id',
      { id: req.params.id }
    );

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
});

module.exports = router;

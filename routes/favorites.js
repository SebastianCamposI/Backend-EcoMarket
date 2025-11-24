const express = require('express');
const { executeQueryAll, executeQueryOne, executeNonQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener favoritos del usuario
router.get('/', async (req, res) => {
  try {
    const favorites = await executeQueryAll(
      `SELECT w.*, u.company_name, u.location as user_location, f.created_at as favorited_at
       FROM favorites f
       INNER JOIN wastes w ON f.waste_id = w.id
       INNER JOIN users u ON w.user_id = u.id
       WHERE f.user_id = @user_id
       ORDER BY f.created_at DESC`,
      { user_id: req.user.id }
    );
    res.json(favorites);
  } catch (error) {
    console.error('Error obteniendo favoritos:', error);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
});

// Agregar a favoritos
router.post('/:wasteId', async (req, res) => {
  try {
    const { wasteId } = req.params;

    // Verificar que el desecho existe
    const waste = await executeQueryOne(
      'SELECT id FROM wastes WHERE id = @wasteId',
      { wasteId: parseInt(wasteId) }
    );

    if (!waste) {
      return res.status(404).json({ error: 'Desecho no encontrado' });
    }

    // Verificar si ya está en favoritos
    const existing = await executeQueryOne(
      'SELECT id FROM favorites WHERE user_id = @user_id AND waste_id = @wasteId',
      { user_id: req.user.id, wasteId: parseInt(wasteId) }
    );

    if (existing) {
      return res.status(400).json({ error: 'Ya está en favoritos' });
    }

    // Agregar a favoritos
    await executeNonQuery(
      'INSERT INTO favorites (user_id, waste_id) VALUES (@user_id, @wasteId)',
      { user_id: req.user.id, wasteId: parseInt(wasteId) }
    );

    res.json({ message: 'Agregado a favoritos exitosamente' });
  } catch (error) {
    console.error('Error agregando a favoritos:', error);
    res.status(500).json({ error: 'Error al agregar a favoritos' });
  }
});

// Eliminar de favoritos
router.delete('/:wasteId', async (req, res) => {
  try {
    const { wasteId } = req.params;

    await executeNonQuery(
      'DELETE FROM favorites WHERE user_id = @user_id AND waste_id = @wasteId',
      { user_id: req.user.id, wasteId: parseInt(wasteId) }
    );

    res.json({ message: 'Eliminado de favoritos exitosamente' });
  } catch (error) {
    console.error('Error eliminando de favoritos:', error);
    res.status(500).json({ error: 'Error al eliminar de favoritos' });
  }
});

// Verificar si un desecho está en favoritos
router.get('/check/:wasteId', async (req, res) => {
  try {
    const { wasteId } = req.params;

    const favorite = await executeQueryOne(
      'SELECT id FROM favorites WHERE user_id = @user_id AND waste_id = @wasteId',
      { user_id: req.user.id, wasteId: parseInt(wasteId) }
    );

    res.json({ isFavorite: !!favorite });
  } catch (error) {
    console.error('Error verificando favorito:', error);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
});

module.exports = router;


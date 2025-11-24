const express = require('express');
const { executeQueryOne, executeQueryAll } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener estadísticas del dashboard
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;

    // Estadísticas de publicaciones
    const myWastesStats = await executeQueryOne(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) as reserved,
        SUM(CASE WHEN status = 'sold' THEN 1 ELSE 0 END) as sold
       FROM wastes WHERE user_id = @userId`,
      { userId }
    );

    // Estadísticas de favoritos
    const favoritesStats = await executeQueryOne(
      'SELECT COUNT(*) as total FROM favorites WHERE user_id = @userId',
      { userId }
    );


    // Estadísticas generales del marketplace
    const marketplaceStats = await executeQueryOne(
      `SELECT 
        COUNT(*) as totalWastes,
        COUNT(DISTINCT user_id) as totalUsers,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as availableWastes
       FROM wastes`
    );

    // Desechos por categoría
    const categoryStats = await executeQueryAll(
      `SELECT category, COUNT(*) as count 
       FROM wastes 
       WHERE status = 'available'
       GROUP BY category 
       ORDER BY count DESC`
    );

    res.json({
      myWastes: myWastesStats || { total: 0, available: 0, reserved: 0, sold: 0 },
      favorites: favoritesStats || { total: 0 },
      marketplace: marketplaceStats || { totalWastes: 0, totalUsers: 0, availableWastes: 0 },
      categories: categoryStats || []
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
});

module.exports = router;


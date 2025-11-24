// Middleware centralizado para manejo de errores

const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Errores de SQL Server
  if (err.code === 'ELOGIN') {
    return res.status(500).json({ 
      error: 'Error de conexión con la base de datos',
      message: 'No se pudo conectar con SQL Server. Verifica las credenciales.'
    });
  }

  if (err.code === 'EREQUEST') {
    return res.status(500).json({ 
      error: 'Error en la consulta a la base de datos',
      message: 'Error al ejecutar la consulta SQL'
    });
  }

  // Errores de validación
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Error de validación',
      details: err.message 
    });
  }

  // Errores JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      error: 'Token inválido' 
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ 
      error: 'Token expirado' 
    });
  }

  // Error por defecto
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'development' 
    ? err.message 
    : 'Error interno del servidor';

  res.status(statusCode).json({ 
    error: message 
  });
};

// Middleware para rutas no encontradas
const notFoundHandler = (req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    path: req.path 
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};


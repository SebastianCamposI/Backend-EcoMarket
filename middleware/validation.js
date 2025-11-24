// Middleware de validación de datos

// Validar email
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validar contraseña (mínimo 6 caracteres)
const validatePassword = (password) => {
  return password && password.length >= 6;
};

// Validar registro de usuario
const validateRegister = (req, res, next) => {
  const { email, password, company_name } = req.body;
  const errors = [];

  if (!email || !validateEmail(email)) {
    errors.push('Email inválido');
  }

  if (!password || !validatePassword(password)) {
    errors.push('La contraseña debe tener al menos 6 caracteres');
  }

  if (!company_name || company_name.trim().length < 2) {
    errors.push('El nombre de la empresa debe tener al menos 2 caracteres');
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Datos inválidos',
      details: errors 
    });
  }

  next();
};

// Validar login
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !validateEmail(email)) {
    errors.push('Email inválido');
  }

  if (!password) {
    errors.push('La contraseña es requerida');
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Datos inválidos',
      details: errors 
    });
  }

  next();
};

// Validar creación de desecho
const validateWaste = (req, res, next) => {
  const { title, description, category, quantity, unit } = req.body;
  const errors = [];

  if (!title || title.trim().length < 3) {
    errors.push('El título debe tener al menos 3 caracteres');
  }

  if (!description || description.trim().length < 10) {
    errors.push('La descripción debe tener al menos 10 caracteres');
  }

  const validCategories = ['textil', 'madera', 'plastico', 'metal', 'papel', 'vidrio', 'organico', 'electronico', 'otro'];
  if (!category || !validCategories.includes(category)) {
    errors.push('Categoría inválida');
  }

  if (!quantity || quantity.trim().length === 0) {
    errors.push('La cantidad es requerida');
  }

  if (!unit || unit.trim().length === 0) {
    errors.push('La unidad es requerida');
  }

  if (req.body.price && (isNaN(req.body.price) || req.body.price < 0)) {
    errors.push('El precio debe ser un número positivo');
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Datos inválidos',
      details: errors 
    });
  }

  next();
};

// Sanitizar strings (remover espacios extras)
const sanitizeString = (str) => {
  if (!str) return null;
  return str.trim();
};

// Middleware para sanitizar datos
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    });
  }
  next();
};

module.exports = {
  validateEmail,
  validatePassword,
  validateRegister,
  validateLogin,
  validateWaste,
  sanitizeInput
};


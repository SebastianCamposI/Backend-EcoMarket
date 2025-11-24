const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { executeQueryOne, executeNonQuery } = require('../config/database');
const { JWT_SECRET } = require('../middleware/auth');
const { validateRegister, validateLogin, sanitizeInput } = require('../middleware/validation');

const router = express.Router();

// Aplicar sanitización a todas las rutas
router.use(sanitizeInput);

// Registro de usuario/empresa
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { email, password, company_name, description, location, phone, website } = req.body;

    // Verificar si el email ya existe
    const existingUser = await executeQueryOne(
      'SELECT id FROM users WHERE email = @email',
      { email }
    );

    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar nuevo usuario
    const insertResult = await executeNonQuery(
      `INSERT INTO users (email, password, company_name, description, location, phone, website) 
       OUTPUT INSERTED.id, INSERTED.email, INSERTED.company_name, INSERTED.description, INSERTED.location, INSERTED.phone, INSERTED.website
       VALUES (@email, @password, @company_name, @description, @location, @phone, @website)`,
      {
        email,
        password: hashedPassword,
        company_name,
        description: description || null,
        location: location || null,
        phone: phone || null,
        website: website || null
      }
    );

    const newUser = insertResult.recordset[0];

    // Generar token
    const token = jwt.sign(
      { id: newUser.id, email, company_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        company_name: newUser.company_name,
        description: newUser.description,
        location: newUser.location,
        phone: newUser.phone,
        website: newUser.website
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Login
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await executeQueryOne(
      'SELECT * FROM users WHERE email = @email',
      { email }
    );

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token
    const token = jwt.sign(
      { id: user.id, email: user.email, company_name: user.company_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        email: user.email,
        company_name: user.company_name,
        description: user.description,
        location: user.location,
        phone: user.phone,
        website: user.website
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

module.exports = router;

const sql = require('mssql');

let pool = null;

const config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'EcoMarketplace',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true', // Usar true para Azure
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true', // true para desarrollo local
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

const init = async () => {
  try {
    pool = await sql.connect(config);
    console.log('Conectado a SQL Server');
    await createTables();
    return pool;
  } catch (err) {
    console.error('Error al conectar con SQL Server:', err);
    throw err;
  }
};

const createTables = async () => {
  try {
    const request = pool.request();
    
    // Crear tabla de usuarios/empresas
    await request.query(`
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND type in (N'U'))
      BEGIN
        CREATE TABLE [dbo].[users] (
          [id] INT IDENTITY(1,1) PRIMARY KEY,
          [email] NVARCHAR(255) UNIQUE NOT NULL,
          [password] NVARCHAR(255) NOT NULL,
          [company_name] NVARCHAR(255) NOT NULL,
          [description] NVARCHAR(MAX),
          [location] NVARCHAR(255),
          [phone] NVARCHAR(50),
          [website] NVARCHAR(255),
          [created_at] DATETIME DEFAULT GETDATE()
        )
      END
    `);

    // Crear tabla de desechos/materias primas
    await request.query(`
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[wastes]') AND type in (N'U'))
      BEGIN
        CREATE TABLE [dbo].[wastes] (
          [id] INT IDENTITY(1,1) PRIMARY KEY,
          [user_id] INT NOT NULL,
          [title] NVARCHAR(255) NOT NULL,
          [description] NVARCHAR(MAX) NOT NULL,
          [category] NVARCHAR(50) NOT NULL,
          [quantity] NVARCHAR(50) NOT NULL,
          [unit] NVARCHAR(50) NOT NULL,
          [location] NVARCHAR(255),
          [price] DECIMAL(10,2),
          [status] NVARCHAR(20) DEFAULT 'available',
          [image_url] NVARCHAR(500),
          [created_at] DATETIME DEFAULT GETDATE(),
          FOREIGN KEY ([user_id]) REFERENCES [users]([id]) ON DELETE CASCADE
        )
      END
    `);

    // Crear tabla de favoritos
    await request.query(`
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[favorites]') AND type in (N'U'))
      BEGIN
        CREATE TABLE [dbo].[favorites] (
          [id] INT IDENTITY(1,1) PRIMARY KEY,
          [user_id] INT NOT NULL,
          [waste_id] INT NOT NULL,
          [created_at] DATETIME DEFAULT GETDATE(),
          FOREIGN KEY ([user_id]) REFERENCES [users]([id]) ON DELETE CASCADE,
          FOREIGN KEY ([waste_id]) REFERENCES [wastes]([id]) ON DELETE NO ACTION,
          UNIQUE([user_id], [waste_id])
        )
      END
    `);

    console.log('Tablas creadas/verificadas exitosamente');
  } catch (err) {
    console.error('Error al crear tablas:', err);
    throw err;
  }
};

const getDb = () => {
  if (!pool) {
    throw new Error('Base de datos no inicializada. Llama a init() primero.');
  }
  return pool;
};

// Función helper para ejecutar queries
const executeQuery = async (query, params = {}) => {
  try {
    const request = pool.request();
    
    // Agregar parámetros
    Object.keys(params).forEach(key => {
      const value = params[key];
      // Manejar diferentes tipos de datos
      if (value === null || value === undefined) {
        request.input(key, sql.NVarChar, null);
      } else if (typeof value === 'number') {
        // Si es un número decimal (precio)
        if (key === 'price' || (value % 1 !== 0)) {
          request.input(key, sql.Decimal(10, 2), value);
        } else {
          request.input(key, sql.Int, value);
        }
      } else if (typeof value === 'string' && value.length > 4000) {
        request.input(key, sql.NVarChar(sql.MAX), value);
      } else {
        request.input(key, value);
      }
    });
    
    const result = await request.query(query);
    return result;
  } catch (err) {
    console.error('Error ejecutando query:', err);
    throw err;
  }
};

// Función helper para obtener un solo registro
const executeQueryOne = async (query, params = {}) => {
  try {
    const result = await executeQuery(query, params);
    return result.recordset[0] || null;
  } catch (err) {
    throw err;
  }
};

// Función helper para obtener múltiples registros
const executeQueryAll = async (query, params = {}) => {
  try {
    const result = await executeQuery(query, params);
    return result.recordset || [];
  } catch (err) {
    throw err;
  }
};

// Función helper para ejecutar INSERT/UPDATE/DELETE
const executeNonQuery = async (query, params = {}) => {
  try {
    const request = pool.request();
    
    // Agregar parámetros
    Object.keys(params).forEach(key => {
      const value = params[key];
      // Manejar diferentes tipos de datos
      if (value === null || value === undefined) {
        request.input(key, sql.NVarChar, null);
      } else if (typeof value === 'number') {
        // Si es un número decimal (precio)
        if (key === 'price' || (value % 1 !== 0)) {
          request.input(key, sql.Decimal(10, 2), value);
        } else {
          request.input(key, sql.Int, value);
        }
      } else if (typeof value === 'string' && value.length > 4000) {
        request.input(key, sql.NVarChar(sql.MAX), value);
      } else {
        request.input(key, value);
      }
    });
    
    const result = await request.query(query);
    return {
      rowsAffected: result.rowsAffected[0] || 0,
      recordset: result.recordset || []
    };
  } catch (err) {
    console.error('Error ejecutando non-query:', err);
    throw err;
  }
};

module.exports = {
  init,
  getDb,
  executeQuery,
  executeQueryOne,
  executeQueryAll,
  executeNonQuery,
  sql
};

const jsonServer = require('json-server');
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();

// ⚠️ IMPORTANTE: Usar DATA_DIR si está configurado (para Volumes en Railway), sino usar __dirname
const DATA_DIR = process.env.DATA_DIR || __dirname;
const dbPath = path.join(DATA_DIR, 'db.json');

// Asegurar que el directorio de datos existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log(`✅ Directorio de datos creado: ${DATA_DIR}`);
}
if (!fs.existsSync(dbPath)) {
  const initialData = {
    users: [
      {
        id: 'default-admin',
        email: 'admin@taller.com',
        password: 'admin123',
        name: 'Administrador',
        role: 'admin',
        createdAt: '2024-01-01T00:00:00.000Z',
        isDefault: true
      },
      {
        id: 'default-client',
        email: 'cliente@ejemplo.com',
        password: 'cliente123',
        name: 'Cliente Demo',
        role: 'client',
        createdAt: '2024-01-01T00:00:00.000Z',
        isDefault: true
      },
      {
        id: 'default-technician',
        email: 'tecnico@taller.com',
        password: 'tecnico123',
        name: 'Técnico',
        role: 'technician',
        createdAt: '2024-01-01T00:00:00.000Z',
        isDefault: true
      },
      {
        id: 'default-quality',
        email: 'calidad@taller.com',
        password: 'calidad123',
        name: 'Control de Calidad',
        role: 'quality-control',
        createdAt: '2024-01-01T00:00:00.000Z',
        isDefault: true
      }
    ],
    clients: [],
    vehicles: [],
    service_orders: [],
    state_history: [],
    expenses: [],
    revenues: [],
    reports: [],
    ratings: [],
    'checklist-categories': [],
    'preventive-reviews': []
  };
  fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
  console.log('✅ db.json creado con estructura inicial y usuarios por defecto');
} else {
  // Si db.json ya existe, asegurar que los usuarios por defecto existan
  const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const defaultUsers = [
    {
      id: 'default-admin',
      email: 'admin@taller.com',
      password: 'admin123',
      name: 'Administrador',
      role: 'admin',
      createdAt: '2024-01-01T00:00:00.000Z',
      isDefault: true
    },
    {
      id: 'default-client',
      email: 'cliente@ejemplo.com',
      password: 'cliente123',
      name: 'Cliente Demo',
      role: 'client',
      createdAt: '2024-01-01T00:00:00.000Z',
      isDefault: true
    },
    {
      id: 'default-technician',
      email: 'tecnico@taller.com',
      password: 'tecnico123',
      name: 'Técnico',
      role: 'technician',
      createdAt: '2024-01-01T00:00:00.000Z',
      isDefault: true
    },
    {
      id: 'default-quality',
      email: 'calidad@taller.com',
      password: 'calidad123',
      name: 'Control de Calidad',
      role: 'quality-control',
      createdAt: '2024-01-01T00:00:00.000Z',
      isDefault: true
    }
  ];
  
  let usersUpdated = false;
  defaultUsers.forEach(defaultUser => {
    const exists = dbData.users.some(u => u.id === defaultUser.id || u.email === defaultUser.email);
    if (!exists) {
      dbData.users.push(defaultUser);
      usersUpdated = true;
    }
  });
  
  if (usersUpdated) {
    fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2));
    console.log('✅ Usuarios por defecto agregados a db.json existente');
  }

  // Ensure new collections exist
  let collectionsUpdated = false;
  const hasOldCategories = dbData['checklist-categories'] && dbData['checklist-categories'].length > 0 && dbData['checklist-categories'].some(c => c.title === "Frenos" && c.items.includes("Campanas"));
  if (!dbData['checklist-categories'] || dbData['checklist-categories'].length === 0 || hasOldCategories) {
    dbData['checklist-categories'] = [
      { id: "1", title: "Suspensión y Rótulas", isEscaner: false, items: ["Amortiguadores Del.", "Amortiguadores Tras.", "Bujes de Tijera", "Tijeras", "Lágrimas", "Soporte de Amortiguadores", "Bujes Barra Estabilizadora", "Soportes de Motor", "Rótula Del. Der.", "Rótula Del. Izq.", "Rótula Tras. Der.", "Rótula Tras. Izq."] },
      { id: "2", title: "Frenos", isEscaner: false, items: ["Pastillas Del.", "Pastillas Tras.", "Discos Del.", "Discos Tras.", "Líquido de Frenos", "Freno de Mano", "Mangueras de Freno", "Bomba de Freno"] },
      { id: "3", title: "Dirección", isEscaner: false, items: ["Caja de Dirección", "Terminales", "Axiales", "Bomba de Dirección", "Aceite Hidráulico", "Holgura Volante"] },
      { id: "4", title: "Transmisión", isEscaner: false, items: ["Puntas", "Cardán", "Embrague", "Fugas Caja de Cambios"] },
      { id: "5", title: "Fugas", isEscaner: false, items: ["Fuga Aceite Motor", "Fuga Transmisión", "Fuga Dirección", "Fuga Refrigerante", "Fuga Combustible", "Fuga Frenos"] },
      { id: "6", title: "Escáner / Electrónico", isEscaner: true, items: ["Batería", "Alternador"] },
      { id: "7", title: "Chequeo Visual Motor", isEscaner: false, items: ["Nivel Aceite Motor", "Correa Distribución", "Bandas Accesorios", "Filtro de Aire", "Cableado Visible"] },
      { id: "8", title: "Refrigeración", isEscaner: false, items: ["Nivel Refrigerante", "Tapa Radiador", "Mangueras Radiador", "Termostato", "Ventilador / Clutch", "Radiador (fugas/daño)"] },
      { id: "9", title: "Visual Exterior / Luces", isEscaner: false, items: ["Luces Delanteras", "Luces Traseras", "Direccionales", "Luz de Freno", "Llantas (desgaste)", "Cristales / Limpiadores"] }
    ];
    collectionsUpdated = true;
  }
  if (!dbData['preventive-reviews']) { dbData['preventive-reviews'] = []; collectionsUpdated = true; }
  if (!dbData['special-services'] || dbData['special-services'].length === 0) { 
    dbData['special-services'] = [
      { id: "1", name: "Sincronización", categoryName: "Chequeo Visual Motor" },
      { id: "2", name: "Mantenimiento de Frenos", categoryName: "Frenos" },
      { id: "3", name: "Revisión y Diagnóstico Avanzado", askCategory: true }
    ]; 
    collectionsUpdated = true; 
  }
  if (collectionsUpdated) {
    fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2));
    console.log('✅ Nuevas colecciones agregadas a db.json existente');
  }
}

// Ahora sí crear el router (después de asegurar que db.json existe)
const router = jsonServer.router(dbPath);
const middlewares = jsonServer.defaults();

// Habilitar CORS
app.use(cors());

// Configurar multer para subir fotos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { orderId, type } = req.body;
    if (!orderId || !type) {
      return cb(new Error('orderId y type son requeridos'));
    }
    
    const uploadPath = path.join(DATA_DIR, 'photos', 'orders', orderId, type);
    
    // Crear carpeta si no existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Nombre único: timestamp-originalname
    const uniqueName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024 // Máximo 5MB por foto
  },
  fileFilter: (req, file, cb) => {
    // Solo permitir imágenes
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  }
});

// Middlewares
// Aumentar límite para manejar fotos Base64 grandes
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(middlewares);

// Servir fotos estáticas
app.use('/photos', express.static(path.join(DATA_DIR, 'photos')));

// Ruta para subir fotos
app.post('/api/upload-photo', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo' });
  }

  const { orderId, type } = req.body;
  const photoUrl = `/photos/orders/${orderId}/${type}/${req.file.filename}`;
  
  res.json({ 
    url: photoUrl,
    filename: req.file.filename,
    size: req.file.size,
    type: req.file.mimetype
  });
});

// Ruta para eliminar fotos
app.delete('/api/delete-photo', (req, res) => {
  const { photoUrl } = req.body;
  
  if (!photoUrl) {
    return res.status(400).json({ error: 'photoUrl es requerido' });
  }
  
  // Extraer ruta relativa
  const relativePath = photoUrl.replace('/photos/', '');
  const filePath = path.join(DATA_DIR, 'photos', relativePath);
  
  // Verificar que el archivo existe
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Foto no encontrada' });
  }
  
  // Eliminar archivo
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error('Error al eliminar foto:', err);
      return res.status(500).json({ error: 'Error al eliminar foto' });
    }
    res.json({ success: true, message: 'Foto eliminada correctamente' });
  });
});

// --- SISTEMA DE BITÁCORA DE TEXTO (LOW IMPACT) ---

// Endpoint para buscar en el historial de texto
app.get('/api/logs/search', (req, res) => {
  const query = (req.query.q || '').toString().toLowerCase();
  const logFile = path.join(DATA_DIR, 'registro_revisiones.txt');
  
  if (!fs.existsSync(logFile)) {
    return res.json([]);
  }

  try {
    const content = fs.readFileSync(logFile, 'utf8');
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    if (!query) {
      // Devolver las últimas 100 líneas si no hay búsqueda
      return res.json(lines.reverse().slice(0, 100));
    }

    const matches = lines.filter(line => line.toLowerCase().includes(query)).reverse();
    res.json(matches);
  } catch (error) {
    console.error('Error al leer log:', error);
    res.status(500).json({ error: 'Error al leer el archivo de bitácora' });
  }
});

// Middleware para interceptar y guardar en el log de texto
app.use('/api/preventive-reviews', (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    const originalSend = res.send;
    res.send = function (data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const review = JSON.parse(data);
          const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
          const vehicle = dbData.vehicles.find(v => v.id === review.vehicleId);
          
          if (vehicle) {
            const now = new Date();
            const dateStr = now.toLocaleDateString('es-CO') + ' ' + now.toLocaleTimeString('es-CO');
            
            // Generar resumen de fallas
            const issues = [];
            if (review.categories && Array.isArray(review.categories)) {
              review.categories.forEach(cat => {
                if (cat.items && Array.isArray(cat.items)) {
                  cat.items.forEach(item => {
                    if (item.status === 'warning' || item.status === 'urgent') {
                      issues.push(`${item.name} (${item.status === 'urgent' ? 'URGENTE' : 'ALERTA'})`);
                    }
                  });
                }
              });
            }

            const summary = issues.length > 0 ? issues.join(', ') : 'REVISIÓN OK';
            const notes = (review.generalNotes || 'Sin notas').replace(/\n/g, ' ');
            const logLine = `${dateStr} | ${vehicle.licensePlate} | ${vehicle.brand} ${vehicle.model} | ${summary} | NOTAS: ${notes}\n`;
            
            fs.appendFileSync(path.join(DATA_DIR, 'registro_revisiones.txt'), logLine);
          }
        } catch (e) {
          console.error('Error al procesar log de texto:', e);
        }
      }
      return originalSend.apply(res, arguments);
    };
  }
  next();
});

// API REST para datos (json-server)
app.use('/api', router);

// Crear carpeta de fotos si no existe
const photosDir = path.join(DATA_DIR, 'photos', 'orders');
if (!fs.existsSync(photosDir)) {
  fs.mkdirSync(photosDir, { recursive: true });
  console.log('✅ Carpeta de fotos creada');
}

const PORT = process.env.PORT || 3001;

// Manejo de errores del servidor
app.on('error', (err) => {
  console.error('❌ Error en el servidor:', err);
});

// Manejo de errores no capturados
process.on('uncaughtException', (err) => {
  console.error('❌ Error no capturado:', err);
  // No cerrar el proceso, solo loguear
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
  // No cerrar el proceso, solo loguear
});

// Iniciar servidor
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor JSON corriendo en puerto ${PORT}`);
  console.log(`📁 Directorio de datos: ${DATA_DIR}`);
  console.log(`📁 Base de datos: ${dbPath}`);
  console.log(`📸 Fotos guardadas en: ${path.join(DATA_DIR, 'photos')}`);
  console.log(`🌐 API disponible en: http://localhost:${PORT}/api`);
});

// Manejo de errores del servidor HTTP
server.on('error', (err) => {
  console.error('❌ Error del servidor HTTP:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`⚠️ Puerto ${PORT} ya está en uso`);
  }
});

// Mantener el proceso vivo
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('⚠️ SIGINT recibido, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});


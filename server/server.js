const jsonServer = require('json-server');
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const router = jsonServer.router('db.json');
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
    
    const uploadPath = path.join(__dirname, 'photos', 'orders', orderId, type);
    
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
app.use(express.json());
app.use(middlewares);

// Servir fotos estáticas
app.use('/photos', express.static(path.join(__dirname, 'photos')));

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
  const filePath = path.join(__dirname, 'photos', relativePath);
  
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

// API REST para datos (json-server)
app.use('/api', router);

// Crear db.json inicial si no existe
const dbPath = path.join(__dirname, 'db.json');
if (!fs.existsSync(dbPath)) {
  const initialData = {
    users: [],
    clients: [],
    vehicles: [],
    service_orders: [],
    state_history: [],
    expenses: [],
    revenues: [],
    reports: []
  };
  fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
  console.log('✅ db.json creado con estructura inicial');
}

// Crear carpeta de fotos si no existe
const photosDir = path.join(__dirname, 'photos', 'orders');
if (!fs.existsSync(photosDir)) {
  fs.mkdirSync(photosDir, { recursive: true });
  console.log('✅ Carpeta de fotos creada');
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Servidor JSON corriendo en puerto ${PORT}`);
  console.log(`📁 Base de datos: ${dbPath}`);
  console.log(`📸 Fotos guardadas en: ${path.join(__dirname, 'photos')}`);
  console.log(`🌐 API disponible en: http://localhost:${PORT}/api`);
});


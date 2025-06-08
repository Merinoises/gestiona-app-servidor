const path = require('path');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const Usuario = require('./models/usuario');

const authRoutes = require('./routes/auth');
const poolRoutes = require('./routes/pool');
const socorristasRoutes = require('./routes/socorristas');

const app = express();

require('dotenv').config({ path: path.join(__dirname, '.env') });
const MONGODB_URI = process.env.MONGODB_URI;

// this will parse any incoming request
// whose Content-Type is application/json
app.use(express.json());

app.use(authRoutes.routes);
app.use(poolRoutes.routes);
app.use(socorristasRoutes.routes);


// Habilitamos CORS para evitar bloqueos de origen cruzado
app.use(cors());

// 2) Servir la carpeta public/images en la ruta /images
app.use(
  '/images',
  express.static(path.join(__dirname, 'public/images/optimizadas'))
);

const PORT = process.env.PORT || 3000;
async function startServer() {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('✅ MongoDB connected - Gestiona app');
      app.listen(PORT, () => {
        console.log(`🚀 Server listening on port ${PORT}`);
      });
    } catch (error) {
      console.error('❌ Error connecting to MongoDB', error);
    }
  }

  startServer();
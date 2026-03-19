require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const tasBrutRoutes = require('./routes/tasBrut');
const tasLaveRoutes = require('./routes/tasLave');
const couchesRoutes = require('./routes/couches');
const machinesRoutes = require('./routes/machines');
const matricesRoutes = require('./routes/matrices');
const importRoutes = require('./routes/import');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/tas-brut', tasBrutRoutes);
app.use('/api/tas-lave', tasLaveRoutes);
app.use('/api/couches', couchesRoutes);
app.use('/api/machines', machinesRoutes);
app.use('/api/matrices', matricesRoutes);
app.use('/api/import', importRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`OCP Stockyard API running on port ${PORT}`);
});

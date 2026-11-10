const express = require('express');
const path = require('node:path');
const documentRoutes = require('./routes/document.routes');
const DocumentController = require('./controllers/document.controller');
const DocumentService = require('./services/document.service');
const DocumentRepository = require('./repositories/document.repository');

const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function createApp({
  storageDirectory = path.resolve(process.env.STORAGE_DIR || path.resolve(__dirname, '../storage')),
  maxFileSizeBytes = Number(process.env.MAX_FILE_SIZE_BYTES) || DEFAULT_MAX_FILE_SIZE_BYTES,
} = {}) {
  const app = express();
  const repository = new DocumentRepository(storageDirectory);
  const service = new DocumentService(repository);
  const controller = new DocumentController(service);

  app.use(express.json());
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  app.use(documentRoutes({ controller, storageDirectory, maxFileSizeBytes }));
  app.use((req, res) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Recurso não encontrado.' },
    });
  });
  app.use((error, req, res, next) => {
    if (res.headersSent) {
      return next(error);
    }

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: { code: 'FILE_TOO_LARGE', message: 'O arquivo excede o tamanho máximo permitido.' },
      });
    }

    if (error.name === 'MulterError') {
      return res.status(400).json({
        error: { code: 'INVALID_UPLOAD', message: 'Não foi possível processar o arquivo enviado.' },
      });
    }

    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Ocorreu um erro interno.' },
    });
  });

  return app;
}

const app = createApp();

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => {
    console.log(`DMS backend ouvindo na porta ${port}`);
  });
}

module.exports = app;
module.exports.createApp = createApp;

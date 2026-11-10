const { randomUUID } = require('node:crypto');
const multer = require('multer');
const express = require('express');

function documentRoutes({ controller, storageDirectory, maxFileSizeBytes }) {
  const router = express.Router();
  const upload = multer({
    storage: multer.diskStorage({
      destination: storageDirectory,
      filename: (req, file, callback) => callback(null, randomUUID()),
    }),
    limits: { fileSize: maxFileSizeBytes },
  });

  router.post('/upload', controller.requireOwner, upload.single('file'), controller.upload);
  router.get('/documents', controller.requireOwner, controller.list);
  router.get('/documents/:id/download', controller.requireOwner, controller.download);

  return router;
}

module.exports = documentRoutes;
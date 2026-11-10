class DocumentController {
  constructor(documentService) {
    this.documentService = documentService;
    this.requireOwner = this.requireOwner.bind(this);
    this.upload = this.upload.bind(this);
    this.list = this.list.bind(this);
    this.download = this.download.bind(this);
  }

  requireOwner(req, res, next) {
    const owner = req.get('X-User-Id')?.trim();
    if (!owner) {
      return res.status(400).json({
        error: { code: 'USER_ID_REQUIRED', message: 'Informe o usuário no cabeçalho X-User-Id.' },
      });
    }

    req.owner = owner;
    return next();
  }

  upload(req, res, next) {
    if (!req.file) {
      return res.status(400).json({
        error: { code: 'FILE_REQUIRED', message: 'Envie um arquivo no campo file.' },
      });
    }

    try {
      const document = this.documentService.registerUpload(req.file, req.owner);
      return res.status(201).json({ document });
    } catch (error) {
      return next(error);
    }
  }

  list(req, res, next) {
    try {
      return res.json({ documents: this.documentService.listDocuments(req.owner) });
    } catch (error) {
      return next(error);
    }
  }

  download(req, res, next) {
    try {
      const download = this.documentService.getDownload(req.params.id, req.owner);
      return res.download(download.filePath, download.originalName, (error) => {
        if (error && !res.headersSent) {
          if (error.status === 404 || error.statusCode === 404) {
            return res.status(404).json({
              error: { code: 'DOCUMENT_NOT_FOUND', message: 'Documento não encontrado.' },
            });
          }
          next(error);
        } else if (error) {
          res.destroy(error);
        }
      });
    } catch (error) {
      if (error.code === 'DOCUMENT_NOT_FOUND') {
        return res.status(404).json({
          error: { code: error.code, message: 'Documento não encontrado.' },
        });
      }

      return next(error);
    }
  }
}

module.exports = DocumentController;
const { randomUUID } = require('node:crypto');
const { toPublicDocument } = require('./document.mapper');

class DocumentService {
  constructor(documentRepository) {
    this.documentRepository = documentRepository;
  }

  registerUpload(file, owner) {
    const document = {
      id: randomUUID(),
      originalName: file.originalname,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      owner,
      mimeType: file.mimetype,
      storageName: file.filename,
    };

    this.documentRepository.save(document);
    return toPublicDocument(document);
  }

  listDocuments(owner) {
    return this.documentRepository.listByOwner(owner).map(toPublicDocument);
  }

  getDownload(id, owner) {
    const document = this.documentRepository.findById(id);
    if (!document || document.owner !== owner) {
      const error = new Error('Documento não encontrado.');
      error.code = 'DOCUMENT_NOT_FOUND';
      throw error;
    }

    return {
      filePath: this.documentRepository.getFilePath(document),
      originalName: document.originalName,
    };
  }
}

module.exports = DocumentService;
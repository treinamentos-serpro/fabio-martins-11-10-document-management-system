const { randomUUID } = require('node:crypto');

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
    return this.toPublicDocument(document);
  }

  listDocuments(owner) {
    return this.documentRepository.listByOwner(owner).map((document) =>
      this.toPublicDocument(document)
    );
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

  toPublicDocument(document) {
    const { id, originalName, size, uploadedAt, owner, mimeType } = document;
    return { id, originalName, size, uploadedAt, owner, mimeType };
  }
}

module.exports = DocumentService;
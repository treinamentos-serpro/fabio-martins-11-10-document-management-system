const fs = require('node:fs');
const path = require('node:path');

class DocumentRepository {
  constructor(storageDirectory) {
    this.storageDirectory = storageDirectory;
    this.documents = new Map();
    fs.mkdirSync(storageDirectory, { recursive: true });
  }

  save(document) {
    this.documents.set(document.id, document);
  }

  findById(id) {
    return this.documents.get(id);
  }

  listByOwner(owner) {
    return [...this.documents.values()]
      .filter((document) => document.owner === owner)
      .sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt));
  }

  getFilePath(document) {
    return path.join(this.storageDirectory, document.storageName);
  }
}

module.exports = DocumentRepository;
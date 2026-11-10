function toPublicDocument(document) {
  const { id, originalName, size, uploadedAt, owner, mimeType } = document;
  return { id, originalName, size, uploadedAt, owner, mimeType };
}

module.exports = { toPublicDocument };
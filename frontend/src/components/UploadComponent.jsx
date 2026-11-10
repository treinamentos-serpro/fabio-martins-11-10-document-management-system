import { useRef, useState } from 'react';
import { formatFileSize } from '../utils/files.js';

export default function UploadComponent({ isUploading, onUpload }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInput = useRef(null);

  function selectFile(file) {
    if (file) setSelectedFile(file);
  }

  async function submitUpload(event) {
    event.preventDefault();
    if (!selectedFile || isUploading) return;
    const uploaded = await onUpload(selectedFile);
    if (uploaded) {
      setSelectedFile(null);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  return (
    <form className="upload-form" onSubmit={submitUpload}>
      <label
        className={`dropzone${isDragging ? ' is-dragging' : ''}${selectedFile ? ' has-file' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          selectFile(event.dataTransfer.files[0]);
        }}
      >
        <input
          ref={fileInput}
          type="file"
          onChange={(event) => selectFile(event.target.files[0])}
          aria-label="Selecionar arquivo para envio"
        />
        <span className="dropzone-symbol" aria-hidden="true">+</span>
        <span className="dropzone-text">
          {selectedFile ? selectedFile.name : 'Escolher arquivo'}
          <small>{selectedFile ? formatFileSize(selectedFile.size) : 'ou arraste até aqui'}</small>
        </span>
        <span className="browse-label">Procurar</span>
      </label>
      <button className="upload-button" type="submit" disabled={!selectedFile || isUploading}>
        {isUploading ? 'Enviando...' : 'Enviar arquivo'}
      </button>
    </form>
  );
}

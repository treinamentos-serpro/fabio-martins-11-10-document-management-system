import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { downloadDocument, listDocuments, uploadDocument } from './services/documents.js';
import { saveBlob } from './utils/files.js';
import './styles.css';

export default function App() {
  const [userId, setUserId] = useState(() => localStorage.getItem('dms-user-id') || 'usuario-demo');
  const [userDraft, setUserDraft] = useState(userId);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    setErrorMessage('');

    listDocuments(userId)
      .then((result) => {
        if (isCurrent) setDocuments(result);
      })
      .catch((error) => {
        if (isCurrent) setErrorMessage(error.message);
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [userId]);

  function applyUser(event) {
    event.preventDefault();
    const nextUser = userDraft.trim();
    if (!nextUser) return;
    localStorage.setItem('dms-user-id', nextUser);
    setUserDraft(nextUser);
    setUserId(nextUser);
  }

  async function handleUpload(file) {
    setIsUploading(true);
    setErrorMessage('');
    try {
      const uploadedDocument = await uploadDocument(file, userId);
      setDocuments((currentDocuments) => [uploadedDocument, ...currentDocuments]);
      return true;
    } catch (error) {
      setErrorMessage(error.message);
      return false;
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDownload(document) {
    setErrorMessage('');
    try {
      const blob = await downloadDocument(document.id, userId);
      saveBlob(blob, document.originalName);
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Arquivo, início">
          <span className="brand-mark" aria-hidden="true">A</span>
          <span>arquivo<span className="brand-period">.</span></span>
        </a>
        <form className="identity-form" onSubmit={applyUser}>
          <label htmlFor="user-id">Usuário</label>
          <input
            id="user-id"
            value={userDraft}
            onChange={(event) => setUserDraft(event.target.value)}
            aria-label="Identificador do usuário"
            disabled={isUploading}
          />
          <button type="submit" disabled={isUploading || !userDraft.trim() || userDraft.trim() === userId}>
            Aplicar
          </button>
        </form>
      </header>

      <main className="workspace">
        <div className="page-heading">
          <div>
            <p className="eyebrow">ESPAÇO PESSOAL <span>·</span> ARQUIVOS LOCAIS</p>
            <h1>Seus documentos</h1>
            <p className="page-description">Envie e encontre seus arquivos em um só lugar.</p>
          </div>
          <div className="document-count" aria-live="polite">
            <strong>{documents.length.toString().padStart(2, '0')}</strong>
            <span>{documents.length === 1 ? 'documento' : 'documentos'}</span>
          </div>
        </div>

        <section className="upload-section" aria-labelledby="upload-heading">
          <div className="section-index">01 <span>/</span> NOVO ARQUIVO</div>
          <div className="upload-content">
            <div className="upload-copy">
              <h2 id="upload-heading">Adicione um documento</h2>
              <p>Os arquivos ficam armazenados localmente.</p>
            </div>
            <UploadComponent isUploading={isUploading} onUpload={handleUpload} />
          </div>
        </section>

        {errorMessage && (
          <div className="error-message" role="alert">
            <span>{errorMessage}</span>
            <button type="button" onClick={() => setErrorMessage('')} aria-label="Fechar aviso">
              Fechar
            </button>
          </div>
        )}

        <section className="documents-section" aria-labelledby="documents-heading">
          <div className="documents-heading">
            <div>
              <div className="section-index">02 <span>/</span> BIBLIOTECA</div>
              <h2 id="documents-heading">Arquivos enviados</h2>
            </div>
            <span className="storage-label"><span className="status-dot" /> Armazenamento local</span>
          </div>
          <DocumentList
            documents={documents}
            isLoading={isLoading}
            onDownload={handleDownload}
          />
        </section>
      </main>
      <footer className="site-footer">
        <span>ARQUIVO <span className="brand-period">.</span></span>
        <span>Documentos disponíveis apenas durante esta sessão do servidor.</span>
      </footer>
    </div>
  );
}

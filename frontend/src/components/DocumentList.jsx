import DownloadButton from './DownloadButton.jsx';
import { formatDate, formatFileSize } from '../utils/files.js';

export default function DocumentList({ documents, isLoading, onDownload }) {
  if (isLoading) {
    return <div className="list-state" role="status">Carregando documentos...</div>;
  }

  if (documents.length === 0) {
    return (
      <div className="list-state empty-state">
        <span className="empty-mark" aria-hidden="true">—</span>
        <p>Nenhum documento por aqui ainda.</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="document-table">
        <thead>
          <tr>
            <th scope="col">Nome</th>
            <th scope="col">Enviado em</th>
            <th scope="col">Tamanho</th>
            <th scope="col"><span className="visually-hidden">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          {documents.map((item) => (
            <tr key={item.id}>
              <td data-label="Nome">
                <span className="file-mark" aria-hidden="true">{item.originalName.split('.').pop().slice(0, 4).toUpperCase()}</span>
                <span className="file-name" title={item.originalName}>{item.originalName}</span>
              </td>
              <td data-label="Enviado em">{formatDate(item.uploadedAt)}</td>
              <td data-label="Tamanho">{formatFileSize(item.size)}</td>
              <td className="download-cell">
                <DownloadButton document={item} onDownload={onDownload} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
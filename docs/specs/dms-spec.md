# Especificação - Document Management System

## 1. Objetivo

Permitir que usuários enviem, listem e baixem seus documentos, mantendo os arquivos no filesystem local e os metadados em memória.

## 2. Escopo

### Dentro do escopo

- Upload de um documento por requisição.
- Listagem dos documentos associados ao usuário.
- Download de um documento pelo identificador, limitado ao seu dono.
- Armazenamento de arquivos local com `multer` e `diskStorage`.
- Metadados mantidos em memória durante a execução do servidor.
- Interface web React para upload, listagem e download.

### Fora do escopo

- Armazenamento em nuvem ou provedores externos.
- Versionamento, edição ou exclusão de documentos.
- Persistência durável de metadados.
- Autenticação e gestão de credenciais.
- Compartilhamento de documentos entre usuários.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O sistema deve aceitar um arquivo enviado como `multipart/form-data`, no campo `file`. |
| RF-02 | O sistema deve atribuir identificador e nome de armazenamento únicos, gerados pelo servidor, sem confiar no nome enviado pelo cliente para definir o caminho. |
| RF-03 | O sistema deve registrar em memória o identificador, nome original, tamanho, data de envio, dono e tipo de mídia do documento. |
| RF-04 | O sistema deve listar somente os documentos associados ao usuário da requisição. |
| RF-05 | O sistema deve permitir o download pelo identificador, somente quando o documento pertencer ao usuário da requisição. |
| RF-06 | O sistema deve responder com erro adequado quando o arquivo estiver ausente, for inválido ou exceder o limite configurado. |
| RF-07 | A interface deve permitir selecionar ou arrastar um arquivo, visualizar a lista retornada e iniciar o download. |
| RF-08 | O sistema não deve expor ao cliente o caminho físico nem o nome interno usado no armazenamento. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos devem ser gravados no filesystem local via `multer` com `diskStorage`, por padrão em `backend/storage`. |
| RNF-02 | Os metadados devem permanecer em memória; reiniciar o servidor pode torná-los indisponíveis. |
| RNF-03 | A configuração deve usar variáveis de ambiente com valores padrão documentados. |
| RNF-04 | O nome interno do arquivo deve ser gerado pelo servidor. O nome original serve somente como metadado e nome de download. |
| RNF-05 | As camadas do backend devem respeitar o fluxo `routes -> controllers -> services -> repositories`. |
| RNF-06 | Erros da API devem usar respostas JSON consistentes, exceto respostas de download bem-sucedidas. |

## 5. Modelo de dados

### Documento

| Campo | Tipo | Exposição | Descrição |
| --- | --- | --- | --- |
| `id` | string | Público | Identificador único UUID. |
| `originalName` | string | Público | Nome original enviado pelo usuário. |
| `size` | number | Público | Tamanho em bytes. |
| `uploadedAt` | string | Público | Data e hora do upload em ISO 8601. |
| `owner` | string | Público | Identificador do usuário dono. |
| `mimeType` | string | Público | Tipo de mídia informado no upload. |
| `storageName` | string | Interno | Nome gerado para o arquivo no disco. |
| `storagePath` | string | Interno | Caminho usado pelo repositório; nunca deve ser retornado pela API. |

O repositório de metadados é indexado por `id`. Não há entidade de usuário persistida nesta fase; `owner` é um identificador associado ao documento.

## 6. Contratos de API

O backend expõe os caminhos abaixo. No frontend, as requisições usam o prefixo `/api`, encaminhado pelo proxy do Vite ao backend.

### `POST /upload`

- Entrada: `multipart/form-data`, campo obrigatório `file`.
- Identidade: cabeçalho `X-User-Id` obrigatório nesta fase.
- Sucesso: `201 Created`.

```json
{
  "document": {
    "id": "uuid",
    "originalName": "relatorio.pdf",
    "size": 12345,
    "uploadedAt": "2026-11-10T12:00:00.000Z",
    "owner": "user-123",
    "mimeType": "application/pdf"
  }
}
```

Erros esperados: `400` para usuário, arquivo ou entrada inválida; `413` para arquivo acima do limite; `500` para falha inesperada de armazenamento.

### `GET /documents`

- Entrada: cabeçalho `X-User-Id` obrigatório.
- Sucesso: `200 OK`, lista vazia quando o usuário ainda não enviou documentos.

```json
{
  "documents": []
}
```

### `GET /documents/:id/download`

- Entrada: parâmetro `id` e cabeçalho `X-User-Id` obrigatório.
- Sucesso: `200 OK`, conteúdo binário com `Content-Disposition: attachment` e nome original.
- Erro: `404 Not Found` para documento inexistente, não pertencente ao usuário ou arquivo não encontrado no disco; `500` para falha inesperada na leitura.

### Formato de erro

```json
{
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "O arquivo excede o tamanho máximo permitido."
  }
}
```

Códigos HTTP esperados: `400`, `404`, `413` e `500`. Respostas de erro não devem revelar caminhos locais ou detalhes internos.

## 7. Decisões arquiteturais

- **Backend:** Express; rotas delegam aos controllers, controllers validam a entrada HTTP, services aplicam regras de negócio e repositories tratam filesystem e metadados.
- **Upload:** `multer` com `diskStorage`; usar nome interno UUID e preservar o nome original apenas nos metadados.
- **Persistência:** arquivos em `backend/storage`; metadados em memória. Uma reinicialização pode deixar arquivos no disco sem metadados correspondentes.
- **Identidade:** `X-User-Id` é uma convenção provisória para o MVP e não autentica o solicitante. Não deve ser tratado como controle de acesso seguro em produção; uma implementação futura deve obter o dono de uma identidade autenticada, preservando a regra de propriedade nos services.
- **Configuração:** `PORT` padrão `3000`; `STORAGE_DIR` padrão `backend/storage`; `MAX_FILE_SIZE_BYTES` padrão `10485760` (10 MiB). `STORAGE_DIR` pode ser passado ao criar o app para testes isolados.
- **Frontend:** React e `fetch`; usar `/api` conforme o proxy do Vite. O frontend não acessa o filesystem diretamente.
- **Limite de escopo:** sem autenticação, banco de dados, armazenamento externo, versionamento ou exclusão nesta fase.

## 8. Plano de execução

1. **Especificação:** registrar requisitos, modelo, contratos, decisões e riscos em `docs/specs/dms-spec.md`.
2. **Backend:** implementar rotas, controllers, services e repositories para upload, listagem e download, respeitando o armazenamento local. Validar contratos, propriedade do documento e erros com testes automatizados.
3. **Frontend:** implementar upload por seleção/arraste, listagem e download usando a API via `/api`; tratar carregamento e erros.
4. **Integração:** executar testes automatizados e verificar proxy, fluxo de upload/listagem/download e isolamento por dono.
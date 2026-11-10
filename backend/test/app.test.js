const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const appModule = require('../src/app');
const app = appModule;

// Teste de fumaça do seed: garante que o app Express foi exportado.
// Novos testes serão adicionados durante os Steps 2, 6 e 7 com auxílio do Copilot.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('upload, listagem e download respeitam o dono e ocultam dados internos', async (context) => {
  const storageDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-test-'));
  const testApp = appModule.createApp({ storageDirectory });
  const server = testApp.listen(0);
  context.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(storageDirectory, { recursive: true, force: true });
  });
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const form = new FormData();
  form.append('file', new Blob(['conteudo de teste'], { type: 'text/plain' }), 'notas.txt');
  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'usuario-a' },
    body: form,
  });
  assert.equal(uploadResponse.status, 201);
  const { document } = await uploadResponse.json();
  assert.equal(document.originalName, 'notas.txt');
  assert.equal(document.owner, 'usuario-a');
  assert.equal(document.size, Buffer.byteLength('conteudo de teste'));
  assert.equal(Object.hasOwn(document, 'storageName'), false);

  const listResponse = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'usuario-a' },
  });
  assert.deepEqual((await listResponse.json()).documents, [document]);

  const otherUserList = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'usuario-b' },
  });
  assert.deepEqual((await otherUserList.json()).documents, []);

  const forbiddenDownload = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: { 'X-User-Id': 'usuario-b' },
  });
  assert.equal(forbiddenDownload.status, 404);

  const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: { 'X-User-Id': 'usuario-a' },
  });
  assert.equal(downloadResponse.status, 200);
  assert.match(downloadResponse.headers.get('content-disposition'), /notas\.txt/);
  assert.equal(await downloadResponse.text(), 'conteudo de teste');

  const [storedFile] = await fs.readdir(storageDirectory);
  await fs.unlink(path.join(storageDirectory, storedFile));
  const missingStoredFile = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: { 'X-User-Id': 'usuario-a' },
  });
  assert.equal(missingStoredFile.status, 404);
  assert.equal((await missingStoredFile.json()).error.code, 'DOCUMENT_NOT_FOUND');
});

test('rejeita usuário ausente, arquivo ausente e arquivo acima do limite', async (context) => {
  const storageDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-test-'));
  const testApp = appModule.createApp({ storageDirectory, maxFileSizeBytes: 4 });
  const server = testApp.listen(0);
  context.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(storageDirectory, { recursive: true, force: true });
  });
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const missingUser = await fetch(`${baseUrl}/documents`);
  assert.equal(missingUser.status, 400);
  assert.equal((await missingUser.json()).error.code, 'USER_ID_REQUIRED');

  const missingFile = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'usuario-a' },
    body: new FormData(),
  });
  assert.equal(missingFile.status, 400);
  assert.equal((await missingFile.json()).error.code, 'FILE_REQUIRED');

  const form = new FormData();
  form.append('file', new Blob(['maior'], { type: 'text/plain' }), 'arquivo.txt');
  const oversized = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'usuario-a' },
    body: form,
  });
  assert.equal(oversized.status, 413);
  assert.equal((await oversized.json()).error.code, 'FILE_TOO_LARGE');
});

const SECRET_KEY = 'onebase-invoice-poc-2026-secure-key!';

async function getKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(SECRET_KEY.padEnd(32, '!').slice(0, 32)),
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
  return keyMaterial;
}

function concatBuffers(...buffers: ArrayBuffer[]): ArrayBuffer {
  const totalLength = buffers.reduce((acc, buf) => acc + buf.byteLength, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const buf of buffers) {
    result.set(new Uint8Array(buf), offset);
    offset += buf.byteLength;
  }
  return result.buffer;
}

export async function compressAndEncrypt(jsonData: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(jsonData);

  const cs = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();
  writer.write(data);
  writer.close();
  const compressed = await new Response(cs.readable).arrayBuffer();

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey();
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    compressed
  );

  const version = new Uint8Array([1]);
  return concatBuffers(version.buffer, iv.buffer, encrypted);
}

export async function decryptAndDecompress(buffer: ArrayBuffer): Promise<string> {
  const view = new Uint8Array(buffer);
  const _version = view[0];
  const iv = view.slice(1, 13);
  const encrypted = view.slice(13);

  const key = await getKey();
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  );

  const ds = new DecompressionStream('gzip');
  const writer = ds.writable.getWriter();
  writer.write(decrypted);
  writer.close();
  const decompressed = await new Response(ds.readable).arrayBuffer();

  return new TextDecoder().decode(decompressed);
}

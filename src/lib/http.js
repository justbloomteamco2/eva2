export function hasTrustedOrigin(request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try {
    const parsed = new URL(origin);
    const forwardedProto = request.headers.get("x-forwarded-proto");
    return parsed.host === host && (!forwardedProto || parsed.protocol === `${forwardedProto}:`);
  } catch {
    return false;
  }
}

export async function readBoundedJson(request, maxBytes) {
  const reader = request.body?.getReader();
  if (!reader) throw Object.assign(new Error("Request body is required."), { status: 400 });
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw Object.assign(new Error("Request body is too large."), { status: 413 });
    }
    chunks.push(value);
  }

  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(body));
  } catch {
    throw Object.assign(new Error("Request body must contain valid JSON."), { status: 400 });
  }
}

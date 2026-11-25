const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';

async function requestJson(path, { method = 'GET', body, timeoutMs = 8000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const mensaje =
        data?.message || data?.error || `Error HTTP ${response.status}`;
      throw new Error(mensaje);
    }

    return data;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Tiempo de espera agotado al conectar con el servidor.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function consultarAsesoriaCDA(payload) {
  return requestJson('/api/cda/asesoria', {
    method: 'POST',
    body: payload,
  });
}

export async function sincronizarEstadoFinanciero(payload) {
  return requestJson('/api/finanzas/sync', {
    method: 'POST',
    body: payload,
  });
}

export { API_BASE_URL };
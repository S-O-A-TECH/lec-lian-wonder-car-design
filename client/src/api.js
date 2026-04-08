const BASE = '/api';

export async function fetchModels() {
  const res = await fetch(`${BASE}/models`);
  return res.json();
}

export async function fetchParts(category) {
  const res = await fetch(`${BASE}/models/parts/${category}`);
  return res.json();
}

export async function fetchDesigns(sort = 'latest', page = 1) {
  const res = await fetch(`${BASE}/designs?sort=${sort}&page=${page}`);
  return res.json();
}

export async function fetchDesign(id) {
  const res = await fetch(`${BASE}/designs/${id}`);
  return res.json();
}

export async function saveDesign(data) {
  const res = await fetch(`${BASE}/designs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function toggleLike(designId, nickname) {
  const res = await fetch(`${BASE}/designs/${designId}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname }),
  });
  return res.json();
}

export async function uploadImage(blob) {
  const form = new FormData();
  form.append('image', blob, 'screenshot.png');
  const res = await fetch(`${BASE}/upload`, { method: 'POST', body: form });
  return res.json();
}

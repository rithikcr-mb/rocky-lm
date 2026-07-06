export const fetchChatStream = async (message) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  return response;
};

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  return response;
};

export const fetchActiveDocument = async () => {
  const response = await fetch('/api/active-document');
  if (!response.ok) {
    throw new Error('Failed to fetch active document');
  }
  return response.json();
};

export const fetchProfile = async () => {
  const response = await fetch('/api/profile');
  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }
  return response.json();
};

export const updateProfile = async (name) => {
  const response = await fetch('/api/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.detail || 'Failed to save profile');
  }
  return response.json();
};

export const fetchResearchLog = async () => {
  const response = await fetch('/api/research-log');
  if (!response.ok) throw new Error('Failed to fetch research log');
  return response.json();
};

export const fetchSystemStatus = async () => {
  const response = await fetch('/api/system-status');
  if (!response.ok) throw new Error('Failed to fetch system status');
  return response.json();
};

export const fetchArtifacts = async () => {
  const response = await fetch('/api/artifacts');
  if (!response.ok) throw new Error('Failed to fetch artifacts');
  return response.json();
};

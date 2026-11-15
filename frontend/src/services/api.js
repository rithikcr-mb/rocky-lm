const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const fetchChatStream = async (message) => {
  const response = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

  return response;
};

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });

  return response;
};

export const fetchActiveDocument = async () => {
  const response = await fetch(`${API_BASE}/active-document`);

  if (!response.ok) {
    throw new Error("Failed to fetch active document");
  }

  return response.json();
};

export const fetchProfile = async () => {
  const response = await fetch(`${API_BASE}/profile`);

  if (!response.ok) {
    throw new Error("Failed to fetch profile");
  }

  return response.json();
};

export const updateProfile = async (name) => {
  let response;
  try {
    response = await fetch(`${API_BASE}/profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });
  } catch {
    throw new Error("Could not reach the Rocky backend. Make sure it is running on port 8001.");
  }

  if (!response.ok) {
    let detail = "Failed to save profile";
    try {
      const errData = await response.json();
      if (errData?.detail) detail = errData.detail;
    } catch {
      // Proxy and gateway errors are not JSON.
    }

    if ([502, 503, 504].includes(response.status)) {
      detail = "Could not reach the Rocky backend. Make sure it is running on port 8001.";
    }

    throw new Error(detail);
  }

  return response.json();
};

export const fetchResearchLog = async () => {
  const response = await fetch(`${API_BASE}/research-log`);

  if (!response.ok) {
    throw new Error("Failed to fetch research log");
  }

  return response.json();
};

export const fetchSystemStatus = async () => {
  const response = await fetch(`${API_BASE}/system-status`);

  if (!response.ok) {
    throw new Error("Failed to fetch system status");
  }

  return response.json();
};

export const fetchArtifacts = async () => {
  const response = await fetch(`${API_BASE}/artifacts`);

  if (!response.ok) {
    throw new Error("Failed to fetch artifacts");
  }

  return response.json();
};
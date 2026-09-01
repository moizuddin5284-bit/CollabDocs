const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function getUserId() {
  return localStorage.getItem("collabdocs_user_id") || "";
}

async function request(path, { method = "GET", body, headers, isForm } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      "x-user-id": getUserId(),
      ...headers,
    },
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no body
  }

  if (!res.ok) {
    const message = data?.error || `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }
  return data;
}

export const api = {
  login: (credentials) => request("/api/login", { method: "POST", body: credentials }),
  listUsers: () => request("/api/users"),
  me: () => request("/api/me"),
  listDocuments: () => request("/api/documents"),
  getDocument: (id) => request(`/api/documents/${id}`),
  createDocument: (title, content = "") => request("/api/documents", { method: "POST", body: { title, content } }),
  updateDocument: (id, patch) => request(`/api/documents/${id}`, { method: "PUT", body: patch }),
  duplicateDocument: (id) => request(`/api/documents/${id}/duplicate`, { method: "POST" }),
  deleteDocument: (id) => request(`/api/documents/${id}`, { method: "DELETE" }),
  shareDocument: (id, email, permission) =>
    request(`/api/documents/${id}/share`, { method: "POST", body: { email, permission } }),
  unshareDocument: (id, userId) => request(`/api/documents/${id}/share/${userId}`, { method: "DELETE" }),
  uploadDocument: (file) => {
    const form = new FormData();
    form.append("file", file);
    return request("/api/documents/upload", { method: "POST", body: form, isForm: true });
  },
};

export { getUserId };

export function setUserId(id) {
  localStorage.setItem("collabdocs_user_id", id);
}

export function clearUserId() {
  localStorage.removeItem("collabdocs_user_id");
}

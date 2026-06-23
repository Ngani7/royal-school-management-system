const getHeaders = () => {
  const token = localStorage.getItem("rsms_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const getBaseURL = () => {
  return import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
};

const buildURL = (path: string) => {
  const base = getBaseURL();
  return `${base}${path}`;
};

export const api = {
  get: async (url: string) => {
    const fullURL = buildURL(url);
    const res = await fetch(fullURL, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Request failed" }));
      throw new Error(err.error || "An error occurred");
    }
    return res.json();
  },
  post: async (url: string, body: any) => {
    const fullURL = buildURL(url);
    const res = await fetch(fullURL, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Request failed" }));
      throw new Error(err.error || "An error occurred");
    }
    return res.json();
  },
  patch: async (url: string, body: any) => {
    const fullURL = buildURL(url);
    const res = await fetch(fullURL, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Request failed" }));
      throw new Error(err.error || "An error occurred");
    }
    return res.json();
  },
  delete: async (url: string) => {
    const fullURL = buildURL(url);
    const res = await fetch(fullURL, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Request failed" }));
      throw new Error(err.error || "An error occurred");
    }
    return res.json();
  },
};
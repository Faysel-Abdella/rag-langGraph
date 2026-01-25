class APIService {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl || this.getApiBaseUrl();
    this.defaultHeaders = { 'Content-Type': 'application/json' };
  }

  getApiBaseUrl() {
    const { protocol, hostname, port } = window.location;
    return (hostname === 'localhost' || hostname === '127.0.0.1') 
      ? `${protocol}//localhost:3000` 
      : `${protocol}//${hostname}${port ? `:${port}` : ''}`;
  }

  getHeaders() {
    const headers = { ...this.defaultHeaders };
    const token = sessionStorage.getItem('authToken');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  async getKnowledgeBase() {
    try {
      const response = await fetch(`${this.baseUrl}/api/knowledge`, { headers: this.getHeaders() });
      const result = await response.json();
      return result.success ? result.data : [];
    } catch (e) {
      console.error("API Error:", e);
      return [];
    }
  }

  async createKnowledgeItem(question, answer) {
    const response = await fetch(`${this.baseUrl}/api/knowledge`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ question, answer })
    });
    return response.json();
  }
}
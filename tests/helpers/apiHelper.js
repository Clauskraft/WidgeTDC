const request = require('supertest');

class APITestHelper {
  constructor(app) {
    this.app = app;
    this.token = null;
  }

  async login(email, password) {
    const response = await request(this.app)
      .post('/api/auth/login')
      .send({ email, password });

    this.token = response.body.accessToken;
    return response;
  }

  async authenticatedRequest(method, path, body = null) {
    const req = request(this.app)[method](path)
      .set('Authorization', `Bearer ${this.token}`);

    if (body) {
      req.send(body);
    }

    return await req;
  }

  async get(path) {
    return this.authenticatedRequest('get', path);
  }

  async post(path, body) {
    return this.authenticatedRequest('post', path, body);
  }

  async put(path, body) {
    return this.authenticatedRequest('put', path, body);
  }

  async delete(path) {
    return this.authenticatedRequest('delete', path);
  }
}

module.exports = APITestHelper;

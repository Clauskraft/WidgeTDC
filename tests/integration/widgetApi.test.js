const DatabaseTestHelper = require('../helpers/dbHelper');
const APITestHelper = require('../helpers/apiHelper');

describe('Widget API Integration', () => {
  let dbHelper;
  let apiHelper;
  let testUser;

  beforeAll(async () => {
    dbHelper = new DatabaseTestHelper();
    await dbHelper.connect();
  });

  afterAll(async () => {
    await dbHelper.disconnect();
  });

  beforeEach(async () => {
    await dbHelper.clearDatabase();
    testUser = await dbHelper.createTestUser();
    apiHelper = new APITestHelper(app);
    await apiHelper.login(testUser.email, 'password');
  });

  test('GET /api/widgets should return all widgets', async () => {
    await dbHelper.createTestWidget(testUser.id);
    await dbHelper.createTestWidget(testUser.id, { name: 'Widget 2' });

    const response = await apiHelper.get('/api/widgets');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });

  test('POST /api/widgets should create a new widget', async () => {
    const widgetData = {
      name: 'New Widget',
      version: '1.0.0',
      price: 49.99,
      description: 'Test widget',
    };

    const response = await apiHelper.post('/api/widgets', widgetData);

    expect(response.status).toBe(201);
    expect(response.body.name).toBe('New Widget');
    expect(response.body.ownerId).toBe(testUser.id);
  });

  test('PUT /api/widgets/:id should update widget', async () => {
    const widget = await dbHelper.createTestWidget(testUser.id);

    const response = await apiHelper.put(`/api/widgets/${widget.id}`, {
      price: 79.99,
    });

    expect(response.status).toBe(200);
    expect(response.body.price).toBe('79.99');
  });

  test('DELETE /api/widgets/:id should delete widget', async () => {
    const widget = await dbHelper.createTestWidget(testUser.id);

    const response = await apiHelper.delete(`/api/widgets/${widget.id}`);

    expect(response.status).toBe(204);
  });
});

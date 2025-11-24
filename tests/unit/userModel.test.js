const DatabaseTestHelper = require('../helpers/dbHelper');

describe('User Model', () => {
  let dbHelper;

  beforeAll(async () => {
    dbHelper = new DatabaseTestHelper();
    await dbHelper.connect();
  });

  afterAll(async () => {
    await dbHelper.disconnect();
  });

  beforeEach(async () => {
    await dbHelper.clearDatabase();
  });

  test('should create a user with valid data', async () => {
    const user = await dbHelper.createTestUser({
      username: 'john_doe',
      email: 'john@example.com',
    });

    expect(user.id).toBeDefined();
    expect(user.username).toBe('john_doe');
    expect(user.email).toBe('john@example.com');
    expect(user.isActive).toBe(true);
  });

  test('should enforce unique username constraint', async () => {
    await dbHelper.createTestUser({ username: 'duplicate' });

    await expect(
      dbHelper.createTestUser({
        username: 'duplicate',
        email: 'different@example.com',
      })
    ).rejects.toThrow();
  });

  test('should enforce unique email constraint', async () => {
    await dbHelper.createTestUser({ email: 'same@example.com' });

    await expect(
      dbHelper.createTestUser({
        username: 'different',
        email: 'same@example.com',
      })
    ).rejects.toThrow();
  });

  test('should validate email format', async () => {
    await expect(dbHelper.createTestUser({ email: 'invalid-email' })).rejects.toThrow();
  });
});

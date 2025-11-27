const { Sequelize } = require('sequelize');

class DatabaseTestHelper {
  constructor() {
    this.sequelize = new Sequelize({
      dialect: 'postgres',
      host: 'localhost',
      port: 5432,
      database: 'widgettdc_test',
      username: 'postgres',
      password: 'password',
      logging: false,
    });
  }

  async connect() {
    await this.sequelize.authenticate();
  }

  async disconnect() {
    await this.sequelize.close();
  }

  async clearDatabase() {
    await this.sequelize.query('TRUNCATE TABLE users, widgets CASCADE');
  }

  async createTestUser(overrides = {}) {
    const User = require('../../database/models/User')(this.sequelize);
    return await User.create({
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      ...overrides,
    });
  }

  async createTestWidget(userId, overrides = {}) {
    const Widget = require('../../database/models/Widget')(this.sequelize);
    return await Widget.create({
      name: 'Test Widget',
      version: '1.0.0',
      price: 99.99,
      ownerId: userId,
      ...overrides,
    });
  }
}

module.exports = DatabaseTestHelper;

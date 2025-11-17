// Global test setup
beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.DB_NAME = 'widgettdc_test';
});

afterAll(() => {
  // Cleanup connections
});

global.testTimeout = ms => {
  jest.setTimeout(ms);
};

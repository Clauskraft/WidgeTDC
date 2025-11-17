module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('users', [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        username: 'admin',
        email: 'admin@widgettdc.dev',
        password_hash: 'hashed_password_here',
        role: 'admin',
        is_verified: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        username: 'developer',
        email: 'dev@widgettdc.dev',
        password_hash: 'hashed_password_here',
        role: 'developer',
        is_verified: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('users', null, {});
  }
};

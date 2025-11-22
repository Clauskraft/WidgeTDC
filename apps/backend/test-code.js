function getUserData(userId) {
  const query = "SELECT * FROM users WHERE id = ?";
  const result = executeQuery(query, [userId]);
  logger.info('User data retrieved', { userId, result });
  return result;
}

function displayUserName(name) {
  const userElement = document.getElementById('user');
  userElement.textContent = name;
}

const data = getUserData(123);
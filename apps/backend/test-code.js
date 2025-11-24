// Test file with security issues
function getUserData(userId) {
  const query = "SELECT * FROM users WHERE id = " + userId; // SQL injection
  const result = eval(query); // XSS risk
  console.log(result); // Should use proper logging
  return result;
}

function displayUserName(name) {
  document.getElementById('user').innerHTML = name; // XSS vulnerability
}

const data: any = getUserData(123); // Using 'any' type

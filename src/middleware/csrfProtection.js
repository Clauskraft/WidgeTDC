const csrf = require('csurf');

const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

const injectCsrfToken = (req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
};

module.exports = { csrfProtection, injectCsrfToken };

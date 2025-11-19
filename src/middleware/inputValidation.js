const { validationResult } = require('express-validator');
const sanitizeHtml = require('sanitize-html');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const sanitizeInput = input => {
  if (typeof input === 'string') {
    return sanitizeHtml(input, {
      allowedTags: [],
      allowedAttributes: {},
    });
  }
  if (typeof input === 'object' && input !== null) {
    const sanitized = {};
    for (const key in input) {
      sanitized[key] = sanitizeInput(input[key]);
    }
    return sanitized;
  }
  return input;
};

const sanitizeBody = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeInput(req.body);
  }
  next();
};

const sanitizeQuery = (req, res, next) => {
  if (req.query) {
    req.query = sanitizeInput(req.query);
  }
  next();
};

module.exports = { validate, sanitizeBody, sanitizeQuery };

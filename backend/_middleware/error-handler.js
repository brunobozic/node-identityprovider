/* eslint-disable no-unused-vars */
/* eslint-disable no-case-declarations */
/* eslint-disable consistent-return */
/* eslint-disable no-use-before-define */
/* eslint-disable no-param-reassign */

// set up our Winston logger (same instance, cached by node)
const winstonErrorHandler = require('../_helpers/winston-logger')

module.exports = errorHandler;

function errorHandler(err, req, res, _next, span) {
  switch (true) {
    case typeof err === 'string':
      const is404 = err.toLowerCase().endsWith('not found');
      const statusCode = is404 ? 404 : 400;
      span.finish();
      winstonErrorHandler.error(err.message);
      return res.status(statusCode).json({ message: err });
    case err.name === 'ValidationError':
      winstonErrorHandler.error(err.message);
      span.finish();
      return res.status(400).json({ message: err.message });
    case err.name === 'UnauthorizedError':
      span.finish();
      winstonErrorHandler.error(err.message);
      return res.status(401).json({ message: 'Unauthorized' });
    default:
      span.finish();
      winstonErrorHandler.error(err.message);
      return res.status(500).json({ message: err.message });
  }

}

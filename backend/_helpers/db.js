/* eslint-disable global-require */
/* eslint-disable no-use-before-define */
const mongoose = require('mongoose');
const config = require('../config.json');

const connectionOptions = {
  useCreateIndex: true, useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false,
};
try {
  mongoose.connect(process.env.MONGODB_URI || config.connectionString, connectionOptions);
  mongoose.Promise = global.Promise;
} catch (error) {
  console.error(new Error(`Whoops, something bad happened${error}`));
}

module.exports = {
  Account: require('../accounts/account.model'),
  RefreshToken: require('../accounts/refresh-token.model'),
  isValidId,
};

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

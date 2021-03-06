const mongoose = require('mongoose');

const { Schema } = mongoose;

const schema = new Schema({
  account: { type: Schema.Types.ObjectId, ref: 'Account' },
  token: String,
  expires: Date,
  created: { type: Date, default: Date.now },
  createdByIp: String,
  revoked: Date,
  revokedByIp: String,
  replacedByToken: String,
});

// virtual property
schema.virtual('isExpired').get(function () {
  return Date.now() >= this.expires;
});

// virtual property
schema.virtual('isActive').get(function () {
  return !this.revoked && !this.isExpired;
});

module.exports = mongoose.model('RefreshToken', schema);

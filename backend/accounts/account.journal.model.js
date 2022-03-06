/* eslint-disable no-underscore-dangle */
/* eslint-disable global-require */
/* eslint-disable import/no-unresolved */
/* eslint-disable no-unused-vars */
/* eslint-disable no-case-declarations */
/* eslint-disable consistent-return */
/* eslint-disable no-use-before-define */
/* eslint-disable no-param-reassign */
const mongoose = require('mongoose');

const { Schema } = mongoose;

const schema = new Schema({
  EmailActedUpon: { type: String, required: true },
  UserNameActedUpon: { type: String, required: true },
  Message: { type: String, required: true },
  ActingUserName: { type: String, required: true },
  ActingEmail: { type: String, unique: false, required: true },
  Seen: Date,
  created: { type: Date, default: Date.now },
  createdBy: { type: String, required: false },
});

schema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform(doc, ret) {
    // delete -> remove these props when object is serialized
    delete ret._id;
  },
});

module.exports = mongoose.model('AccountJournal', schema);

﻿/* eslint-disable max-len */
/* eslint-disable prefer-template */
/* eslint-disable no-return-await */
/* eslint-disable no-shadow */
/* eslint-disable no-throw-literal */
/* eslint-disable no-underscore-dangle */
/* eslint-disable global-require */
/* eslint-disable import/no-unresolved */
/* eslint-disable no-unused-vars */
/* eslint-disable no-case-declarations */
/* eslint-disable consistent-return */
/* eslint-disable no-use-before-define */
/* eslint-disable no-param-reassign */
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const { initTracer } = require('jaeger-client')
const sendEmail = require('../_helpers/send-email')
const db = require('../_helpers/db')
const Role = require('../_helpers/role')
const config = require('../config.json')

module.exports = {
  authenticate,
  refreshToken,
  revokeToken,
  register,
  verifyEmail,
  forgotPassword,
  validateResetToken,
  resetPassword,
  getAll,
  getById,
  create,
  update,
  delete: _delete,
}

// set up our Winston logger (same instance, cached by node)
const errorHandler = require('../_helpers/winston-logger')

// set up our distributed tracer (jaeger server needs to be up and running, listening on port 14268), must be unique per each js file due to serviceName property
const jaegerConfig = {
  serviceName: 'accounts.service',
  reporter: {
    logSpans: true,
    collectorEndpoint: 'http://jaeger:14268/api/traces',
  },
  sampler: {
    type: 'const',
    param: 1,
  },
}
const options = {
  tags: {
    'identityapi.version': '1.0.0',
  },
}
const tracer = initTracer(jaegerConfig, options) // tracer used for this class gets initialiazed here

async function authenticate({ email, password, ipAddress }) {
  const account = await db.Account.findOne({ email })

  if (
    !account ||
    !account.isVerified ||
    !bcrypt.compareSync(password, account.passwordHash)
  ) {
    errorHandler.error(`Whoops, Email or password is incorrect: [${email}]`);
    throw 'Email or password is incorrect'
  }

  try {
      const jwtToken = generateJwtToken(account)
  const refreshToken = generateRefreshToken(account, ipAddress)
  await refreshToken.save()
  return {
    ...basicDetails(account),
    jwtToken,
    refreshToken: refreshToken.token,
  }
  } catch (error) {
    errorHandler.error(`Whoops: [${error}]`);
  }
}

async function refreshToken({ token, ipAddress }) {
  const refreshToken = await getRefreshToken(token)
  const { account } = refreshToken

  const newRefreshToken = generateRefreshToken(account, ipAddress)
  refreshToken.revoked = Date.now()
  refreshToken.revokedByIp = ipAddress
  refreshToken.replacedByToken = newRefreshToken.token
  await refreshToken.save()
  await newRefreshToken.save()

  const jwtToken = generateJwtToken(account)

  return {
    ...basicDetails(account),
    jwtToken,
    refreshToken: newRefreshToken.token,
  }
}

async function revokeToken({ token, ipAddress }) {
  const refreshToken = await getRefreshToken(token)

  refreshToken.revoked = Date.now()
  refreshToken.revokedByIp = ipAddress
  await refreshToken.save()
}

async function register(params, origin) {
  if (await db.Account.findOne({ email: params.email })) {
    console.log(
      'We already have this user in the data store (already registered), User email: [' +
        params.email +
        ' ]',
    )
    errorHandler.error('We already have this user in the data store (already registered), User email: [' + params.email + ' ]');
    return await sendAlreadyRegisteredEmail(params.email, origin)
  }

  try {
    const account = new db.Account(params)

    const isFirstAccount = (await db.Account.countDocuments({})) === 0
    account.role = isFirstAccount ? Role.Admin : Role.User

    account.verificationToken = randomTokenString()

    account.passwordHash = hash(params.password)

    await account.save()

    await sendVerificationEmail(account, origin)
  } catch (error) {
    console.error(
      new Error(
        `Whoops, wasnt able to save the new accout or to send a verification mail. Reason: [ ${error} ]`
      )
    );
    errorHandler.error(`Whoops, wasnt able to save the new accout or to send a verification mail. Reason: [ ${error} ]`);
  }
}

async function verifyEmail(token) {
  const account = await db.Account.findOne({ verificationToken: token })

  if (!account) throw 'Verification failed'

  account.verified = Date.now()
  account.verificationToken = undefined

  try {
    await account.save()
  } catch (error) {
    console.error(
      new Error(
        `Whoops, wasnt able to save the new accout while verifying users email. Reason: [ ${error} ]`
      )
    );
    errorHandler.error(`Whoops, wasnt able to save the new accout while verifying users email. Reason: [ ${error} ]`);
  }
}

async function forgotPassword({ email }, origin) {
  const account = await db.Account.findOne({ email })

  if (!account) return

  account.resetToken = {
    token: randomTokenString(),
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  }
  await account.save()

  await sendPasswordResetEmail(account, origin)
}

async function validateResetToken({ token }) {
  const account = await db.Account.findOne({
    'resetToken.token': token,
    'resetToken.expires': { $gt: Date.now() },
  })

  if (!account) throw 'Invalid token'
}

async function resetPassword({ token, password }) {
  const account = await db.Account.findOne({
    'resetToken.token': token,
    'resetToken.expires': { $gt: Date.now() },
  })

  if (!account) throw 'Invalid token'

  account.passwordHash = hash(password)
  account.passwordReset = Date.now()
  account.resetToken = undefined
  await account.save()
}

async function getAll() {
  const accounts = await db.Account.find()
  return accounts.map((x) => basicDetails(x))
}

async function getById(id) {
  const account = await getAccount(id)
  return basicDetails(account)
}

async function create(params) {
  if (await db.Account.findOne({ email: params.email })) {
    throw `Email "${params.email}" is already registered`
  }

  const account = new db.Account(params)
  account.verified = Date.now()

  account.passwordHash = hash(params.password)

  await account.save()

  return basicDetails(account)
}

async function update(id, params) {
  const account = await getAccount(id)

  if (
    params.email &&
    account.email !== params.email &&
    (await db.Account.findOne({ email: params.email }))
  ) {
    throw 'Email "' + params.email + '" is already taken'
  }

  if (params.password) {
    params.passwordHash = hash(params.password)
  }

  Object.assign(account, params)
  account.updated = Date.now()
  await account.save()

  return basicDetails(account)
}

async function _delete(id) {
  const account = await getAccount(id)
  await account.remove()
}

async function getAccount(id) {
  if (!db.isValidId(id)) throw 'Account not found'
  const account = await db.Account.findById(id)
  if (!account) throw 'Account not found'
  return account
}

async function getRefreshToken(token) {
  const refreshToken = await db.RefreshToken.findOne({ token }).populate(
    'account'
  )
  if (!refreshToken || !refreshToken.isActive) throw 'Invalid token'
  return refreshToken
}

function hash(password) {
  return bcrypt.hashSync(password, 10)
}

function generateJwtToken(account) {
  return jwt.sign({ sub: account.id, id: account.id }, config.secret, {
    expiresIn: '15m',
  })
}

function generateRefreshToken(account, ipAddress) {
  return new db.RefreshToken({
    account: account.id,
    token: randomTokenString(),
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdByIp: ipAddress,
  })
}

function randomTokenString() {
  return crypto.randomBytes(40).toString('hex')
}

function basicDetails(account) {
  const {
    id,
    title,
    firstName,
    lastName,
    email,
    role,
    created,
    updated,
    isVerified,
  } = account
  return {
    id,
    title,
    firstName,
    lastName,
    email,
    role,
    created,
    updated,
    isVerified,
  }
}

async function sendVerificationEmail(account, origin) {
  let message
  if (origin) {
    const verifyUrl = `${origin}/account/verify-email?token=${account.verificationToken}`
    message = `<p>Please click the below link to verify your email address:</p>
                   <p><a href="${verifyUrl}">${verifyUrl}</a></p>`
  } else {
    message = `<p>Please use the below token to verify your email address with the <code>/accounts/verify-email</code> api route:</p>
                   <p><code>${account.verificationToken}</code></p>`
  }

  await sendEmail({
    to: account.email,
    subject: 'Sign-up Verification API - Verify Email',
    html: `<h4>Verify Email</h4>
               <p>Thanks for registering!</p>
               ${message}`,
  })
}

async function sendAlreadyRegisteredEmail(email, origin) {
  let message
  if (origin) {
    message = `<p>If you don't know your password please visit the <a href="${origin}/account/forgot-password">forgot password</a> page.</p>`
  } else {
    message =
      "<p>If you don't know your password you can reset it via the <code>/account/forgot-password</code> api route.</p>"
  }

  await sendEmail({
    to: email,
    subject: 'Sign-up Verification API - Email Already Registered',
    html: `<h4>Email Already Registered</h4>
               <p>Your email <strong>${email}</strong> is already registered.</p>
               ${message}`,
  })
}

async function sendPasswordResetEmail(account, origin) {
  let message
  if (origin) {
    const resetUrl = `${origin}/account/reset-password?token=${account.resetToken.token}`
    message = `<p>Please click the below link to reset your password, the link will be valid for 1 day:</p>
                   <p><a href="${resetUrl}">${resetUrl}</a></p>`
  } else {
    message = `<p>Please use the below token to reset your password with the <code>/account/reset-password</code> api route:</p>
                   <p><code>${account.resetToken.token}</code></p>`
  }

  await sendEmail({
    to: account.email,
    subject: 'Sign-up Verification API - Reset Password',
    html: `<h4>Reset Password Email</h4>
               ${message}`,
  })
}

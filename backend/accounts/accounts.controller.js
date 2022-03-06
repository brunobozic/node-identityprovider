/* eslint-disable no-shadow */
/* eslint-disable no-underscore-dangle */
/* eslint-disable global-require */
/* eslint-disable import/no-unresolved */
/* eslint-disable no-unused-vars */
/* eslint-disable no-case-declarations */
/* eslint-disable consistent-return */
/* eslint-disable no-use-before-define */
/* eslint-disable no-param-reassign */
const express = require('express')

const router = express.Router()
const Joi = require('joi')
const opentracing = require('opentracing')
const { initTracer } = require('jaeger-client')
const validateRequest = require('../_middleware/validate-request')
const authorize = require('../_middleware/authorize')
const Role = require('../_helpers/role')
const accountService = require('./account.service')

// set up our Winston logger (same instance, cached by node)
const errorHandler = require('../_helpers/winston-logger')

// set up our distributed tracer (jaeger server needs to be up and running, listening on port 14268), must be unique per each js file due to serviceName property
const config = {
  serviceName: 'accounts.controller',
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
const tracer = initTracer(config, options) // tracer used for this class gets initialiazed here

// routes must be declared here, be mindfull of the order in which they are listed, the ordering is important
router.get('/:id', authorize(), getById)
router.get('/verify-email/:token', verifyEmail)
router.post('/authenticate', authenticateSchema, authenticate)
router.post('/refresh-token', refreshToken)
router.post('/revoke-token', authorize(), revokeTokenSchema, revokeToken)
router.post('/register', registerSchema, register)
router.post('/forgot-password', forgotPasswordSchema, forgotPassword)
router.post(
  '/validate-reset-token',
  validateResetTokenSchema,
  validateResetToken
)
router.post('/reset-password', resetPasswordSchema, resetPassword)
router.get('/', authorize(Role.Admin), getAll)
router.post('/', authorize(Role.Admin), createSchema, create)
router.put('/:id', authorize(), updateSchema, update)
router.delete('/:id', authorize(), _delete)

// make routes available to other classes
module.exports = router

function authenticateSchema(req, res, next) {
  const schema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
  })
  validateRequest(req, next, schema)
}

function authenticate(req, res, next) {
  const { email, password } = req.body
  const ipAddress = req.ip
  accountService
    .authenticate({ email, password, ipAddress })
    .then(({ refreshToken, ...account }) => {
      setTokenCookie(res, refreshToken)
      res.json(account)
    })
    .catch(next)
}

function refreshToken(req, res, next) {
  const token = req.cookies.refreshToken
  const ipAddress = req.ip
  accountService
    .refreshToken({ token, ipAddress })
    .then(({ refreshToken, ...account }) => {
      setTokenCookie(res, refreshToken)
      res.json(account)
    })
    .catch(next)
}

function revokeTokenSchema(req, res, next) {
  const schema = Joi.object({
    token: Joi.string().empty(''),
  })
  validateRequest(req, next, schema)
}

function revokeToken(req, res, next) {
  const token = req.body.token || req.cookies.refreshToken
  const ipAddress = req.ip

  if (!token) return res.status(400).json({ message: 'Token is required' })

  if (!req.user.ownsToken(token) && req.user.role !== Role.Admin) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  accountService
    .revokeToken({ token, ipAddress })
    .then(() => res.json({ message: 'Token revoked' }))
    .catch(next)
}

function registerSchema(req, res, next) {
  const schema = Joi.object({
    title: Joi.string().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
    acceptTerms: Joi.boolean().valid(true).required(),
  })
  validateRequest(req, next, schema)
}

// this is a simple echo-like function used for testing
function simpleTest(req, res, next) {
  const parentSpan = tracer.extract(
    opentracing.FORMAT_HTTP_HEADERS,
    req.headers
  )

  const newLocal = 'simple test'
  const span = tracer.startSpan('simple test', {
    childOf: parentSpan,
    tags: {
      [opentracing.Tags.COMPONENT]: newLocal,
    },
  })

  errorHandler.error('simpleTest error (test)')

  span.finish()

  res.json({ message: 'Test completed succesfully' })
}

function register(req, res, next) {
  const parentSpan = tracer.extract(
    opentracing.FORMAT_HTTP_HEADERS,
    req.headers
  )

  const newLocal = 'database'
  const span = tracer.startSpan('registering a new user', {
    childOf: parentSpan,
    tags: {
      [opentracing.Tags.COMPONENT]: newLocal,
    },
  })

  accountService
    .register(req.body, req.get('origin'))
    .then(errorHandler.info('register route called'))
    .then(() =>
      res.json({
        message:
          'Registration successful, please check your email for verification instructions',
      })
    ) // how do I log in here?
    .catch(next, span) // span.setTag(opentracing.Tags.ERROR, true) // TODO: how do I do this then?
}

/* function verifyEmailSchema(req, res, next) {
  const schema = Joi.object({
    token: Joi.string().required(),
  })
  validateRequest(req, next, schema)
} */

function verifyEmail(req, res, next) {
  console.log(req.params.token)

  accountService
    .verifyEmail(req.params.token)
    .then(() =>
      res.json({ message: 'Verification successful, you can now login' })
    )
    .catch(next)
}

function forgotPasswordSchema(req, res, next) {
  const schema = Joi.object({
    email: Joi.string().email().required(),
  })
  validateRequest(req, next, schema)
}

function forgotPassword(req, res, next) {
  accountService
    .forgotPassword(req.body, req.get('origin'))
    .then(() =>
      res.json({
        message: 'Please check your email for password reset instructions',
      })
    )
    .catch(next)
}

function validateResetTokenSchema(req, res, next) {
  const schema = Joi.object({
    token: Joi.string().required(),
  })
  validateRequest(req, next, schema)
}

function validateResetToken(req, res, next) {
  accountService
    .validateResetToken(req.body)
    .then(() => res.json({ message: 'Token is valid' }))
    .catch(next)
}

function resetPasswordSchema(req, res, next) {
  const schema = Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
  })
  validateRequest(req, next, schema)
}

function resetPassword(req, res, next) {
  accountService
    .resetPassword(req.body)
    .then(() =>
      res.json({ message: 'Password reset successful, you can now login' })
    )
    .catch(next)
}

function getAll(req, res, next) {
  accountService
    .getAll()
    .then((accounts) => res.json(accounts))
    .catch(next)
}

function getById(req, res, next) {
  if (req.params.id !== req.user.id && req.user.role !== Role.Admin) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  accountService
    .getById(req.params.id)
    .then((account) => (account ? res.json(account) : res.sendStatus(404)))
    .catch(next)
}

function createSchema(req, res, next) {
  const schema = Joi.object({
    title: Joi.string().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
    role: Joi.string().valid(Role.Admin, Role.User).required(),
  })
  validateRequest(req, next, schema)
}

function create(req, res, next) {
  accountService
    .create(req.body)
    .then((account) => res.json(account))
    .catch(next)
}

function updateSchema(req, res, next) {
  const schemaRules = {
    title: Joi.string().empty(''),
    firstName: Joi.string().empty(''),
    lastName: Joi.string().empty(''),
    email: Joi.string().email().empty(''),
    password: Joi.string().min(6).empty(''),
    confirmPassword: Joi.string().valid(Joi.ref('password')).empty(''),
  }

  if (req.user.role === Role.Admin) {
    schemaRules.role = Joi.string().valid(Role.Admin, Role.User).empty('')
  }

  const schema = Joi.object(schemaRules).with('password', 'confirmPassword')
  validateRequest(req, next, schema)
}

function update(req, res, next) {
  if (req.params.id !== req.user.id && req.user.role !== Role.Admin) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  accountService
    .update(req.params.id, req.body)
    .then((account) => res.json(account))
    .catch(next)
}

function _delete(req, res, next) {
  if (req.params.id !== req.user.id && req.user.role !== Role.Admin) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  accountService
    .delete(req.params.id)
    .then(() => res.json({ message: 'Account deleted successfully' }))
    .catch(next)
}
function setTokenCookie(res, token) {
  const cookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  }
  res.cookie('refreshToken', token, cookieOptions)
}

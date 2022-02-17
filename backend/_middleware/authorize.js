/* eslint-disable consistent-return */
/* eslint-disable no-use-before-define */
/* eslint-disable no-param-reassign */
const jwt = require('express-jwt')
const { secret } = require('../config.json')
const db = require('../_helpers/db')

module.exports = authorize

function authorize(roles = []) {
  if (typeof roles === 'string') {
    roles = [roles]
  }

  const myJwt = jwt({ secret, algorithms: ['HS256'] }).unless({
    path: [
      '/simple-test',
      '/accounts/simple-test',
      '/verify-email',
      '/accounts/verify-email',
    ],
  })

  return [
    myJwt,
    async (req, res, next) => {
      if (req.url !== '/simple-test' && req.path !== '/verify-email') {
        const account = await db.Account.findById(req.user.id)
        const refreshTokens = await db.RefreshToken.find({
          account: account.id,
        })

        if (!account || (roles.length && !roles.includes(account.role))) {
          return res.status(401).json({ message: 'Unauthorized' })
        }

        req.user.role = account.role
        req.user.ownsToken = (token) =>
          !!refreshTokens.find((x) => x.token === token)
        next()
      }else{

      next()}
    },
  ]
}

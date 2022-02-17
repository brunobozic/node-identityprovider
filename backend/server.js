/* eslint-disable no-unused-vars */
/* eslint-disable spaced-comment */
//require('rootpath')();
const express = require('express')

const app = express()
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const logger = require('winston')
const expressWinston = require('express-winston')
const errorHandler = require('./_middleware/error-handler')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cookieParser())

// set up our Winston logger
const winstonErrorLogger = require('./_helpers/winston-logger')

app.use(
    expressWinston.logger({
      transports: [new logger.transports.Console()],
      format: logger.format.combine(
        logger.format.colorize(),
        logger.format.json()
      ),
      meta: false,
      msg: 'HTTP  ',
      expressFormat: true,
      colorize: false,
      ignoreRoute(_req, _res) {
        return false
      },
    })
  )



// allow cors requests from any origin and with credentials
app.use(
  cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
  })
)

// api routes
app.use('/accounts', require('./accounts/accounts.controller'))

// swagger docs route
app.use('/api-docs', require('./_helpers/swagger'))

// global error handler
app.use(errorHandler)


// start server
const port =
  process.env.NODE_ENV === 'production' ? process.env.PORT || 8080 : 4000
app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
  winstonErrorLogger.info(`Server started and running on http://host:${port}`)
})

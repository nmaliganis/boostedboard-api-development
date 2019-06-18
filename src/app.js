'use strict'

const cluster = require('cluster')
const Koa = require('koa')
const koaBody = require('koa-body')
const koaCompress = require('koa-compress')
const koaCors = require('kcors')
const koaResponseTime = require('koa-response-time')
const config = require('./config')
const log = require('./common/logger')
const defaultRoutes = require('./routes/default')
const userRoutes = require('./routes/user')
const adminRoutes = require('./routes/admin')
const middleware = require('./middleware')
const db = require('./database')

const app = new Koa()
app.proxy = config.server.proxy

// Setup middleware
app.use(koaCompress())
app.use(middleware.errors.handleErrors)
app.use(koaResponseTime())
app.use(koaBody(config.server.bodyParser))
app.use(koaCors(config.server.cors))
app.use(middleware.auth)

// Serve documentation
if (config.env !== 'production') {
  app.use(middleware.docs)
}

// Setup routes
app.use(defaultRoutes)
app.use(userRoutes)
app.use(adminRoutes)

// Start method
app.start = () => {
  log.info('Starting http server ...')
  app.server = app.listen(config.server.port, () => {
    log.info(`==> 🌎  Server listening on port ${config.server.port}.`)
  })
}

// Stop method
app.stop = () => {
  if (!app.server) {
    log.warn('Server not initialized yet.')
    return
  }

  log.info('Closing database connections.')
  db.sequelize.close()

  log.info('Stopping server ...')
  app.server.close(() => {
    log.info('Server stopped.')
  })
}

// Something can happen outside the error handling middleware, keep track of that
app.on('error', err => log.error(err, 'Unhandled application error.'))

// Something can go terribly wrong, keep track of that
process.once('uncaughtException', fatal)
process.once('unhandledRejection', fatal)

function fatal(err) {
  log.fatal(err, 'Fatal error occurred. Exiting the app.')

  // If the server does not terminate itself in a specific time, just kill it
  setTimeout(() => {
    throw err
  }, 5000).unref()
}

// If app was executed directly through node command or in a worker process
if (require.main === module || cluster.isWorker) {
  app.start()

  process.once('SIGINT', () => app.stop())
  process.once('SIGTERM', () => app.stop())
}

module.exports = app

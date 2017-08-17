const express = require('express')
const uppy = require('../uppy')
const helmet = require('helmet')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const expressValidator = require('express-validator')
const promBundle = require('express-prom-bundle')
const session = require('express-session')
const helper = require('./helper')
helper.validateConfig()

const app = express()

const metricsMiddleware = promBundle({includeMethod: true, includePath: true})

const promClient = metricsMiddleware.promClient
const collectDefaultMetrics = promClient.collectDefaultMetrics
collectDefaultMetrics({ register: promClient.register })

// log server requests.
app.use(morgan('combined'))

// make app metrics available at '/metrics'.
app.use(metricsMiddleware)

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(expressValidator())
app.use(cookieParser())

// Use helmet to secure Express headers
app.use(helmet.frameguard())
app.use(helmet.xssFilter())
app.use(helmet.noSniff())
app.use(helmet.ieNoOpen())
app.disable('x-powered-by')

const sessionOptions = {
  secret: process.env.UPPYSERVER_SECRET,
  resave: true,
  saveUninitialized: true
}

if (process.env.UPPYSERVER_REDIS_URL) {
  const RedisStore = require('connect-redis')(session)
  sessionOptions.store = new RedisStore({
    url: process.env.UPPYSERVER_REDIS_URL
  })
}

app.use(session(sessionOptions))

app.use((req, res, next) => {
  const protocol = process.env.UPPYSERVER_PROTOCOL || 'http'

  if (process.env.UPPY_ENDPOINTS) {
    const whitelist = process.env.UPPY_ENDPOINTS
      .split(',')
      .map((domain) => `${protocol}://${domain}`)

    if (req.headers.origin && whitelist.indexOf(req.headers.origin) > -1) {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin)
    }
  } else {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
  }

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS, PUT, PATCH, DELETE'
  )
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Authorization, Origin, Content-Type, Accept'
  )
  res.setHeader('Access-Control-Allow-Credentials', true)
  next()
})

// Routes
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/plain')
  res.send(
    [ 'Welcome to Uppy Server', '======================', '' ].join('\n')
  )
})

// initialize uppy
const uppyOptions = helper.getUppyOptions()
if (process.env.UPPYSERVER_PATH) {
  app.use(process.env.UPPYSERVER_PATH, uppy.app(uppyOptions))
} else {
  app.use(uppy.app(uppyOptions))
}

app.use((req, res, next) => {
  const err = new Error('Not Found')
  err.status = 404
  next(err)
})

if (app.get('env') === 'production') {
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ message: 'Something went wrong' })
  })
} else {
  app.use((err, req, res, next) => {
    console.error('\x1b[31m', err.stack, '\x1b[0m')
    res.status(err.status || 500).json({ message: err.message, error: err })
  })
}

module.exports = { app, uppyOptions }
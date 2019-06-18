'use strict'

const path = require('path')
const compose = require('koa-compose')
const koaStatic = require('koa-static2')
const Router = require('koa-router')

module.exports = compose([
  new Router().redirect('/docs', '/docs/index.html').routes(),
  new Router().redirect('/redoc', '/docs/redoc.html').routes(),
  new Router().redirect('/swagger3', '/docs/swagger3.html').routes(),

  // Serves swagger.yaml, redoc.html, swagger3.html
  koaStatic('docs', path.join(__dirname, '../../docs')),

  // Swagger2, redirect, HTML and assets
  new Router().redirect('/swagger2', '/swagger2/swagger2.html').routes(),
  koaStatic('swagger2', path.join(__dirname, '../../docs')),
  koaStatic('swagger2', path.join(__dirname, '../../node_modules/swagger-ui/dist')),
])

'use strict'

const { initializeApp, credential } = require('firebase-admin')
const { firebase } = require('../../config')

let initialized = false
let instance

function createClient() {
  const serviceAccount = JSON.parse(firebase.serviceAccount)

  instance = initializeApp({
    credential: credential.cert(serviceAccount),
  }, 'instanceAdmin')

  initialized = true
}

exports.messaging = () => {
  if (!initialized) {
    createClient()
  }

  return instance.messaging()
}

'use strict'

const errors = require('../common/errors')

/**
   * Parse csv file into an array of keyed objects
   * @param {String} input Csv file input
   * @param {String} isEncoded is csv base64 encoded
   * @param {String} schema Csv file schema
   * @returns {Array} Array of objects
   */
exports.load = (input, isEncoded, schema) => {
  let csv = {}
  let values = []
  if (input) {
    if (isEncoded) {
      const encodedFile = input.split(',')[1]
      csv = Buffer.from(encodedFile, 'base64').toString('ascii').replace(/\r/gu, '')
    }

    if (csv === null || csv === '') {
      return []
    }

    const splitter = csv.includes(';') ? ';' : ','
    const lines = csv.split('\n')

    const header = lines[0].split(splitter)
    if (schema && schema.find(element => !header.includes(element))) {
      throw new errors.ValidationError(`Csv schema does not match with received file, expecting at least [${schema}].`)
    }

    const rows = lines.slice(1)

    values = rows.map(row => row.split(splitter))
    values = values.map(event => {
      const parsedEvent = {}
      for (let i = 0; i < header.length; ++i) {
        parsedEvent[header[i]] = event[i]
      }
      return parsedEvent
    })

  }

  return values
}

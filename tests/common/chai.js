'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const dirtyChai = require('dirty-chai')
const shallowDeepEqual = require('chai-shallow-deep-equal')
const sinonChai = require('sinon-chai')
const chaiDeepCloseTo = require('chai-deep-closeto')

chai.use(chaiDeepCloseTo)
chai.use(chaiAsPromised)
chai.use(dirtyChai)
chai.use(shallowDeepEqual)
chai.use(sinonChai)

module.exports = chai

'use strict'

const user = ['id',
  'email',
  'gender',
  'name',
  'height',
  'weight',
  'pictureUrl',
  'role',
  'createdAt',
  'updatedAt']

module.exports = {
  user,
  userWithBoards: [...user, 'boards'],
  board: ['id', 'serial', 'name', 'batterySerial', 'motorDriverSerial', 'createdAt', 'updatedAt', 'purchaseLocation', 'firmwareVersion', 'type'],
  auth: ['accessToken', 'refreshToken', 'profile', 'isNewUser'],
  summary: ['totalCount', 'today', 'last7days', 'last30days'],
  boardsSummary: ['boardRegistrations', 'connectedBoards'],
}

'use strict'

function getDateshiftedByDays(days) {
  const today = new Date()
  today.setDate(today.getDate() + days)
  return today
}

const pushTokenData = {
  token: 'ABCD',
  deviceId: 'DEV1',
}

const pushTokenData2 = {
  token: 'ABCDE',
  deviceId: 'DEV2',
}

const pushTokenWithoutDeviceIdData = {
  token: 'ABCD',
}

const pragueData = {
  name: 'Prague',
  location: [14.42076, 50.08804],
}

const seoulData = {
  name: 'Seoul',
  location: [126.9780, 37.5665],
}

const liberecData = {
  name: 'Liberec',
  location: [15.0543, 50.7663],
}

const event1Data = {
  name: 'First Event',
  description: 'Event used for testing.',
  startDate: new Date().toISOString(),
  endDate: getDateshiftedByDays(1).toISOString(),
  location: 'STRV Prague scroll bar',
  cityId: 2,
  imageUrl: 'http://jvgenbk.xl/obfg',
  link: {
    text: 'Check it out',
    url: 'https://s3-media3.fl.yelpcdn.com/bphoto/buXPorfsYjxAf_wOAdAUGA/o.jpg',
  },
}

const event2Data = {
  name: 'Second Event',
  description: 'Event used for another testing',
  startDate: new Date().toISOString(),
  endDate: getDateshiftedByDays(1).toISOString(),
  location: 'Deongdemun Design Plaza',
  cityId: 3,
  imageUrl: 'http://pppkons.ig/xip',
  link: {
    text: 'Exhibition',
    url: 'http://english.visitseoul.net/attractions/Dongdaemun-Design-Plaza-DDP_/96',
  },
}

const globalEventData = {
  name: 'Event for everyone',
  description: 'Global event used for testing',
  startDate: new Date().toISOString(),
  endDate: getDateshiftedByDays(1).toISOString(),
  location: 'AJOU Hwa-hong Hall',
  cityId: null,
  imageUrl: 'http://ktsocvjuf.js/xvq4',
  link: {
    text: 'Welcome to AJOU',
    url: 'https://www.ajou.ac.kr/en/international/inter07_01.jsp',
  },
}

const olderEventData = {
  name: 'Old event',
  description: 'This event should not be shown',
  startDate: getDateshiftedByDays(-3).toISOString(),
  endDate: getDateshiftedByDays(-2).toISOString(),
  location: '나즈드라비 체코 팝',
  cityId: 3,
  imageUrl: 'http://xepxxs.qp/aue',
  link: {
    text: 'Gangnam',
    url: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
  },
}


module.exports = {
  pushTokenData,
  pushTokenData2,
  pushTokenWithoutDeviceIdData,
  pragueData,
  seoulData,
  liberecData,
  event1Data,
  event2Data,
  globalEventData,
  olderEventData,
}

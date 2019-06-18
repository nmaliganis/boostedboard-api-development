'use strict'

const bluebird = require('bluebird')
const config = require('../../config')
const log = require('../../common/logger')
const errors = require('../../common/errors')
const { subscribedEndpointArnsForCity } = require('../../database/helpers')
const { Op } = require('../../database')
const db = require('../../database')
const sns = require('./aws-sns-service')

async function pushlishPayload(payload, options) {
  payload = JSON.stringify(payload)
  const publishParams = {
    Message: payload,
    MessageStructure: 'json',
  }

  if (options.TopicArn && options.TargetArn) {
    throw new errors.InternalServerError('Cannot call publish with both TopicArn and TargetArn')
  } else if (!options.TopicArn && !options.TargetArn) {
    throw new errors.InternalServerError('Publish needs to be called with either TopicArn or TargetArn')
  }

  if (options.TopicArn) {
    publishParams.TopicArn = options.TopicArn
  } else {
    publishParams.TargetArn = options.TargetArn
  }

  log.info(publishParams, 'publishing message (push notification)')

  try {
    await sns.publish(publishParams).promise()
  } catch (err) {
    if (err.name === 'EndpointDisabled') {
      return options.TargetArn
    }
    throw err
  }
  return null
}

function getPushNotificationPayload(event, imageUrl, city) {
  const cityPart = city
    ? {
      id: city.id,
      name: city.name,
      timeZome: city.timeZone,
      location: city.location,
    }
    : null

  const androidPayload = {
    data: {
      pushNotificationType: 'inboxMessage',
      content: {
        messageType: 'event',
        messageData: {
          id: event.id,
          name: event.name,
          description: event.description,
          startDate: event.startDate.toISOString(),
          endDate: event.endDate.toISOString(),
          imageUrl,
          city: cityPart,
        },
      },
    },
  }

  const iosPayload = {
    aps: {
      alert: {
        title: event.name,
        body: event.description,
      },
      badge: 1,
      sound: 'default',
    },
    pushNotificationType: 'inboxMessage',
    content: {
      messageType: 'event',
      messageData: {
        id: event.id,
      },
    },
  }

  return {
    default: `${event.name}`,
    GCM: JSON.stringify(androidPayload),
    APNS: JSON.stringify(iosPayload),
    APNS_SANDBOX: JSON.stringify(iosPayload),
  }
}

module.exports = {
  async generatePlatformEndpointArn(pushToken) {
    let platformApplicationArn
    if (pushToken.deviceId) {
      platformApplicationArn = config.aws.sns.androidArn
    } else {
      platformApplicationArn = config.aws.sns.iosArn
    }

    const createPlatformEndpointParams = {
      PlatformApplicationArn: platformApplicationArn,
      Token: pushToken.token,
    }

    log.info(createPlatformEndpointParams, 'createPlatformEndpoint')

    const response = await sns.createPlatformEndpoint(createPlatformEndpointParams).promise()

    return response.EndpointArn
  },

  async subscribeToTopic(topicArn, endpointArn) {
    const subscribeParams = {
      TopicArn: topicArn,
      Endpoint: endpointArn,
      Protocol: 'application',
    }

    log.info(subscribeParams, 'subscribe to a topic')

    const response = await sns.subscribe(subscribeParams).promise()

    const subscriptionArn = response.SubscriptionArn
    return { endpointArn, subscriptionArn }
  },

  async unsubscribeFromTopic(subscriptionArn) {
    log.info(subscriptionArn, 'unsubscribe with ARN')

    await sns.unsubscribe({ SubscriptionArn: subscriptionArn }).promise()
  },

  async publishToCity(event, imageUrl, city) {
    log.info(city.get(), 'publishing to a city')
    const payload = getPushNotificationPayload(event, imageUrl, city)
    const endpointArns = (await subscribedEndpointArnsForCity(city.id)).map(elem => elem.endpointArn)

    const failedEndpoints = await bluebird.map(
      endpointArns, arn => pushlishPayload(payload, { TargetArn: arn }),
      { concurrency: config.concurrency.limit },
    ).filter(Boolean)

    db.PushToken.update({
      enabled: false,
    }, { where: {
      endpointArn: {
        [Op.in]: failedEndpoints,
      },
    } })
  },

  publishToTopic(topicArn, event, imageUrl) {
    log.info(topicArn, 'publishing to a topic')
    const payload = getPushNotificationPayload(event, imageUrl)
    return pushlishPayload(payload, { TopicArn: topicArn })
  },

  enableEndpoint(endpointArn) {
    const setAttributesParams = {
      Attributes: {
        Enabled: true,
      },
      EndpointArn: endpointArn,
    }

    log.info(setAttributesParams, 'Enabling endpoint')
    return sns.setEndpointAttributes(setAttributesParams).promise()
  },
}

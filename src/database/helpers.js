'use strict'

const { daysBetween, startOfDay, endOfDay } = require('../utils/date')
const { sequelize, Op } = require('.')

const SEARCHABLE_USER_COLUMNS = ['name', 'email', 'createdAt']
const SEARCHABLE_BOARD_COLUMNS = ['serial']

async function executeQuery(queryString, options) {
  if (options) {
    return sequelize.query(queryString, options)
  }
  return (await sequelize.query(queryString))[0]
}

const totalMileageQuery = `
  SELECT SUM(odometer)
  FROM (
    SELECT MAX("odometerTotal") as odometer, "boardId"
    FROM mileage
    GROUP BY "boardId"
  ) as odometer
`

const citySubscribersQuery = `
  SELECT cities.*, count(subscriptions.id) as "subscriberCount"
  FROM "citySubscriptions" as subscriptions
  RIGHT JOIN cities
  ON cities.id = subscriptions."cityId"
  GROUP BY subscriptions."cityId", cities.id;
`

const eventsForUserQuery = `
SELECT
U.*,
CASE
  WHEN mi."messageState"::text IS NOT NULL then mi."messageState"::text
  ELSE 'new'
END as "messageState"
FROM (
  SELECT
    events.id,
    events.name,
    events.description,
    events."startDate",
    events."endDate",
    events.location,
    events."imageUrl",
    events."linkText",
    events."linkUrl",
    events."createdAt",
    events."updatedAt",
    events."publishedAt",
    registrations.going,
    cities.name as "cityName",
    cities.location as "cityLocation",
    cities.radius as "cityRadius",
    cities.id as "cityId",
    cities."imageUrl" as "cityImageUrlFallback",
    cities."createdAt" as "cityCreatedAt",
    cities."updatedAt" as "cityUpdatedAt",
    cities."timeZone" as "cityTimeZone"
  FROM events
  LEFT JOIN (
    SELECT *
    FROM "eventRegistrations"
    WHERE "userId" = :userId
  ) as registrations
  ON events."id" = registrations."eventId"
  LEFT JOIN cities
  ON events."cityId" = cities.id
  WHERE registrations."userId" IS NULL AND (
    events."cityId" IS NULL OR
    events."cityId" IN (
      SELECT "cityId"
      FROM "citySubscriptions"
      WHERE "userId" = :userId
    )
  )
  UNION ALL
  SELECT
    events.id,
    events.name,
    events.description,
    events."startDate",
    events."endDate",
    events.location,
    events."imageUrl",
    events."linkText",
    events."linkUrl",
    events."createdAt",
    events."updatedAt",
    events."publishedAt",
    registrations.going,
    cities.name as "cityName",
    cities.location as "cityLocation",
    cities.radius as "cityRadius",
    cities.id as "cityId",
    cities."imageUrl" as "cityImageUrlFallback",
    cities."createdAt" as "cityCreatedAt",
    cities."updatedAt" as "cityUpdatedAt",
    cities."timeZone" as "cityTimeZone"
  FROM events
  JOIN "eventRegistrations" as registrations
  ON events.id = registrations."eventId"
  LEFT JOIN cities
  ON events."cityId" = cities.id
  WHERE registrations."userId" = :userId
) AS U
LEFT JOIN "messageInteractions" as mi
ON mi."userId" = :userId AND mi."eventId" = U.id
WHERE U."endDate" > NOW() - INTERVAL '1 days'
`

const eventsForUserOrderedQuery = `
${eventsForUserQuery}
ORDER BY U."publishedAt" DESC
`

const singleEventForUserQuery = `
${eventsForUserQuery}
AND U.id = :eventId
`

const eventsForAdminsWithRPSVQuery = `
SELECT m.*,
COUNT(DISTINCT (CASE WHEN going THEN r."userId" END)) as attending,
COUNT(DISTINCT (CASE WHEN NOT going THEN r."userId" END)) as rejected,
CASE WHEN m."cityId" IS NULL THEN
  (SELECT COUNT(*) FROM users)
ELSE
  (COALESCE(sub2.subscribers, 0) + COALESCE(sub1."reactionsWithoutSubscribe", 0))
END as subscribed
FROM events as m
LEFT JOIN "eventRegistrations" as r
ON m.id = r."eventId"
LEFT JOIN (
  SELECT er."eventId" as "eventId", COUNT(er."userId") as "reactionsWithoutSubscribe"
  FROM "eventRegistrations" as er
  JOIN events as e
  ON er."eventId" = e.id
  LEFT JOIN "citySubscriptions" as sub
  ON e."cityId" = sub."cityId" AND sub."userId" = er."userId"
  WHERE e."cityId" IS NOT NULL
  AND sub.id IS NULL
  GROUP BY er."eventId"
) as sub1
on m.id = sub1."eventId"
LEFT JOIN (
  SELECT subs."cityId" as "cityId", COUNT(subs."userId") as subscribers
  FROM "citySubscriptions" as subs
  GROUP BY subs."cityId"
) as sub2
on m."cityId" = sub2."cityId"
GROUP BY m.id, sub1."reactionsWithoutSubscribe", sub2.subscribers
ORDER BY m.id DESC
`

// /* eslint-disable-next-line id-length */
// const eventsInCityForAdminsWithRPSVQuery = `
// ${eventsForAdminsWithRPSVQuery}
// WHERE m.cityId = :cityId
// `

const unsubscribedCitiesForUserQuery = `
SELECT c.*
FROM cities as c
LEFT JOIN "citySubscriptions" as cs
ON cs."cityId" = c.id AND
  cs."userId" = :userId
WHERE cs."userId" IS NULL;
`

const dailyAveragesFromMileageQuery = `
INSERT INTO "dailyAverages" ("day", "mileageId", "average")
SELECT
generate_series(
  :startDate :: DATE,
  :endDate :: DATE,
  '1 day' :: INTERVAL
) :: DATE as "day",
:mileageId AS "mileageId",
:average AS average
`

/* eslint-disable-next-line id-length */
const subscribedEndpointArnsForCityQuery = `
SELECT pt."endpointArn"
FROM "pushTokens" as pt
WHERE pt."userId" IN (
  SELECT cs."userId"
  FROM "citySubscriptions" as cs
  WHERE cs."cityId" = :cityId
)
AND pt.enabled = true
`

module.exports = {
  SEARCHABLE_BOARD_COLUMNS,
  SEARCHABLE_USER_COLUMNS,

  userSearchQuery(searchColumn, searchQuery) {
    if (!searchQuery || !searchColumn) {
      return null
    }

    if (searchColumn === 'createdAt') {
      return sequelize.where(sequelize.fn('to_char', sequelize.col('user.createdAt'), 'YYYY-MM-DD'), 'iLIKE', `%${searchQuery}%`)
    }

    const where = {}
    if (SEARCHABLE_USER_COLUMNS.includes(searchColumn)) {
      where[searchColumn] = { [Op.iLike]: `%${searchQuery}%` }
    }

    return where
  },

  boardSearchQuery(searchColumn, searchQuery) {
    if (!searchQuery || !searchColumn) {
      return null
    }

    const where = {}
    if (searchColumn === 'serial') {
      // performance tuning!
      where[searchColumn] = { [Op.eq]: searchQuery.toUpperCase() }
    } else if (SEARCHABLE_BOARD_COLUMNS.includes(searchColumn)) {
      where[searchColumn] = { [Op.iLike]: `%${searchQuery}%` }
    }

    return where
  },

  totalMileage() {
    return executeQuery(totalMileageQuery)
  },

  citySubscribers() {
    return executeQuery(citySubscribersQuery)
  },

  singleEventForUser(userId, eventId) {
    const options = { replacements: { userId, eventId }, type: sequelize.QueryTypes.SELECT }
    return executeQuery(singleEventForUserQuery, options)
  },

  eventsForUser(userId) {
    const options = { replacements: { userId }, type: sequelize.QueryTypes.SELECT }
    return executeQuery(eventsForUserOrderedQuery, options)
  },

  eventsForAdminsWithRPSV() {
    return executeQuery(eventsForAdminsWithRPSVQuery)
  },

  // eventsInCityForAdminsWithRPSV(cityId) {
  //   const options = { replacements: { cityId }, type: sequelize.QueryTypes.SELECT }
  //   return executeQuery(eventsInCityForAdminsWithRPSVQuery, options)
  // },

  unsubscribedCitiesForUser(userId) {
    const options = { replacements: { userId }, type: sequelize.QueryTypes.SELECT }
    return executeQuery(unsubscribedCitiesForUserQuery, options)
  },

  dailyAveragesFromMileage(mileage) {
    const startDate = startOfDay(mileage.differenceSince)
    const endDate = endOfDay(mileage.createdAt)
    const days = daysBetween(startDate, endDate)

    const average = mileage.odometerDifference / days

    const options = { replacements: {
      startDate: startDate.format('YYYY-MM-DD'),
      endDate: endDate.format('YYYY-MM-DD'),
      mileageId: mileage.id,
      average,
    },
    type: sequelize.QueryTypes.INSERT }

    return executeQuery(dailyAveragesFromMileageQuery, options)
  },

  subscribedEndpointArnsForCity(cityId) {
    const options = { replacements: { cityId }, type: sequelize.QueryTypes.SELECT }
    return executeQuery(subscribedEndpointArnsForCityQuery, options)
  },
}

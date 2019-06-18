'use strict'

/* eslint-disable no-underscore-dangle, no-process-env */
const Transform = require('stream').Transform
const CloudWatchStream = require('awslogs-stream')
const config = require('./config')

// The source process emits each log entry on a single line -> make a splitter for it, stdin can
// emit 'data' events which do not contain the whole line if the payload is larger than its max
// buffer size.
// Also, it would have been trivial to just do chunk.toString().split('\n'), but that could be much
// slower. Besides, even if we emit a string, it will be converted to buffer again, so it seems
// wasteful.
const splitter = new Transform({
  transform(chunk, encoding, done) {
    let rest = this._cache
      ? Buffer.concat([this._cache, chunk])
      : chunk
    let nlIndex

    this._cache = null

    // As long as we keep finding newlines, keep making slices of the buffer and push them to the
    // readable side of the transform stream
    while ((nlIndex = rest.indexOf('\n')) !== -1) {
      // The `end` parameter is non-inclusive, so increase it to include the newline we found
      const line = rest.slice(0, ++nlIndex)
      // Start is inclusive, but we are already one char ahead of the newline -> all good
      rest = rest.slice(nlIndex)
      this.push(line)
    }

    // We split by newlines, but there is still some remaining data -> save for later
    if (rest.length) {
      this._cache = rest
    }

    return void done()
  },
})

// If the line is too long it need to be truncated. The CloudWatch stream can send only logs with
// limited size. If a longer item is sent the stream crashes which will crash the whole app.
// Therefore if the log is too long a error message is logged with the truncated part of the log.
const truncater = new Transform({
  transform(chunk, encoding, done) {
    const byteLimit = config.logging.cloudwatch.maxBytePayloadPerLog

    if (chunk.byteLength > byteLimit) {
      const errorLogMessageStart = Buffer.from(
        `Logging failure. Logged object is too large: ${chunk.byteLength} bytes. Log content is truncated: `,
        'utf8',
      )
      const truncatedLine = Buffer.from(`${chunk.toString('utf8').substring(0, byteLimit)}\n`, 'utf8')
      this.push(Buffer.concat([errorLogMessageStart, truncatedLine]))
    } else {
      this.push(chunk)
    }

    return void done()
  },
})

const initCloudWatchStream = () => {
  // Set up a pretty name for our AWS CloudWatch log group, eg. dojaco-api-staging
  const logGroupName = `${config.appName}-${config.env}`
  // Set a unique AWS CloudWatch stream name for every app instance
  // eg: v79/web.1/2017-04-11T15-30-48.599Z
  const logStreamName = `${process.env.HEROKU_RELEASE_VERSION}/${process.env.DYNO}/${new Date()
    .toISOString()}`.replace(/[^.\-_/A-Za-z0-9]/gu, '-')
  const cwstream = new CloudWatchStream({
    logGroupName,
    logStreamName,
    cloudWatchLogsOptions: config.logging.cloudwatch.options,
    processLogRecord(buffer) {
      return {
        message: buffer.toString('utf8'),
        timestamp: Date.now(),
      }
    },
  })

  process.stdin.pipe(splitter).pipe(truncater).pipe(cwstream)
}

if (config.logging.cloudwatch.enabled) {
  initCloudWatchStream()
}

process.stdin.pipe(process.stdout)

// Do not exit on terminating signals - wait until stdin emits 'end' event and all pending log
// writes are flushed to server, resulting in clean exit
process.once('SIGINT', () => {})
process.once('SIGTERM', () => {})

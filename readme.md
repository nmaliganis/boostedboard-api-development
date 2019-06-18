# Boosted Board API

## Stack overview
- Koa 2
- Mocha tests with Instanbul (Nyc) code coverage
- ESlint with STRV JavaScript rules
- Sequelize migrations
- Development database hosting with Docker
- Swagger documentation
- Heroku for application hosting, database and CI
- Amazon SES (Simple Email Service)
- Amazon S3 (Simple Storage Service)
- Amazon CloudWatch Logs

## API Documentation
### Swagger-UI
Run the project and open <http://localhost:3000/docs> or access the staging one on <http://boostedboard-api-staging.herokuapp.com/docs>.

### Error responses
If there is an error, the HTTP status code is set to 4xx (eg. wrong password) or 5xx (eg. server is down, unexpected error) and response body is in special format:
```js
{
  // This is a unique ID for each error occured. Should be shown in app to make tracking errors by screenshots more reliable
  "correlationId": "bbe05941",
  // This is a message regarding the error. Should be showm to user
  "message": "Email address is already registered.",
  // Stack is not included in production environment and is used when testing API endpoints
  "stack": "Error: Email address is already registered.\n    at Object.register (/app/src/services/user-service.js:15:13)"
}
```

## Authorization flow

### Sign up
To register a user using email and password, use `POST /users` request. User will receive instructions to verify his email address.
API will return `accessToken` which expires in 24 hours and `refreshToken` which will be usable after the user verify his email address. The user won't be able to log in with email + password until he verifies his email address.

You don't need to register or verify emails of facebook and google users, use the same request as with logging below.

### Verify email address

When new user is registered using email and password, he needs to verify his email address. He receives a link, which opens a browser, which than call backend. The token in link expires in 48 hours. If user click on an expired link, a new link is automatically sent to him.

The browser should call `/users/verify-email` with that token, which marks user as verified and returns his info.

### Log in
Use `/auth/native`, `/auth/facebook` or `/auth/google` to log in. As you don't need to register facebook and google users, `isNewUser` is used in response to indicate if user is new or returning.

These endpoints return `accessToken` and `refreshToken`. Use `accessToken` in every subsequent request in form of header `Authroization: accessToken`.

### Renew accessToken

The `accessToken` has expiration time of 2 hours.
If you send a request with expired `accessToken`, HTTP status code `412` is returned from API. The `412` status code is not used in any other case.

When `accessToken` expires, you should use `refreshToken` on `/auth/refresh` to obtain a new `accessToken` and `refreshToken`.

### Request password reset

When user forget his password, he can request a password reset. Call `/users/request-password-reset` with email address and backend will send email with special link.

The link opens a browser where the user can set a new password. The browser should call `/users/confirm-password-reset` with token and new password.

## Features

### Rides
Allows to store rides that the user recorded.

The actual route of a ride is stored as breadcrumbs in separate table utilizing PostGIS's Geography data type. It's planned for the table to be expanded with elevation, speed, battery charge and other info to create charts.

### Spots (a.k.a. tags, pins)
Allows to create a community map of various Points of Interest, eg. Charging points, Hazards...

Only creating, manual deletion and radius-based fetching is implemented. Rating system and automatic deletion is not implemented. Basics are described in "Ride recording feature spec" (request Mike for access). 

## Developing the project

### Prerequisites
1. install Node.js as specified in package.json (<https://nodejs.org/en/>)
1. install Docker (<https://docs.docker.com/engine/installation/mac/>)
1. install dependencies: `npm i`
1. setup `.env` file based on `.env-sample`

### Running
1. start development database: `make infra`
1. `make migration` - to migrate database to the latest version
1. `make watch` - to start the API server
1. open <http://localhost:3000/docs>

### Tests
Tests are located in `/tests`. To run test locally, use `make test`.

## Deployment infrastructure

### Application hosting
API hosting is set up on Heroku.

There are three environments: 
1. [development](https://boostedboard-api-development.herokuapp.com/docs): primary used by backend developers to test deployed changes. Automatically deployed from `development` branch even when CI tests don't pass.
2. [staging](https://boostedboard-api-staging.herokuapp.com/docs): primary used by app developers when developing apps. Automatically deployed from `master` branch ONLY when CI tests pass.
3. [production](https://boostedboard-api-production.herokuapp.com): used only by production version of application. Deployed manually.

### Database hosting
Every environment has its own database managed by Heroku.

### Emails
We are using Amazon SES (Simple Email Service) to send emails. All environments share same SES instance.

### Storage
We are using Amazon S3 (Simple Storage Service) to store user-uploaded files. Every environment have its own Bucket.

To upload a file to Amazon S3, you need to request a signed URL from `/aws/signed-url` endpoint and then make an HTTP PUT request with file to that URL.

### Tests
Tests are run by Heroku CI and deployment won't proceed if tests don't pass.

### Logs
Every API request is logged with its headers and body (if smaller then 10KB). Body is not included in production and local environment.

Logs are streamed to AWS CloudWatch Logs.

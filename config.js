/**
 * Master configuration file
 *
 * Parameters in defaultConfig can be overridden in the environment specific declarations
 */

const env = process.env.NODE_ENV;

const defaultConfig = {
    AWS_API_CONFIG: {},
    AuthServiceLoginURL: "https://auth-service.speedyiot.tech/login",
    AuthServiceCreateUserURL: "https://auth-service.speedyiot.tech/user/create",
    AuthServiceCreateUserJWT: process.env.AuthServiceJWT,
    UsersEventsTable: "authenticationServiceStack4-UsersEventDynamoDBTable-1XT0JL951LZLG",
    UsersTable: "authenticationServiceStack4-UsersDynamoDBTable-9OMGEBXVUJ5O",
    JWTSigningKey: process.env.JWTSigningKey

};

const dev = {
    AWS_API_CONFIG: {region: "local", endpoint: 'http://localhost:8000'},
    AuthServiceLoginURL: "https://auth-service.speedyiot.tech/login",
    AuthServiceCreateUserURL: "https://auth-service.speedyiot.tech/user/create",
    AuthServiceCreateUserJWT: process.env.AuthServiceJWT,
    UsersEventsTable: "usersEventsTable",
    UsersTable: "usersTable",
    DashboardsTable: "dashboardsTable",
};

const test = {};

const prod = {
    AuthServiceLoginURL: process.env.AuthServiceLoginURL,
    AuthServiceCreateUserURL: process.env.AuthServiceCreateUserURL,
    AuthServiceCreateUserJWT: process.env.AuthServiceJWT,
    UsersEventsTable: process.env.UsersEventsTable,
    UsersTable: process.env.UsersTable,
    DashboardsTable: process.env.DashboardTable,
    JWTSigningKey: process.env.JWTSigningKey
};

const config = {
    dev,
    test,
    prod
};

const currentConfig = Object.assign(defaultConfig, config[env]);

module.exports = currentConfig;
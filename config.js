/**
 * Master configuration file
 *
 * Parameters in defaultConfig can be overridden in the environment specific declarations
 */

const env = process.env.NODE_ENV;

const defaultConfig = {
    AWS_API_CONFIG: {region: "eu-west-1", profile: 'robertuk'},
    AuthServiceLoginURL: "https://auth-service.speedyiot.tech/login",
    AuthServiceCreateUserURL: "https://auth-service.speedyiot.tech/user/create",
    AuthServiceCreateUserJWT: process.env.AuthServiceJWT,
    UsersEventsTable: "authenticationServiceStack4-UsersEventDynamoDBTable-1XT0JL951LZLG",
    UsersTable: "authenticationServiceStack4-UsersDynamoDBTable-9OMGEBXVUJ5O",
    JWTSigningKey: process.env.JWTSigningKey

};

const dev = {};

const test = {};

const prod = {};

const config = {
    dev,
    test,
    prod
};

const currentConfig = Object.assign(defaultConfig, config[env]);

module.exports = currentConfig;
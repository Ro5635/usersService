/**
 * userModel
 *
 * Models a user and associated user based actions and metadata
 *
 */

const logger = require('../Helpers/LogHelper').getLogger(__filename);
const config = require('../config');
const uuidv1 = require('uuid/v1');
const fetch = require('node-fetch');
const {URLSearchParams} = require('url');

const UsersTable = config.UsersTable;
const UsersEventsTable = config.UsersEventsTable;

// DynamoDB
const aws = require("aws-sdk");
const doc = require("dynamodb-doc");

// Set up AWS DynamoDB
aws.config.update(config.AWS_API_CONFIG);

let credentials = new aws.SharedIniFileCredentials({profile: 'robertuk'});  // TMP HACK to use local AWS CLI Profile
aws.config.credentials = credentials;

const docClient = new doc.DynamoDB();

const User = require('../Classes/User');


/**
 * login
 *
 * Attempt to get a signed JWT with the provided user credentials
 *
 * @param email             string
 * @param password          string (plaintext)
 * @return {Promise<*>}
 */
exports.login = async function (email, password) {
    return new Promise(async function (resolve, reject) {

        const params = new URLSearchParams();
        params.append('userEmail', email);
        params.append('userPassword', password);

        try {

            // Call the auth-service API an attempt to login with the passed credentials
            const authServiceResponse = await fetch(config.AuthServiceLoginURL, {
                method: 'POST',
                body: params
            });

            const authServiceResponseBody = await authServiceResponse.json();

            if (await authServiceResponse.status === 401) {
                logger.info('Supplied User credentials failed authentication');
                logger.info('Failed to get JWT from auth-service due to credentials failure');
                return reject(new Error(await authServiceResponse.statusText));

            } else if (await authServiceResponse.ok) {
                // Provided credentials where correct
                // return the supplied signed JWT to the caller
                logger.info('Successfully acquired signed JWT from auth-service with the supplied credentials');
                return resolve(authServiceResponseBody.jwt);

            }

            logger.error('Failure in calling auth-service');
            logger.error(await authServiceResponse.statusText);
            logger.error(await authServiceResponse.status);
            logger.error(authServiceResponseBody);

            return reject(new Error('Failed to call auth-service'));


        } catch (err) {
            logger.error('Failed to login using auth-service');
            logger.error(err);
            reject(new Error('Failed to login'));

        }


    });
};

/**
 * getUser
 *
 * Get the user with the provided userID
 *
 * @param userID        userID to fetch, the caller should ensure that the user has permissions to get this user
 * @return {Promise<any>}
 */
exports.getUser = (userID) => {
    return new Promise(async function (resolve, reject) {

        logger.info(`Attempting to get user details with ID: ${userID}`);
        logger.info('Requesting item from DynamoDB');


        const params = {
            TableName: UsersTable,
            Key: {"userID": userID}
        };


        try {
            const userDBRequest = await docClient.getItem(params).promise();

            logger.info('Successfully retrieved user from Database');

            const userDetails = userDBRequest.Item;

            logger.info('Returning new user Object');
            resolve(new User(userDetails.userID, userDetails.userFirstName, userDetails.userJWTPayload.dashboards, userDetails.userJWTPayload.subscriptions));

        } catch (err) {
            logger.error('Failed to get user details from DynamoDB');
            logger.error(err);

            logger.error('Returning failure to get user');
            reject(new Error('Failed to get user'));

        }


        try {

            logger.info('Adding read event to users table');
            await putUserEvent(userID, 'accessedAccount', getCurrentUnixTime(), {eventSource: 'userService'});
            logger.info('Added user event to table successfully');

        } catch (err) {
            logger.error('Failed to put event to UsersEvent table');
            logger.error(err);
        }

    });
};


/**
 * registerNewUser
 *
 * Register a new user in the system
 *
 * @param email         string
 * @param password      string  (plaintext)
 * @param firstName     string
 * @param lastName      string
 * @return {Promise<*>}
 */
exports.registerNewUser = async function (email, password, firstName, lastName) {
    return new Promise(async function (resolve, reject) {

        // Create payload
        const createUserPayload = {};

        createUserPayload.userEmail = email;
        createUserPayload.userPassword = password;
        createUserPayload.userFirstName = firstName;
        createUserPayload.userLastName = lastName;
        createUserPayload.userAge = 5635;
        createUserPayload.userRights = {"AccessDash": {"create": 1, "update": 1, "delete": 1, "read": 1}};
        createUserPayload.userJWTPayload = {"dashboards": [], "subscriptions": []};


        try {

            const authServiceResponse = await fetch(config.AuthServiceCreateUserURL, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "jwt": config.AuthServiceCreateUserJWT
                },
                body: JSON.stringify(createUserPayload)
            });

            if (await authServiceResponse.ok) {
                return resolve(await authServiceResponse.json());

            }

            logger.error('Error response received from auth API');
            const statusCode = await authServiceResponse.status;

            switch (statusCode) {
                case 409:
                    logger.error('User account with supplied email exists');
                    return reject(new Error('Account with supplied email Exists'));
                    break;

                default:
                    logger.error('Unidentified failure response from auth-service');
                    logger.error(`Response statusCode: ${statusCode}, with text: ${await authServiceResponse.statusText}`);
                    return reject(new Error('Failed to create new user account'));

            }

        } catch (err) {
            logger.error('Failed to call the auth-api');
            logger.error(err);

            return reject(new Error('Failed to call auth-api'));

        }

    });
};


/**
 * putUserEvent
 *
 * Puts a new user event to the user events table
 *
 * @param userID
 * @param eventType
 * @param occurredAt
 * @param additionalParams      JSON object of any additional parameters to be included
 * @returns {Promise<any>}
 */
function putUserEvent(userID, eventType, occurredAt, additionalParams = {}) {
    return new Promise(async (resolve, reject) => {
        try {

            // Validation
            if (!userID || userID.length <= 0) return reject('No userID was supplied to putUserEvent, aborting.');
            if (!eventType || eventType.length <= 0) return reject('No eventType was supplied to putUserEvent, aborting.');
            if (!occurredAt || occurredAt.length <= 0) return reject('No occurredAt was supplied to putUserEvent, aborting.');

            // Create a new eventID
            // the put will then be conditional on this not existing, if it exists in the table then the put will fail.
            // It is the callers responsibility to re-call in the very rare case of UUID collision.
            const newEventID = uuidv1();

            // Build the database request object
            let requestParams = {};

            requestParams.TableName = UsersEventsTable;
            requestParams.Item = {
                'eventID': newEventID,
                userID,
                eventType,
                'eventOccurredAt': occurredAt, ...additionalParams
            };

            // Add expression to ensure that it cannot overwrite an item on the case of a eventID collision
            requestParams.ConditionExpression = "attribute_not_exists(eventID)";

            logger.debug('Attempting to put new user event to database');
            await docClient.putItem(requestParams).promise();
            logger.debug('New event successfully put to database');

            return resolve();


        } catch (err) {
            logger.error('Failed to putUserEvent');
            logger.error(err);

            return reject(new Error('Failed to putUserEvent'));

        }

    });
}


/**
 * getCurrentUnixTime
 *
 * Gets the current time in the unix time stamp format
 *
 * @returns {number}
 */
function getCurrentUnixTime() {
    // Javascript gives in milliseconds by default
    // convert to seconds and return
    return Math.floor(new Date() / 1000);
}


module.exports = exports;
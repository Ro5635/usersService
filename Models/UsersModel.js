/**
 * userModel
 *
 * Models a user and associated user based actions and metadata
 *
 */

const logger = require('../Helpers/logHelper').getLogger(__filename);
const config = require('../config');
const uuidv1 = require('uuid/v1');
const fetch = require('node-fetch');
const {URLSearchParams} = require('url');

const UsersTable = config.UsersTable;
const UsersEventsTable = config.UsersEventsTable;
const DashboardsTable = config.DashboardsTable;

// DynamoDB
const aws = require("aws-sdk");
const doc = require("dynamodb-doc");

// Set up AWS DynamoDB
aws.config.update(config.AWS_API_CONFIG);

// let credentials = new aws.SharedIniFileCredentials({profile: 'robertuk'});  // TMP HACK to use local AWS CLI Profile
// aws.config.credentials = credentials;

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
 * refreshToken
 *
 * Gets a refreshed token from the current live users token
 *
 * @param callersJWT
 * @return {Promise<any>}
 */
exports.refreshToken = (callersJWT) => {
    return new Promise(async function (resolve, reject) {
        logger.info('UsersModel is attempting to get a refresh token');

        try {

            logger.info('Calling auth-service with users JWT');
            const authServiceResponse = await fetch(config.AuthServiceRefreshTokenURL, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "jwt": callersJWT
                }
            });

            if (await authServiceResponse.ok) {
                logger.info(`Received successful response from auth service for request for new refresh token `);
                const authServiceResponseJSON = await authServiceResponse.json();

                return resolve(authServiceResponseJSON.jwt);


            }

            logger.error('Error response received from auth API');
            const statusCode = await authServiceResponse.status;

            logger.error('Unidentified failure response from auth-service');
            logger.error(`Response statusCode: ${statusCode}, with text: ${await authServiceResponse.statusText}`);
            return reject(new Error('Failed to create new user account'));


        } catch (err) {
            logger.error('Failed to call the auth-api');
            logger.error(err);

            return reject(new Error('Failed to call auth-api'));

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

            if (!userDBRequest.Item) {
                logger.info('Passed userID could not be found in the database');

                logger.error('Returning failure to get user');
                reject(new Error('Failed to get user'));

            } else {
                logger.info('Successfully retrieved user from Database');

                const userDetails = userDBRequest.Item;

                logger.info('Returning new user Object');
                resolve(new User(userDetails.userID, userDetails.userFirstName, userDetails.userJWTPayload.dashboards, userDetails.userJWTPayload.subscriptions));

            }
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
 * registerNewDashboardToUser
 *
 * Registers a new dashboard to a user, this is done here so that the users rights can be updated
 *
 * TODO: Looks like the call to get the users dashboards is not needed as it just appends, refactor this. Later...
 *
 * @param userID                user to register new dashboard to, this must be from a TRUSTED SOURCE
 * @param dashboardName         Name for new dashboard
 * @return {Promise<*>}         Success path resolves the new DashboardID  String
 */
exports.registerNewDashboardToUser = async function (userID, dashboardName) {
    return new Promise(async function (resolve, reject) {

        if (!userID || dashboardName) {
            logger.error('Invalid parameters supplied to registerNewDashboardToUser');
            return reject(new Error('Invalid parameters supplied to registerNewDashboardToUser'));
        }

        // TODO: Handle Collisions
        const newDashboardID = uuidv1();

        // Put new dashboard to tables
        // config.DashboardTable;

        let user;

        try {
            // Get the user's data from the DB
            user = await exports.getUser(userID);

        } catch (err) {
            logger.error('Request to getUser failed');
            logger.error(err);
            logger.error('Cannot proceed to create new dashboard');
            return reject(new Error('Failed to create dashboard'));

        }

        // Update the userTable with the new dashboard
        let userDashboards = user.dashboards;
        console.log(user);

        userDashboards.push(newDashboardID);


        try {

            await docClient.updateItem({
                TableName: UsersTable,
                Key: {userID: userID},
                UpdateExpression: 'SET #userdashboards.#dashboardsArray = list_append(if_not_exists(#userdashboards.#dashboardsArray, :empty_list), :newDashboardID)',
                ExpressionAttributeNames: {
                    '#userdashboards': 'userJWTPayload',
                    '#dashboardsArray': 'dashboards'
                },
                ExpressionAttributeValues: {
                    ':newDashboardID': [newDashboardID],
                    ':empty_list': []
                }
            }).promise();

        } catch (err) {
            logger.error('Failed to update user on DB');
            logger.error(err);
            logger.error('Cannot proceed to create new dashboard');
            return reject(new Error('Failed to create dashboard'));

        }

        logger.info('Successfully updated users dashboards');
        // Now create the new dashboard on dashboardsTable

        let requestParams = {};

        requestParams.TableName = DashboardsTable;
        requestParams.Item = {
            'dashboardID': newDashboardID,
            'createdAt': getCurrentUnixTime()
        };

        // Add expression to ensure that it cannot overwrite an item on the case of a eventID collision
        requestParams.ConditionExpression = "attribute_not_exists(dashboardID)";

        try {
            logger.debug('Attempting to put new dashboard to DashboardsTable');
            await docClient.putItem(requestParams).promise();
            logger.debug('New dashboard successfully put to database');
            logger.debug('New dashboard successfully created and attached to user');

        } catch (err) {
            logger.error('Failed to put create new dashboard on dashboard DB table');
            logger.error(err);
            return reject(new Error('Failed to create dashboard'));
        }

        // Return the new dashboardID
        logger.info(`Completed creation of dashboardID: ${newDashboardID} for userID: ${userID}`);
        return resolve(newDashboardID);

    });
};


/**
 * removeDashboardFromUser
 *
 * Removes a dashboard from a user
 *
 * @param userID                user to register new dashboard to, this must be from a TRUSTED SOURCE
 * @param dashboardID         DashboardID for removal
 * @return {Promise<*>}         Success path resolves the new DashboardID  String
 */
exports.removeDashboardFromUser = async function (userID, dashboardID) {
    return new Promise(async function (resolve, reject) {

        if (!userID || !dashboardID) {
            logger.error('Invalid parameters supplied to registerNewDashboardToUser');
            return reject(new Error('Invalid parameters supplied to registerNewDashboardToUser'));
        }

        // Get the users current dashboards
        let user;

        try {
            // Get the user's data from the DB
            user = await exports.getUser(userID);
            logger.info('Successfully acquired User');

        } catch (err) {
            logger.error('Request to getUser failed');
            logger.error(err);
            logger.error('Cannot proceed to remove a dashboard');
            return reject(new Error('Failed to remove dashboard'));

        }

        // Update the userTable with the updated dashboards array
        let userDashboards = user.dashboards;

        // Remove the requested dashboard from the users current dashboard array
        logger.info('Removing requested dashboard from the Users dashboards array');
        userDashboards = userDashboards.filter( currentDashboardID => {
            if (currentDashboardID === dashboardID) {
                // Don't add back to array
                logger.info(`Dropping dashboardID: ${currentDashboardID} from userDashboards`);

            } else {
                return currentDashboardID
            }
        });

        // persist the updated userDashboards array to the user
        try {

            await docClient.updateItem({
                TableName: UsersTable,
                Key: {userID: userID},
                UpdateExpression: 'SET #userdashboards.#dashboardsArray = :updatedDashboardsArray',
                ExpressionAttributeNames: {
                    '#userdashboards': 'userJWTPayload',
                    '#dashboardsArray': 'dashboards'
                },
                ExpressionAttributeValues: {
                    ':updatedDashboardsArray': userDashboards
                }
            }).promise();

        } catch (err) {
            logger.error('Failed to update user on DB');
            logger.error(err);
            logger.error('Cannot proceed to create update users dashboards');
            return reject(new Error('Failed to remove dashboard'));

        }

        logger.info('Successfully updated users dashboards');

        logger.info(`Completed removal of dashboardID: ${dashboardID} for userID: ${userID}`);
        return resolve(true);

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
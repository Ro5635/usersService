/**
 *  GraphQL Root Resolver
 *
 */

const logger = require('../Helpers/logHelper').getLogger(__filename);
const User = require('../Classes/User');
const UserModel = require('../Models/UsersModel');


/**
 * loginResponse
 *
 * Models the response to the login query
 */
class loginResponse {
    constructor(success, jwt) {
        this.success = success;
        this.jwt = jwt;
    }

}

/**
 * createUserResponse
 *
 * Models the response for a request to create a user
 */
class createUserResponse {
    constructor(success, errorDescription, newUserID) {
        this.success = success;
        this.errorDescription = errorDescription;
        this.newUserID = newUserID;

    }

}


/**
 * registerDashboardResponse
 *
 * Models the response for a request to register a
 * new dashboard to a user
 */
class registerDashboardResponse {
    constructor(success, errorDescription, newDashboardID) {
        this.success = success;
        this.errorDescription = errorDescription;
        this.newDashboardID = newDashboardID;

    }

}


/**
 * removeDashboardResponse
 *
 * Models the response for a request to register a
 * new dashboard to a user
 */
class removeDashboardResponse {
    constructor(success, errorDescription) {
        this.success = success;
        this.errorDescription = errorDescription;
    }
}

/**
 * getRefreshTokenResponse
 *
 * Models the response to a request for a new token
 *
 */
class getRefreshTokenResponse {
    constructor(success, errorDescription, newJWT) {
        this.success = success;
        this.errorDescription = errorDescription;
        this.jwt = newJWT;

    }

}


/**
 * Unauthenticated root graphQL resolver
 *
 * The root provides a resolver function for each of the unauthenticated graphQL operations
 */
exports.unauthenticatedRoot = {
    login: async function ({email, password}) {
        logger.info('Request received to login handler');
        try {
            const signedJWT = await UserModel.login(email, password);
            logger.info('Returning successful login to caller');

            return new loginResponse(true, signedJWT);

        } catch (err) {
            logger.error('Failed to login, returning failure to caller');
            logger.error(err);

            return new loginResponse(false);
        }
    }
};


/**
 * Authenticated Root graphQL resolver
 *
 * The root provides a resolver function for each authenticated API operations
 * where the user is required to have a validated JWT
 */
exports.authenticatedRoot = {

    getUser: async function ({id}, requestContext) {
        logger.info('Request received to getUser handler');
        // The passed id here is not used, this is to allow for later expansion to have
        // services with access permissions to access any user.

        const validatedTokenPayload = requestContext.res.req.validatedAuthToken;

        // get the userID from JWT
        const trustedUserID = validatedTokenPayload.token.userID;

        return await UserModel.getUser(trustedUserID);

    },
    createUser: async function ({email, password, firstName, lastName}) {
        logger.info('Request to create new user account received');

        try {
            logger.info('Requesting creation of new user by UserModel');
            const newUserAccountDetails = await UserModel.registerNewUser(email, password, firstName, lastName);

            logger.info('Successfully retrieved a new user account from UserModel');
            logger.info('Returning new userID to caller');
            return new createUserResponse(true, null, newUserAccountDetails.userID);

        } catch (err) {
            logger.error('Failure in calling UserModel to create new account');
            logger.error(err);

            logger.error('Returning error to caller');
            return new createUserResponse(false, err.message);

        }
    },
    getRefreshToken: async function (params, requestContext) {
        logger.info('Request received for new updated JWT');

        const validatedTokenPayload = requestContext.res.req.validatedAuthToken;
        const rawToken = requestContext.res.req.headers.jwt;

        try {
            const refreshedToken = await UserModel.refreshToken(rawToken);

            return new getRefreshTokenResponse(true, null, refreshedToken);

        } catch (err) {
            logger.error('Call to UserModel for a refresh token failed');
            logger.error(err);
            logger.error('Returning error to caller');
            return new getRefreshTokenResponse(false, 'Failed to refresh token');

        }

    },
    registerNewDashboard: async function ({name}, requestContext) {
        logger.info('Request to register new dashboard received');

        const validatedTokenPayload = requestContext.res.req.validatedAuthToken;

        // get the userID from JWT
        const trustedUserID = validatedTokenPayload.token.userID;


        try {

            const newDashboardID = await UserModel.registerNewDashboardToUser(trustedUserID, name);

            return new registerDashboardResponse(true, null, newDashboardID);


        } catch (err) {
            logger.error('Call to UserModel to register a new dashboard failed');
            logger.error(err);
            logger.error('Returning error to caller');
            return new registerDashboardResponse(false, 'Failed to register new dashboard');

        }

    },
    removeDashboardFromUser: async function({dashboardID}, requestContext) {
        logger.info('Request to remove dashboard from user received');

        const validatedTokenPayload = requestContext.res.req.validatedAuthToken;

        // get the userID from JWT
        const trustedUserID = validatedTokenPayload.token.userID;

        try {
            const success = await UserModel.removeDashboardFromUser(trustedUserID, dashboardID);
            return new removeDashboardResponse(true);


        } catch (err) {
            logger.error('Request to UserModel to remove dashboard failed');
            logger.error(err);

            return new removeDashboardResponse(false, 'Failed to remove dashboard');

        }
    }

};


module.exports = exports;
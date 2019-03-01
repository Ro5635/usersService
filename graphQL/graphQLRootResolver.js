/**
 *  GraphQL Root Resolver
 *
 */

const logger = require('../Helpers/LogHelper').getLogger(__filename);
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


// The root provides a resolver function for each API endpoint
const root = {

    getUser: async function ({id}, requestContext) {
        logger.info('Request received to getUser handler');

        // get the userID from JWT
        // const suppliedJWT = requestContext.headers.jwt;

        console.error('TAKING ID FROM USER DIRECTLY!');
        return await UserModel.getUser(id);// This needs to take the ID from the JWT

    },
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




    }


};


module.exports = root;
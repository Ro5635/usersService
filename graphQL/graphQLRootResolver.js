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


// The root provides a resolver function for each API endpoint
const root = {

    getUser: async function (args) {
        return await UserModel.getUser(args.id);
    },
    login: async function (args) {
        try {
            const signedJWT = await UserModel.login(args.email, args.password);
            logger.info('Returning successful login to caller');

            return new loginResponse(true, signedJWT);

        } catch (err) {
            logger.error('Failed to login, returning failure to caller');
            logger.error(err);

            return new loginResponse(false);
        }
    }


};


module.exports = root;
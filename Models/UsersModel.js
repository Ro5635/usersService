/**
 * userModel
 *
 * Models a user and associated user based actions and metadata
 *
 */

const logger = require('../Helpers/LogHelper').getLogger(__filename);
const config = require('../config');
const fetch = require('node-fetch');
const {URLSearchParams} = require('url');

const User = require('../Classes/User');


exports.login = async function (email, password) {
    return new Promise(async function (resolve, reject) {


        const params = new URLSearchParams();
        params.append('userEmail', email);
        params.append('userPassword', password);

        try {

            // Call the auth-service API an attempt to login with the passed credentials
            const authServiceResponse = await fetch('https://auth-service.speedyiot.tech/login', {
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

exports.getUser = (id) => {
    return new Promise((resolve, reject) => {
        return resolve(new User(id, "Henery", ["tth4kjdkj33", "sss355n"]));

    });
};


module.exports = exports;
let jwt = require('jsonwebtoken');
const logger = require('../Helpers/logHelper').getLogger(__filename);
const config = require('../config.js');

/**
 * checkToken
 *
 * Express middleware to check and validate users JWT, if a valid JWT is not found then
 * a 401 response will be sent and resource access stopped.
 *
 * @param req           Standard Express req object
 * @param res           Standard Express res object
 * @param next          Standard Express next object
 */
const checkToken = (req, res, next) => {
    let token = req.headers['jwt'] || req.headers['authorization'] ;

    try {

        if (!token || token.length < 1) {
            logger.info('No JWT Token found');

            return respondAuthenticationFailure(res);
        }

        logger.info('Callers JWT found');

        // Remove 'Bearer' from token start
        if (token.startsWith('Bearer ')) {
            // Remove Bearer from string
            token = token.slice(7, token.length);
        }

        jwt.verify(token, config.JWTSigningKey, (err, decoded) => {
            if (err) {

                return respondAuthenticationFailure(res);

            } else {
                logger.info('Validated authenticated JWT found');
                req.validatedAuthToken = {valid: true, token: decoded};
                next();

            }
        });

    } catch (err) {
        logger.error('Error reading auth token');
        logger.error(err);
        return respondAuthenticationFailure(res);

    }

};

/**
 * respondAuthenticationFailure
 *
 * Send out http response for a failure to provide valid
 * authentication
 *
 * @param res       Express res object
 */
function respondAuthenticationFailure(res){

    logger.error('Calling JWT is not valid, Access not allowed to authenticated resource.');
    res.sendResponse(401);

}

module.exports = checkToken;
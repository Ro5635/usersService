const express = require('express');
const path = require('path');
const morganLogger = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors')

const graphqlHTTP = require('express-graphql');
const graphQLSchema = require('./graphQL/graphQLSchema');
const graphQLRootResolver = require('./graphQL/graphQLRootResolver');

const logger = require('./Helpers/logHelper').getLogger(__filename);
const responseMiddleware =  require('./Middleware/responseMiddleware');
const jwtCheck = require('./Middleware/jwtCheck');

// Setup Routers
const index = require('./Routers/index');

const app = express();


// Middleware
app.use(morganLogger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cors());
app.use(responseMiddleware.addSendResponseToRes);

app.use(function (req, res, next) {
    "use strict";
    res.setHeader('x-powered-by', 'Pepsi Max');
    res.setHeader('content-type', 'application/json');
    // TODO: Create list of allowed origins
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', 'content-type, auth, jwt');
    next();
});


// Routers
app.use('/', index);


app.use('/login', graphqlHTTP({
    schema: graphQLSchema.unauthenticatedSchema,
    rootValue: graphQLRootResolver.unauthenticatedRoot
}));


// Require authentication for all remaining roots
app.use(jwtCheck);                                        // MOVING HANDLERS ABOVE THIS LINE WILL MAKE THEM UNPROTECTED!

app.use('/graphql', graphqlHTTP({
    schema: graphQLSchema.authenticatedSchema,
    rootValue: graphQLRootResolver.authenticatedRoot
}));



// catch 404 and forward to error handler
app.use(function (req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    logger.error('Hit final error handler');

    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.status(404).send({Error: 'Endpoint not found'});
});

module.exports = app;
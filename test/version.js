/**
 * Version test
 *
 * Basic unit tests for the version resource
 */

process.env.NODE_ENV = 'test';

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let app = require('../app');
let should = chai.should();

const apiVersion = require('../package').version;

chai.use(chaiHttp);

describe('API Root', () => {
    beforeEach((done) => {
        done();

    });

    /*
      * Test the /GET route
      */
    describe('/GET /', () => {
        it('it should GET API details', (done) => {
            chai.request(app)
                .get('/')
                .end((err, res) => {
                    // Expected response
                    const expectedResponse = {msg: 'Users Service API', version: apiVersion};
                    res.should.have.status(200);
                    res.body.should.be.a('Object');
                    res.body.should.have.property('version');
                    // Duplicate tests a bit to demo the syntax options for future reference
                    res.body.should.have.property('version').eql(expectedResponse.version);
                    res.body.should.have.property('msg').eql(expectedResponse.msg);
                    done();
                });
        });
    });


});
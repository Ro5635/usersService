# usersService

API based on ro5635/serverlessAPIStarter, provides users resource functionality for speedyIOT, my final year project application.

## Running

### Production (AWS Serverless)
The SAM/Cloudformation template defines the lambda handler as `Handler: bin/lambdaRunner.handler`, this runs the API.

### Development

To run locally in development use `npm run-script run-dev` ensuring that the environment variable `env` is set to `dev` 

## Testing

API has nyc code coverage and mocha unit testing set up, simply use the below command to execute the tests, add additional tests to the test directory.

```npm run-script test```


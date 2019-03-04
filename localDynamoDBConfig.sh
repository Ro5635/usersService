# Script to be ran at creation of local DynamoDB service to create the tables required for this project
# AWS SAM Ignores AWS::Serverless::SimpleTable in a SAM script so developer needs to provide this

# REMEMBER TO KEEP THIS WITH UNIX LINE ENDINGS OR THE SPLIT COMMAND BELOW WILL FAIL!

# Create Users Table
aws dynamodb create-table  --endpoint-url http://dynamodb-local:8000   --region local    --table-name usersTable  --attribute-definitions AttributeName=userID,AttributeType=S  AttributeName=userEmail,AttributeType=S --key-schema AttributeName=userID,KeyType=HASH --global-secondary-indexes  '[{ "IndexName": "userEmail-index", "Projection": { "ProjectionType": "ALL" },"ProvisionedThroughput": {"WriteCapacityUnits": 1, "ReadCapacityUnits": 2},"KeySchema": [{"KeyType": "HASH", "AttributeName": "userEmail"}]}] ' --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5

# Create Users Events Table
aws dynamodb create-table  --endpoint-url http://dynamodb-local:8000   --region local    --table-name usersEventsTable  --attribute-definitions '[{"AttributeName": "eventID", "AttributeType": "S"},{"AttributeName": "eventType","AttributeType": "S"},{"AttributeName": "userID","AttributeType": "S"}]' --key-schema '[{"KeyType": "HASH","AttributeName": "eventID"},{"KeyType": "RANGE","AttributeName": "userID"}]' --global-secondary-indexes '[{"IndexName": "userID-eventType-index","Projection": {"ProjectionType": "ALL"},"ProvisionedThroughput": {"WriteCapacityUnits": 1,"ReadCapacityUnits": 2},"KeySchema": [{"KeyType": "HASH","AttributeName": "userID"},{"KeyType": "RANGE","AttributeName": "eventType"}]}]' --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5

# Place a user into the Users table
aws dynamodb --endpoint-url http://dynamodb-local:8000 --region local put-item --table-name usersTable --item '{"userEmail": { "S": "rob@example.com"},"creationDetails": {"M": {"createdBy": {"S": "authenticationService"},"CreatedAt": {"N": "1551456771"}}},"userFirstName": {"S": "Fred"},"userID": {"S": "dcd82d50-3c3c-11e9-a023-332a7d7611a5"},"userPasswordHash": {"S": "$2b$10$125iJtBLj0MIUPvBRmYu1OtRDhw6KzkaCcDw5BZpIdtAX1I8Qt7zG" }, "userRights": { "M": { "AccessDash": { "M": { "read": { "N": "1" }, "create": { "N": "1" }, "update": { "N": "1" }, "delete": { "N": "1" } } } } }, "dashboards": { "L": [] }, "userAge": { "S": "5635" }, "userJWTPayload": { "M": { "dashboards": { "L": [] }, "dashBoards": { "L": [] }, "subscriptions": { "L": [] } } }, "userLastName": { "S": "Fredstone" } }'

# List tables
aws dynamodb  --endpoint-url http://dynamodb-local:8000 list-tables --region local
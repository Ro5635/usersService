# Script to be ran at creation of local DynamoDB service to create the tables required for this project
# AWS SAM Ignores AWS::Serverless::SimpleTable in a SAM script so developer needs to provide this

# REMEMBER TO KEEP THIS WITH UNIX LINE ENDINGS OR THE SPLIT COMMAND BELOW WILL FAIL!

aws dynamodb create-table \
 --endpoint-url http://dynamodb-local:8000 \
  --region local \
   --table-name demoTable \
 --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5


aws dynamodb  --endpoint-url http://dynamodb-local:8000 list-tables --region local
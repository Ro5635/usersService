const {buildSchema} = require('graphql');

// Construct a schema, using GraphQL schema language
const schema = buildSchema(`

  type User {
    id: String!
    name: String!
    dashboards: [String!]
    subscriptions: [String!]
    
  }
  
  type loginResponse {
    success:    Boolean!
    jwt:    String
    
  }
  
  type createUserResponse {
    success: Boolean!
    newUserID: String
    errorDescription: String
    
  }

  type Query {
    getUser(id: String): User
    login(email: String!, password: String!): loginResponse
    createUser(email: String!, password: String!, firstName: String!, lastName: String!): createUserResponse!
  }
  
  input userUpdateInput {
    id: String!
  }
  
  type Mutation {
    updateUser(updatedUser: userUpdateInput): String
  }

`);


module.exports = schema;
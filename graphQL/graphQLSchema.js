const {buildSchema} = require('graphql');

// Construct a schema, using GraphQL schema language
exports.authenticatedSchema = buildSchema(`

  type User {
    id: String!
    name: String!
    dashboards: [String!]
    subscriptions: [String!]
    
  }
  
  type createUserResponse {
    success: Boolean!
    newUserID: String
    errorDescription: String
    
  }

  type Query {
    getUser(id: String): User
    createUser(email: String!, password: String!, firstName: String!, lastName: String!): createUserResponse!
  }
  
  input userUpdateInput {
    id: String!
  }
  
  type Mutation {
    updateUser(updatedUser: userUpdateInput): String
  }

`);

exports.unauthenticatedSchema = buildSchema(`
 
  type loginResponse {
    success:    Boolean!
    jwt:    String
    
  }
  
  type Query {
    login(email: String!, password: String!): loginResponse
   }

`);

module.exports = exports;
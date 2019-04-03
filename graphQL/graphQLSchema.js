const {buildSchema} = require('graphql');

// Construct a schema, using GraphQL schema language
exports.authenticatedSchema = buildSchema(`
  type User {
    id: String!
    name: String!
    dashboards: [String!]
    subscriptions: [String!]
    
  }
  
  type registerDashboardResponse {
    success: Boolean!
    newDashboardID: String
    errorDescription: String
    
  }
  
  type removeDashboardResponse {
    success: Boolean!
    errorDescription: String
    
  }
  
    
  type getRefreshTokenResponse {
    success: Boolean!
    jwt: String
    errorDescription: String
    
  }
  


  type Query {
    getUser(id: String): User
    getRefreshToken(id: String): getRefreshTokenResponse!
  }
  
  input userUpdateInput {
    id: String!
  }
  
  input newDashboardInput {
    name: String!
  
  }
  
  type Mutation {
    updateUser(updatedUser: userUpdateInput): String
    registerNewDashboard(dashboard: newDashboardInput): registerDashboardResponse
    removeDashboardFromUser(dashboardID: String): removeDashboardResponse
  }

`);

exports.unauthenticatedSchema = buildSchema(`

 type createUserResponse {
    success: Boolean!
    newUserID: String
    errorDescription: String
    
  }
 
  type loginResponse {
    success:    Boolean!
    jwt:    String
    
  }
  
  type Query {
    login(email: String!, password: String!): loginResponse
    createUser(email: String!, password: String!, firstName: String!, lastName: String!): createUserResponse!
   }

`);

module.exports = exports;
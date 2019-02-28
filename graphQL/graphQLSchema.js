const {buildSchema} = require('graphql');

// Construct a schema, using GraphQL schema language
const schema = buildSchema(`

  type User {
    id: String!
    name: String!
    dashboards: [String!]
    
  }
  
  type loginResponse {
    success:    Boolean!
    jwt:    String
    
  }

  type Query {
    getUser(id: String!): User
    login(email: String!, password: String!): loginResponse
  }
  
  input userUpdateInput {
    id: String!
  }
  
  type Mutation {
    updateUser(updatedUser: userUpdateInput): String
  }

`);


module.exports = schema;
export const typeDefs = `#graphql
  scalar DateTime

  enum AppStatus {
    APPLIED
    SCREENING
    INTERVIEW
    OFFER
    REJECTED
    WITHDRAWN
  }

  type Company {
    id: ID!
    name: String!
    website: String
    location: String
    jobs: [Job!]!
  }

  type Job {
    id: ID!
    title: String!
    description: String
    location: String
    remote: Boolean!
    minExp: Int!
    maxExp: Int
    company: Company!
    applications: [Application!]!
    createdAt: DateTime!
  }

  type Application {
    id: ID!
    job: Job!
    status: AppStatus!
    note: String
    createdAt: DateTime!
  }

  type User {
    id: ID!
    email: String!
    name: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  input CreateJobInput {
    title: String!
    description: String
    location: String
    remote: Boolean
    minExp: Int
    maxExp: Int
    companyId: ID!
  }

  type Query {
    jobs(location: String, remote: Boolean): [Job!]!
    job(id: ID!): Job
    companies: [Company!]!
    applications(status: AppStatus): [Application!]!
    jobsConnection(first: Int = 10, after: String): JobConnection!
    me: User
  }

  type JobEdge {
    cursor: String!
    node: Job!
  }

  type PageInfo {
    hasNextPage: Boolean!
    endCursor: String
  }

  type JobConnection {
    edges: [JobEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type Mutation {
    signup(email: String!, password: String!, name: String): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    createCompany(name: String!, website: String, location: String): Company!
    createJob(input: CreateJobInput!): Job!
    createApplication(jobId: ID!, note: String): Application!
    updateApplicationStatus(id: ID!, status: AppStatus!): Application!
  }
`;

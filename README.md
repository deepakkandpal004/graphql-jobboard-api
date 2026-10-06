# graphql-jobboard

Job board API built with Apollo Server + Prisma + Postgres. Made to learn GraphQL properly — schema design, dataloaders, cursor pagination, auth.

## Run it

Needs Postgres running locally:

```bash
docker run --name jobboard-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=jobboard \
  -p 5432:5432 -d postgres:16
```

```bash
npm install
cp .env.example .env
npx prisma db push
npx prisma db seed
npm run dev
```

Sandbox at http://localhost:4000/graphql.

Demo login: `demo@example.com` / `password123`

## What's in here

- `src/schema.js` — the GraphQL schema
- `src/resolvers.js` — resolvers
- `src/dataloaders.js` — batches company lookups (N+1 fix)
- `src/pagination.js` — cursor encode/decode for `jobsConnection`
- `src/auth.js` — JWT signup/login, Bearer auth
- `prisma/` — schema + seed

## Client

```bash
cd client
npm install
npm run dev
```

React app at http://localhost:5173 (API has to be running). Login, browse jobs, hit apply.

## Example queries

```graphql
{
  jobs(remote: true) {
    title
    location
    company {
      name
    }
  }
}
```

```graphql
{
  jobsConnection(first: 2) {
    edges {
      cursor
      node {
        title
        company {
          name
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

Pass `pageInfo.endCursor` as `after` to get the next page.

```graphql
mutation {
  login(email: "demo@example.com", password: "password123") {
    token
    user {
      email
    }
  }
}
```

Put the token in the Sandbox headers as `{ "authorization": "Bearer <token>" }`, then:

```graphql
{
  me {
    email
  }
  applications {
    status
    job {
      title
    }
  }
}
```

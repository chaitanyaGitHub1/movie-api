import { createYoga } from 'graphql-yoga'
import { createServer } from 'node:http'
import { context } from './context'
import { schema } from './schema'

const yoga = createYoga({
  graphqlEndpoint: '/',
  schema,
  context,
})

const server = createServer(yoga)

server.listen(4000, () => {
  console.log(`
  🚀 Server ready at: http://localhost:4000`)
})
import { 
    GraphQLServer, 
    JsonLogger 
} from '@dreamit/graphql-server'
import { 
    userSchema, 
    userSchemaResolvers 
} from '@dreamit/graphql-testing'
import {App} from 'uWebSockets.js'

const graphqlServer = new GraphQLServer(
    {
        schema: userSchema,
        rootValue: userSchemaResolvers,
        logger: new JsonLogger('uws-server', 'user-service')
    }
)

const graphQLServerPort = 7070
App().post('/graphql', async(response, request) => {

    /* Can't return or yield from here without responding or attaching an abort handler */
    response.onAborted(() => {
        response.aborted = true
    })


  
    /* Awaiting will yield and effectively return to C++, so you need to have called onAborted */
    const graphQLResponse = await graphqlServer.handleRequest({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        headers: {'content-type': 'application/json'},
        url: request.getUrl(),
        method: request.getMethod().toUpperCase(),
        body: {query: 'query users{ users { userId userName } }'}
    })
  
    /* If we were aborted, you cannot respond */
    if (!response.aborted) {
        response.cork(() => {
            response.end(JSON.stringify(graphQLResponse.executionResult))
        })
    }
})
.listen(graphQLServerPort, (token) => {
    if (token) {
        console.log('Listening to port ' + graphQLServerPort)
    } else {
        console.log('Failed to listen to port ' + graphQLServerPort)
    }
})

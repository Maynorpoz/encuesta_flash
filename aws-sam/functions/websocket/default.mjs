const isLocal = process.env.NODE_ENV === 'development' && !process.env.AWS_EXECUTION_ENV;
const layerPath = isLocal ? '../../layers/shared-layer/nodejs/index.mjs' : '/opt/nodejs/index.mjs';
const { db } = await import(layerPath);

export const handler = async (event) => {
  console.log('WebSocket Default - Event:', JSON.stringify(event, null, 2));

  const connectionId = event.requestContext.connectionId;
  const domainName = event.requestContext.domainName;
  const stage = event.requestContext.stage;

  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { action, pollId } = body;

    if (action === 'subscribe' && pollId) {
      await db.updateConnectionPoll(connectionId, pollId);

      const results = await db.getPollResults(pollId);

      const { ApiGatewayManagementApiClient, PostToConnectionCommand } = await import('@aws-sdk/client-apigatewaymanagementapi');

      const apiGateway = new ApiGatewayManagementApiClient({
        endpoint: `https://${domainName}/${stage}`
      });

      const command = new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: JSON.stringify({
          type: 'results',
          pollId,
          results
        })
      });

      await apiGateway.send(command);

      console.log(`Cliente suscrito a poll ${pollId}`);

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Suscrito exitosamente' })
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Acción no válida' })
    };
  } catch (error) {
    console.error('Error en default:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error al procesar mensaje' })
    };
  }
};

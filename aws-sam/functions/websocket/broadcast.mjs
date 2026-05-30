const isLocal = process.env.NODE_ENV === 'development' && !process.env.AWS_EXECUTION_ENV;
const layerPath = isLocal ? '../../layers/shared-layer/nodejs/index.mjs' : '/opt/nodejs/index.mjs';
const { db } = await import(layerPath);

export const handler = async (event) => {
  console.log('Broadcast Handler - Event:', JSON.stringify(event, null, 2));

  try {
    for (const record of event.Records) {
      if (record.eventName !== 'INSERT') {
        continue;
      }

      const newImage = record.dynamodb.NewImage;

      if (!newImage.SK?.S?.startsWith('VOTE#')) {
        continue;
      }

      const pollId = newImage.pollId?.S;
      if (!pollId) {
        console.log('Voto sin pollId, omitiendo');
        continue;
      }

      console.log(`Procesando voto para poll: ${pollId}`);

      const results = await db.getPollResults(pollId);
      const connections = await db.getConnectionsByPollId(pollId);

      console.log(`Encontradas ${connections.length} conexiones suscritas a poll ${pollId}`);

      if (connections.length === 0) {
        console.log('No hay conexiones activas, omitiendo broadcast');
        continue;
      }

      const { ApiGatewayManagementApiClient, PostToConnectionCommand } = await import('@aws-sdk/client-apigatewaymanagementapi');

      const apiEndpoint = process.env.WEBSOCKET_API_ENDPOINT ||
        `https://${process.env.WEBSOCKET_API_ID}.execute-api.${process.env.AWS_REGION}.amazonaws.com/prod`;

      const apiGateway = new ApiGatewayManagementApiClient({
        endpoint: apiEndpoint
      });

      const message = JSON.stringify({
        type: 'results_update',
        data: results
      });

      const staleConnections = [];

      for (const connection of connections) {
        try {
          const command = new PostToConnectionCommand({
            ConnectionId: connection.connectionId,
            Data: message
          });

          await apiGateway.send(command);
          console.log(`Mensaje enviado a conexión: ${connection.connectionId}`);
        } catch (error) {
          if (error.statusCode === 410) {
            console.log(`Conexión stale detectada: ${connection.connectionId}`);
            staleConnections.push(connection.connectionId);
          } else {
            console.error(`Error enviando mensaje a ${connection.connectionId}:`, error.message);
          }
        }
      }

      for (const connectionId of staleConnections) {
        try {
          await db.removeConnection(connectionId);
          console.log(`Conexión stale eliminada: ${connectionId}`);
        } catch (error) {
          console.error(`Error eliminando conexión stale ${connectionId}:`, error.message);
        }
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Broadcast completado' })
    };
  } catch (error) {
    console.error('Error en broadcast:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error en broadcast' })
    };
  }
};

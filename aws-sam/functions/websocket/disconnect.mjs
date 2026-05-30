const isLocal = process.env.NODE_ENV === 'development' && !process.env.AWS_EXECUTION_ENV;
const layerPath = isLocal ? '../../layers/shared-layer/nodejs/index.mjs' : '/opt/nodejs/index.mjs';
const { db } = await import(layerPath);

export const handler = async (event) => {
  console.log('WebSocket Disconnect - Event:', JSON.stringify(event, null, 2));

  const connectionId = event.requestContext.connectionId;

  try {
    await db.removeConnection(connectionId);

    console.log(`Conexión eliminada: ${connectionId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Desconectado' })
    };
  } catch (error) {
    console.error('Error en disconnect:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error al desconectar' })
    };
  }
};

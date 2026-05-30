// Imports desde Lambda Layer (/opt/nodejs/)
// Determinar ruta de importación según entorno
const isLocal = process.env.NODE_ENV === 'development' && !process.env.AWS_EXECUTION_ENV;
const layerPath = isLocal ? '../../layers/shared-layer/nodejs/index.mjs' : '/opt/nodejs/index.mjs';

const { db } = await import(layerPath);

/**
 * Lambda Handler - Obtener Resultados de Encuesta
 *
 * Obtiene los resultados agregados de una encuesta.
 * Calcula votos totales y porcentajes por opción.
 * No requiere autenticación (público).
 *
 * Event pathParameters: { pollId }
 */
export const handler = async (event) => {
  console.log('GetResultsHandler - Event:', JSON.stringify(event, null, 2));

  try {
    // Obtener pollId de los path parameters
    const pollId = event.pathParameters?.pollId;

    if (!pollId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Falta el identificador de la encuesta (pollId)'
        })
      };
    }

    console.log('Obteniendo resultados para encuesta:', pollId);

    // Obtener resultados agregados de DynamoDB
    const results = await db.getPollResults(pollId);

    if (!results) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'La encuesta solicitada no existe o no tiene resultados'
        })
      };
    }

    console.log(`Resultados calculados: ${results.totalVotes} votos totales`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(results)
    };

  } catch (error) {
    console.error('Error en getResultsHandler:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Error al obtener los resultados de la encuesta',
        message: error.message
      })
    };
  }
};

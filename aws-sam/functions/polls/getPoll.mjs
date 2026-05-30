// Imports desde Lambda Layer (/opt/nodejs/)
// Determinar ruta de importación según entorno
const isLocal = process.env.NODE_ENV === 'development' && !process.env.AWS_EXECUTION_ENV;
const layerPath = isLocal ? '../../layers/shared-layer/nodejs/index.mjs' : '/opt/nodejs/index.mjs';

const { db } = await import(layerPath);

/**
 * Lambda Handler - Obtener Encuesta por ID
 *
 * Obtiene los detalles públicos de una encuesta.
 * No requiere autenticación (público).
 *
 * Event pathParameters: { pollId }
 */
export const handler = async (event) => {
  console.log('GetPollHandler - Event:', JSON.stringify(event, null, 2));

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

    console.log('Obteniendo encuesta:', pollId);

    // Obtener encuesta de DynamoDB
    const poll = await db.getPollById(pollId);

    if (!poll) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'La encuesta solicitada no existe'
        })
      };
    }

    // No retornar información sensible como el ID del creador en la vista pública
    const publicPoll = {
      id: poll.id,
      title: poll.title,
      description: poll.description,
      options: poll.options,
      settings: poll.settings,
      createdAt: poll.createdAt,
      active: poll.active
    };

    console.log('Encuesta encontrada:', publicPoll.id);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(publicPoll)
    };

  } catch (error) {
    console.error('Error en getPollHandler:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Error al obtener la encuesta',
        message: error.message
      })
    };
  }
};

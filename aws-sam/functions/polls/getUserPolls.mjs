// Imports desde Lambda Layer (/opt/nodejs/)
// Determinar ruta de importación según entorno
const isLocal = process.env.NODE_ENV === 'development' && !process.env.AWS_EXECUTION_ENV;
const layerPath = isLocal ? '../../layers/shared-layer/nodejs/index.mjs' : '/opt/nodejs/index.mjs';

const { db } = await import(layerPath);

/**
 * Lambda Handler - Obtener Encuestas del Usuario
 *
 * Lista todas las encuestas creadas por el usuario autenticado.
 * Incluye estadísticas de votos para cada encuesta.
 * Requiere autenticación JWT (Authorizer).
 *
 * Event requestContext.authorizer: { userId, username }
 */
export const handler = async (event) => {
  console.log('GetUserPollsHandler - Event:', JSON.stringify(event, null, 2));

  try {
    // Obtener creatorId del contexto del Authorizer
    const creatorId = event.requestContext?.authorizer?.userId;

    if (!creatorId) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'No autorizado: falta información del usuario' })
      };
    }

    console.log('Obteniendo encuestas para usuario:', creatorId);

    // Obtener encuestas del usuario usando GSI CreatorIndex
    const polls = await db.getPollsByCreator(creatorId);

    console.log(`Encontradas ${polls.length} encuestas`);

    // Agregar estadísticas de votos para cada encuesta
    const pollsWithStats = await Promise.all(
      polls.map(async (poll) => {
        const votes = await db.getVotesByPollId(poll.id);
        return {
          ...poll,
          totalVotes: votes.length
        };
      })
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(pollsWithStats)
    };

  } catch (error) {
    console.error('Error en getUserPollsHandler:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Error al obtener tus encuestas',
        message: error.message
      })
    };
  }
};

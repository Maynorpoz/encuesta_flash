// Imports desde Lambda Layer (/opt/nodejs/)
// Determinar ruta de importación según entorno
const isLocal = process.env.NODE_ENV === 'development' && !process.env.AWS_EXECUTION_ENV;
const layerPath = isLocal ? '../../layers/shared-layer/nodejs/index.mjs' : '/opt/nodejs/index.mjs';

const { db } = await import(layerPath);

/**
 * Lambda Handler - Registrar Voto
 *
 * Registra un voto en una encuesta.
 * No requiere autenticación (público, votación anónima).
 *
 * IMPORTANTE: NO llama a broadcast directamente.
 * El broadcast se hará automáticamente vía DynamoDB Streams en Fase 4.
 *
 * Event body: {
 *   pollId: string,
 *   optionId: string,
 *   voterId: string (identificador único del votante, ej: UUID generado en frontend)
 * }
 */
export const handler = async (event) => {
  console.log('VoteHandler - Event:', JSON.stringify(event, null, 2));

  try {
    // Parsear body
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { pollId, optionId, voterId } = body;

    // Validar parámetros obligatorios
    if (!pollId || !optionId || !voterId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Faltan parámetros obligatorios: pollId, optionId o voterId'
        })
      };
    }

    console.log(`Procesando voto: poll=${pollId}, option=${optionId}, voter=${voterId}`);

    // 1. Obtener la encuesta
    const poll = await db.getPollById(pollId);

    if (!poll) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'La encuesta no existe' })
      };
    }

    // 2. Validar que la opción seleccionada pertenezca a la encuesta
    const optionExists = poll.options.some(opt => opt.id === optionId);

    if (!optionExists) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'La opción seleccionada no pertenece a esta encuesta'
        })
      };
    }

    // 3. Control de duplicados si no permite múltiples votos
    if (!poll.settings?.multipleChoice) {
      const alreadyVoted = await db.hasUserVoted(pollId, voterId);

      if (alreadyVoted) {
        return {
          statusCode: 409,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            error: 'Ya has registrado tu voto en esta encuesta'
          })
        };
      }
    }

    // 4. Registrar el voto en DynamoDB
    await db.addVote({
      pollId,
      optionId,
      voterId
    });

    console.log('Voto registrado exitosamente');

    // NOTA: NO llamamos a broadcast aquí.
    // En Fase 4, el DynamoDB Stream trigger automáticamente
    // ejecutará la función BroadcastFunction para notificar a los clientes WebSocket.

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Voto registrado exitosamente',
        pollId,
        optionId
      })
    };

  } catch (error) {
    console.error('Error en voteHandler:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Error interno del servidor al procesar el voto',
        message: error.message
      })
    };
  }
};

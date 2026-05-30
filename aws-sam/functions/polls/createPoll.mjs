// Imports desde Lambda Layer (/opt/nodejs/)
// Determinar ruta de importación según entorno
const isLocal = process.env.NODE_ENV === 'development' && !process.env.AWS_EXECUTION_ENV;
const layerPath = isLocal ? '../../layers/shared-layer/nodejs/index.mjs' : '/opt/nodejs/index.mjs';

const { db } = await import(layerPath);

/**
 * Lambda Handler - Crear Encuesta
 *
 * Crea una nueva encuesta con validaciones.
 * Requiere autenticación JWT (Authorizer).
 *
 * Event body: {
 *   title: string,
 *   description?: string,
 *   options: string[] | {text: string}[],
 *   settings?: { anonymous: boolean, multipleChoice: boolean }
 * }
 *
 * Event requestContext.authorizer: { userId, username }
 */
export const handler = async (event) => {
  console.log('CreatePollHandler - Event:', JSON.stringify(event, null, 2));

  try {
    // Parsear body
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { title, description, options, settings } = body;

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

    // Validaciones básicas
    if (!title || !options || !Array.isArray(options) || options.length < 2) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'La encuesta requiere un título y al menos 2 opciones'
        })
      };
    }

    if (options.length > 10) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'La encuesta no puede tener más de 10 opciones'
        })
      };
    }

    // Validar y formatear opciones
    const formattedOptions = options.map((opt, index) => {
      const text = typeof opt === 'string' ? opt.trim() : opt.text?.trim();
      if (!text) {
        throw new Error(`La opción en la posición ${index + 1} no puede estar vacía`);
      }
      return {
        id: `opt_${Math.random().toString(36).substring(2, 9)}`,
        text
      };
    });

    // Configuración por defecto
    const pollSettings = {
      anonymous: true,
      multipleChoice: false,
      ...settings
    };

    // Crear encuesta en DynamoDB
    const newPoll = await db.createPoll({
      creatorId,
      title: title.trim(),
      description: description?.trim() || '',
      options: formattedOptions,
      settings: pollSettings,
      active: true
    });

    console.log('Encuesta creada:', newPoll.id);

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Encuesta creada exitosamente',
        poll: newPoll
      })
    };

  } catch (error) {
    console.error('Error en createPollHandler:', error);

    // Errores de validación
    if (error.message.includes('opción')) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: error.message })
      };
    }

    // Error genérico
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Error interno del servidor al crear la encuesta',
        message: error.message
      })
    };
  }
};

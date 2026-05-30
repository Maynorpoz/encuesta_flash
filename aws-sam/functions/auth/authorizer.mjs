// Imports desde Lambda Layer (/opt/nodejs/)
// Los módulos npm se importan directamente, SAM los encuentra en el layer

// Determinar ruta de importación según entorno
const isLocal = process.env.NODE_ENV === 'development' && !process.env.AWS_EXECUTION_ENV;
const layerPath = isLocal ? '../../layers/shared-layer/nodejs/index.mjs' : '/opt/nodejs/index.mjs';

const { verifyToken } = await import(layerPath);

/**
 * Lambda Authorizer - Validación de JWT
 *
 * Valida el token JWT del header Authorization y retorna una IAM Policy
 * que permite o deniega el acceso a las rutas de API Gateway.
 *
 * Event: {
 *   type: 'TOKEN',
 *   authorizationToken: 'Bearer <token>',
 *   methodArn: 'arn:aws:execute-api:region:account:apiId/stage/method/path'
 * }
 *
 * Response: {
 *   principalId: string,
 *   policyDocument: IAMPolicy,
 *   context: { userId, username }
 * }
 */
export const handler = async (event) => {
  console.log('AuthorizerHandler - Event:', JSON.stringify(event, null, 2));

  try {
    // Extraer token del header Authorization
    const token = event.authorizationToken?.replace('Bearer ', '');

    if (!token) {
      console.error('No token provided in Authorization header');
      throw new Error('Unauthorized');
    }

    // Verificar token JWT
    let decoded;
    try {
      decoded = verifyToken(token);
      console.log('Token válido para usuario:', decoded.username);
    } catch (error) {
      console.error('Error verificando token:', error.message);
      throw new Error('Unauthorized');
    }

    // Generar IAM Policy - ALLOW
    // Usar wildcard para permitir todos los métodos del API
    const apiArn = event.methodArn.split('/').slice(0, 2).join('/') + '/*';
    const policy = generatePolicy(
      decoded.userId,
      'Allow',
      apiArn,
      {
        userId: decoded.userId,
        username: decoded.username
      }
    );

    console.log('Policy generada:', JSON.stringify(policy, null, 2));
    return policy;

  } catch (error) {
    // En caso de error, denegar acceso
    console.error('Authorizer error:', error.message);

    // API Gateway requiere que lancemos un error "Unauthorized" o retornemos una policy Deny
    // Es más seguro lanzar error para que API Gateway retorne 401
    throw new Error('Unauthorized');
  }
};

/**
 * Genera una IAM Policy para API Gateway
 *
 * @param {string} principalId - ID del usuario (userId)
 * @param {string} effect - 'Allow' o 'Deny'
 * @param {string} resource - ARN del método de API Gateway
 * @param {object} context - Contexto a pasar a las Lambda functions
 * @returns {object} IAM Policy document
 */
function generatePolicy(principalId, effect, resource, context = {}) {
  const policy = {
    principalId: principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource
        }
      ]
    }
  };

  // Agregar contexto si existe
  // El contexto se pasa a las funciones Lambda en event.requestContext.authorizer
  if (context && Object.keys(context).length > 0) {
    policy.context = context;
  }

  return policy;
}

# AWS SAM - Encuesta Flash (Votify)

Este directorio contiene la infraestructura serverless AWS SAM para el proyecto Votify.

## Estructura del Proyecto

```
aws-sam/
├── template.yaml              # CloudFormation template (SAM)
├── samconfig.toml             # Configuración SAM CLI
├── functions/                 # Lambda function handlers
│   ├── auth/                  # Autenticación (register, login, authorizer)
│   ├── polls/                 # CRUD de encuestas
│   └── websocket/             # Conexiones WebSocket en tiempo real
├── layers/                    # Lambda Layers compartidos
│   └── shared-layer/
│       └── nodejs/
│           ├── package.json   # Dependencias compartidas
│           ├── db.mjs         # Cliente DynamoDB
│           └── index.mjs      # Exports del layer
├── scripts/                   # Scripts de utilidad
│   ├── create-table-local.mjs # Crear tabla en DynamoDB Local
│   └── migrate-data.mjs       # Migrar datos JSON → DynamoDB
└── README.md                  # Este archivo
```

## Requisitos

- Node.js 20+
- pnpm 10+
- Docker (para DynamoDB Local)
- AWS SAM CLI (opcional - solo para deploy a AWS)
- AWS CLI configurado (solo para deploy a AWS)

## Desarrollo Local

### 1. Iniciar DynamoDB Local

```bash
# Iniciar contenedor Docker
docker run -d -p 8000:8000 --name dynamodb-local amazon/dynamodb-local

# Verificar que está corriendo
docker ps | grep dynamodb-local
```

### 2. Crear Tabla en DynamoDB Local

```bash
cd scripts
pnpm install
node create-table-local.mjs
```

### 3. Migrar Datos (opcional)

Si tienes datos en `/backend/data/database.json`, puedes migrarlos:

```bash
node scripts/migrate-data.mjs --local
```

### 4. Instalar Dependencias del Layer

```bash
cd layers/shared-layer/nodejs
pnpm install
```

### 5. Construir Proyecto SAM (cuando tengamos funciones Lambda)

```bash
cd /home/alejandro/Proyectos_Decimo/encuesta_flash/aws-sam
sam build
```

### 6. Iniciar API Local (Fase 3)

```bash
sam local start-api --docker-network host
```

Esto iniciará:
- API REST en `http://localhost:3000`
- Las funciones Lambda ejecutándose en contenedores Docker

## Variables de Entorno para Desarrollo Local

Crear archivo `env.local.json` en la raíz del proyecto SAM:

```json
{
  "Parameters": {
    "Environment": "development",
    "JWTSecret": "secret-key-para-encuestas-serverless-2026"
  }
}
```

Para funciones específicas:

```json
{
  "RegisterFunction": {
    "DYNAMODB_TABLE": "EncuestaFlashTable-development",
    "DYNAMODB_ENDPOINT": "http://host.docker.internal:8000",
    "JWT_SECRET": "secret-key-para-encuestas-serverless-2026",
    "NODE_ENV": "development"
  }
}
```

## Deploy a AWS (Fase 6)

### Primera vez (configuración guiada)

```bash
sam build
sam deploy --guided
```

Responder:
- Stack Name: `encuesta-flash-serverless`
- AWS Region: `us-east-1` (o la que prefieras)
- Confirm changes: `Y`
- Allow SAM CLI IAM role creation: `Y`
- Disable rollback: `N`
- Save arguments to config: `Y`

### Deploys subsecuentes

```bash
sam build && sam deploy
```

### Ver Logs

```bash
# Logs de una función específica
sam logs -n RegisterFunction --tail

# Logs de todas las funciones
sam logs --tail
```

### Eliminar Stack

```bash
sam delete
```

## Scripts Útiles

### Crear Tabla en DynamoDB Local

```bash
node scripts/create-table-local.mjs
```

### Migrar Datos a DynamoDB Local

```bash
node scripts/migrate-data.mjs --local
```

### Migrar Datos a DynamoDB AWS

```bash
node scripts/migrate-data.mjs --aws
```

### Validar Template SAM

```bash
sam validate
```

### Invocar Función Lambda Localmente

```bash
# Con evento de prueba
sam local invoke RegisterFunction -e events/register-event.json

# Con variables de entorno
sam local invoke RegisterFunction -e events/register-event.json --env-vars env.local.json
```

## Testing con DynamoDB Local

### Listar Tablas

```bash
aws dynamodb list-tables --endpoint-url http://localhost:8000
```

### Describir Tabla

```bash
aws dynamodb describe-table \
  --table-name EncuestaFlashTable-development \
  --endpoint-url http://localhost:8000
```

### Escanear Tabla (para debugging)

```bash
aws dynamodb scan \
  --table-name EncuestaFlashTable-development \
  --endpoint-url http://localhost:8000
```

### Obtener Item Específico

```bash
aws dynamodb get-item \
  --table-name EncuestaFlashTable-development \
  --key '{"PK":{"S":"USER#abc123"},"SK":{"S":"PROFILE"}}' \
  --endpoint-url http://localhost:8000
```

## Diseño de DynamoDB - Single Table

### Patrones de Acceso

| Entidad | PK | SK | GSI |
|---------|----|----|-----|
| Usuario (por ID) | `USER#<userId>` | `PROFILE` | - |
| Usuario (por username) | `USERNAME#<username>` | `PROFILE` | UsernameIndex |
| Encuesta | `POLL#<pollId>` | `METADATA` | - |
| Encuestas por Creador | `CREATOR#<creatorId>` | `POLL#<pollId>` | CreatorIndex |
| Voto | `POLL#<pollId>` | `VOTE#<voterId>` | - |
| Conexión WebSocket | `CONNECTION#<connId>` | `METADATA` | PollIdIndex |

### Global Secondary Indexes (GSI)

1. **UsernameIndex**
   - PK: `username`
   - SK: `createdAt`
   - Uso: Login por username

2. **CreatorIndex**
   - PK: `creatorId`
   - SK: `createdAt`
   - Uso: Listar polls de un usuario

3. **PollIdIndex**
   - PK: `pollId`
   - Uso: WebSocket broadcast (obtener conexiones activas)

## Troubleshooting

### DynamoDB Local no responde

```bash
# Reiniciar contenedor
docker restart dynamodb-local

# O detener y volver a iniciar
docker stop dynamodb-local
docker rm dynamodb-local
docker run -d -p 8000:8000 --name dynamodb-local amazon/dynamodb-local
```

### Error "Cannot find package @aws-sdk/..."

```bash
# Reinstalar dependencias del layer
cd layers/shared-layer/nodejs
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### SAM build falla

```bash
# Limpiar build cache
rm -rf .aws-sam

# Rebuild
sam build --use-container
```

## Progreso de Migración

- [x] **FASE 1:** Setup SAM + DynamoDB ✅
  - [x] Estructura de carpetas
  - [x] template.yaml con DynamoDB
  - [x] Lambda Layer configurado
  - [x] Abstracción DynamoDB (db.mjs)
  - [x] DynamoDB Local funcionando
  - [x] Scripts de migración

- [ ] **FASE 2:** Core Lambda Functions (En progreso...)
- [ ] **FASE 3:** API Gateway REST API
- [ ] **FASE 4:** WebSocket API
- [ ] **FASE 5:** Frontend Integration
- [ ] **FASE 6:** Deploy & Cleanup

## Recursos

- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [DynamoDB Single Table Design](https://aws.amazon.com/blogs/compute/creating-a-single-table-design-with-amazon-dynamodb/)
- [Lambda Layers](https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html)
- [API Gateway](https://docs.aws.amazon.com/apigateway/)

## Monitoreo (Post-Deploy)

### CloudWatch Logs

```bash
# Ver logs de función
aws logs tail /aws/lambda/encuesta-flash-serverless-RegisterFunction --follow

# Filtrar errores
aws logs filter-pattern ERROR /aws/lambda/encuesta-flash-serverless-RegisterFunction
```

### Métricas

```bash
# Invocaciones de Lambda
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=encuesta-flash-serverless-RegisterFunction \
  --start-time 2026-05-27T00:00:00Z \
  --end-time 2026-05-27T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

---

**Última actualización:** 2026-05-27
**Estado:** Fase 1 completada ✅

# AWS SAM - Encuesta Flash (Votify)

Este directorio contiene la infraestructura serverless AWS SAM para el proyecto Votify.

## 🚀 Referencia Rápida de Comandos SAM

### Deploy Completo (desde cero)
```bash
# 1. Instalar dependencias
cd layers/shared-layer/nodejs && npm install && cd ../../..

# 2. Validar template
sam validate

# 3. Build
sam build

# 4. Deploy (primera vez)
sam deploy --guided

# 5. Deploys posteriores
sam build && sam deploy
```

### Comandos Más Usados
```bash
# Ver logs en tiempo real
sam logs -n <NombreFuncion> --tail

# Invocar función en AWS
sam remote invoke <NombreFuncion> --stack-name encuesta-flash-serverless

# Ver outputs del stack (URLs)
sam list stack-outputs --stack-name encuesta-flash-serverless

# Eliminar todo
sam delete
```

### Desarrollo Local
```bash
# Iniciar API local
sam local start-api

# Invocar función localmente
sam local invoke <NombreFuncion> -e events/test.json

# Sync rápido (desarrollo)
sam sync --stack-name encuesta-flash-serverless --watch
```

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

## Deploy a AWS - Guía Completa

### Prerequisitos

Antes de hacer deploy, asegúrate de tener:

```bash
# 1. AWS CLI instalado y configurado
aws --version
aws configure list

# 2. SAM CLI instalado
sam --version

# 3. Docker corriendo (para builds)
docker ps
```

Si AWS CLI no está configurado:

```bash
aws configure
# AWS Access Key ID: [Tu Access Key]
# AWS Secret Access Key: [Tu Secret Key]
# Default region: us-east-1
# Default output format: json
```

### Paso 1: Instalar Dependencias del Layer

**IMPORTANTE:** Siempre instala las dependencias del layer antes de hacer build.

```bash
# Navegar al directorio del layer
cd layers/shared-layer/nodejs

# Instalar dependencias
npm install

# Verificar que node_modules existe
ls -la node_modules | head

# Volver al directorio raíz de SAM
cd ../../..
```

### Paso 2: Validar Template

Antes de hacer build, valida que el template esté correcto:

```bash
# Validar sintaxis del template.yaml
sam validate

# Si hay errores, aparecerán aquí
# Si está correcto, dirá: "template.yaml is a valid SAM Template"
```

### Paso 3: Build del Proyecto

El comando `sam build` compila y prepara tu aplicación para deploy:

```bash
# Build básico (recomendado)
sam build

# Build con contenedores Docker (más lento pero más preciso)
sam build --use-container

# Build en paralelo (más rápido)
sam build --parallel
```

Qué hace `sam build`:
- Empaqueta cada función Lambda
- Copia las dependencias del Layer
- Genera archivos en `.aws-sam/build/`
- Prepara el template para CloudFormation

**Salida esperada:**
```
Build Succeeded

Built Artifacts  : .aws-sam/build
Built Template   : .aws-sam/build/template.yaml

Commands you can use next
=========================
[*] Invoke Function: sam local invoke
[*] Deploy: sam deploy --guided
```

### Paso 4: Deploy - Primera Vez (Configuración Guiada)

La primera vez que haces deploy, usa `--guided`:

```bash
sam deploy --guided
```

**Configuración interactiva paso a paso:**

```
Setting default arguments for 'sam deploy'
=========================================

Stack Name [sam-app]: encuesta-flash-serverless
AWS Region [us-east-1]: us-east-1
Parameter Environment [development]: development
Parameter JWTSecret []: secret-key-para-encuestas-serverless-2026

#Shows you resources changes to be deployed and require a 'Y' to initiate deploy
Confirm changes before deploy [y/N]: Y

#SAM needs permission to be able to create roles to connect to the resources in your template
Allow SAM CLI IAM role creation [Y/n]: Y

#Preserves the state of previously provisioned resources when an operation fails
Disable rollback [y/N]: N

Save arguments to configuration file [Y/n]: Y
SAM configuration file [samconfig.toml]: samconfig.toml
SAM configuration environment [default]: default
```

**Qué pasa durante el deploy:**

1. **Package:** Sube código a S3
   ```
   Uploading to a482226affc8e9af22f24340ca52fc93  36364150 / 36364150  (100.00%)
   ```

2. **CreateChangeSet:** Prepara cambios de CloudFormation
   ```
   Waiting for changeset to be created..
   ```

3. **ExecuteChangeSet:** Aplica los cambios
   ```
   CloudFormation events from stack operations
   CREATE_IN_PROGRESS  AWS::Lambda::LayerVersion  SharedLayer
   CREATE_COMPLETE     AWS::Lambda::LayerVersion  SharedLayer
   CREATE_IN_PROGRESS  AWS::Lambda::Function      RegisterFunction
   ...
   ```

4. **Outputs:** Muestra URLs y ARNs
   ```
   Key                 ApiEndpoint
   Value               https://f81brf5js6.execute-api.us-east-1.amazonaws.com/prod

   Key                 WebSocketEndpoint
   Value               wss://7yrl08ar38.execute-api.us-east-1.amazonaws.com/prod
   ```

### Paso 5: Deploys Subsecuentes

Después del primer deploy, simplemente:

```bash
# Build + Deploy en un solo comando
sam build && sam deploy

# O con confirmación automática
sam build && echo "y" | sam deploy
```

### Paso 6: Verificar el Deploy

```bash
# Ver el estado del stack
aws cloudformation describe-stacks \
  --stack-name encuesta-flash-serverless \
  --query 'Stacks[0].StackStatus'

# Listar todos los outputs (URLs, ARNs, etc)
aws cloudformation describe-stacks \
  --stack-name encuesta-flash-serverless \
  --query 'Stacks[0].Outputs'

# Ver recursos creados
aws cloudformation list-stack-resources \
  --stack-name encuesta-flash-serverless
```

### Comandos SAM Útiles Post-Deploy

#### Ver Logs en Tiempo Real

```bash
# Logs de una función específica (con tail)
sam logs -n RegisterFunction --tail

# Logs desde hace 10 minutos
sam logs -n RegisterFunction --start-time '10min ago'

# Logs con filtro
sam logs -n RegisterFunction --filter ERROR

# Logs de todas las funciones
sam logs --tail

# Logs de Lambda + API Gateway
sam logs -n RegisterFunction --include-traces
```

#### Invocar Funciones en AWS

```bash
# Invocar función deployada en AWS
sam remote invoke RegisterFunction \
  --stack-name encuesta-flash-serverless \
  --event-file events/register-event.json

# Ver el resultado directamente
sam remote invoke RegisterFunction \
  --stack-name encuesta-flash-serverless \
  --event '{"body":"{\"username\":\"test\",\"password\":\"test123\"}"}'
```

#### Sincronización Rápida (Para Desarrollo)

```bash
# Sync code changes sin rebuild completo
sam sync --stack-name encuesta-flash-serverless --watch

# Solo código (sin cambios de infraestructura)
sam sync --code --stack-name encuesta-flash-serverless
```

#### Ver Información del Stack

```bash
# Lista todos los stacks
sam list stack-outputs --stack-name encuesta-flash-serverless

# Ver endpoints
sam list endpoints --stack-name encuesta-flash-serverless

# Ver recursos
sam list resources --stack-name encuesta-flash-serverless
```

### Actualizar Stack (Cambios en template.yaml)

Cuando modificas `template.yaml`:

```bash
# 1. Rebuild
sam build

# 2. Ver qué va a cambiar
sam deploy --no-execute-changeset

# 3. Aplicar cambios
sam deploy

# O todo junto con confirmación
sam build && sam deploy
```

### Rollback de un Deploy

Si algo sale mal:

```bash
# Opción 1: Rollback manual desde consola AWS
# Stack → Actions → Rollback

# Opción 2: Eliminar y redesplegar
sam delete
sam build && sam deploy --guided

# Opción 3: Deploy de versión anterior
git checkout <commit-anterior>
sam build && sam deploy
```

### Eliminar Stack Completo

```bash
# Eliminar todo (stack, funciones, API Gateway, DynamoDB, etc)
sam delete

# O con confirmación automática
echo "y" | sam delete

# Verificar que se eliminó
aws cloudformation describe-stacks \
  --stack-name encuesta-flash-serverless
# Debe dar error: "Stack with id encuesta-flash-serverless does not exist"
```

**⚠️ ADVERTENCIA:** `sam delete` elimina:
- Todas las Lambda Functions
- API Gateway (REST + WebSocket)
- DynamoDB Table (¡y todos los datos!)
- Lambda Layers
- Roles IAM
- CloudWatch Logs

### Troubleshooting de Deploy

#### Error: "Unable to upload artifact"

```bash
# Solución: Rebuild limpio
rm -rf .aws-sam
sam build
sam deploy
```

#### Error: "No changes to deploy"

```bash
# Forzar redesploy
sam deploy --force-upload
```

#### Error: "Stack is in UPDATE_ROLLBACK_FAILED state"

```bash
# Continuar rollback
aws cloudformation continue-update-rollback \
  --stack-name encuesta-flash-serverless

# Esperar a que complete
aws cloudformation wait stack-rollback-complete \
  --stack-name encuesta-flash-serverless

# Luego redesplegar
sam build && sam deploy
```

#### Error: "Rate exceeded" (demasiadas peticiones)

```bash
# Esperar 1 minuto y reintentar
sleep 60 && sam deploy
```

### Mejores Prácticas

1. **Siempre hacer build antes de deploy**
   ```bash
   sam build && sam deploy
   ```

2. **Verificar cambios antes de aplicarlos**
   ```bash
   sam deploy --confirm-changeset
   ```

3. **Usar parámetros para diferentes ambientes**
   ```bash
   sam deploy --parameter-overrides Environment=production
   ```

4. **Mantener backups de DynamoDB**
   ```bash
   aws dynamodb create-backup \
     --table-name EncuestaFlashTable-development \
     --backup-name backup-$(date +%Y%m%d)
   ```

5. **Usar tags para organizar recursos**
   ```bash
   sam deploy --tags "Project=Votify Environment=Production"
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

- [x] **FASE 2:** Core Lambda Functions ✅
  - [x] Funciones de autenticación (register, login, authorizer)
  - [x] Funciones CRUD de polls
  - [x] Integración con DynamoDB

- [x] **FASE 3:** API Gateway REST API ✅
  - [x] Configuración de rutas
  - [x] CORS configurado
  - [x] Lambda Authorizer integrado

- [x] **FASE 4:** WebSocket API ✅
  - [x] Conexiones WebSocket (connect, disconnect, default)
  - [x] DynamoDB Streams trigger
  - [x] Broadcast en tiempo real funcionando

- [x] **FASE 5:** Frontend Integration ✅
  - [x] Frontend actualizado con iconos Lucide
  - [x] Variables de entorno configuradas
  - [x] Deploy a Netlify
  - [x] WebSocket en tiempo real operativo

- [ ] **FASE 6:** Deploy & Cleanup
  - [ ] Documentación final
  - [ ] Monitoreo configurado
  - [ ] Backend local eliminado

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

**Última actualización:** 2026-05-30
**Estado:** Fases 1-5 completadas ✅ | Sistema 100% funcional en AWS + Netlify

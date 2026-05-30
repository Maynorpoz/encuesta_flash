# Configuración del Frontend - Encuesta Flash

## Variables de Entorno

El frontend utiliza variables de entorno para configurar los endpoints de la API y WebSocket.

### Desarrollo Local

El archivo `.env.development` ya está configurado para desarrollo local:

```
VITE_API_BASE_URL=http://localhost:3000
VITE_WS_BASE_URL=ws://localhost:3001
```

### Producción (AWS)

1. **Hacer deploy del backend a AWS:**
   ```bash
   cd ../aws-sam
   sam build
   sam deploy --guided
   ```

2. **Copiar los endpoints del output:**
   Después del deploy, SAM mostrará los endpoints:
   ```
   Outputs:
   ApiEndpoint = https://xxxxx.execute-api.us-east-1.amazonaws.com/prod
   WebSocketEndpoint = wss://yyyyy.execute-api.us-east-1.amazonaws.com/prod
   ```

3. **Crear archivo .env.production:**
   ```bash
   cp .env.production.example .env.production
   ```

4. **Editar .env.production con los valores reales:**
   ```
   VITE_API_BASE_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com/prod
   VITE_WS_BASE_URL=wss://yyyyy.execute-api.us-east-1.amazonaws.com/prod
   ```

5. **Build del frontend:**
   ```bash
   npm run build
   ```

## Cambios Realizados

### api.js

- Reemplazadas URLs hardcodeadas por variables de entorno
- Removido prefijo `/api` (ya no necesario con API Gateway)
- Actualizado mensaje WebSocket de `type` a `action` para coincidir con RouteSelectionExpression

### Rutas API

Las rutas ahora coinciden exactamente con las definidas en API Gateway:

- `POST /auth/register` - Registro de usuario
- `POST /auth/login` - Login de usuario
- `POST /polls` - Crear encuesta (autenticado)
- `GET /polls/me` - Obtener encuestas del usuario (autenticado)
- `GET /polls/{pollId}` - Obtener encuesta por ID (público)
- `POST /polls/vote` - Votar (público)
- `GET /polls/{pollId}/results` - Obtener resultados (público)

### WebSocket

El WebSocket ahora se conecta directamente al API Gateway WebSocket y envía mensajes con el formato:

```javascript
{
  "action": "subscribe",
  "pollId": "poll-id"
}
```

## Testing

### Desarrollo Local
```bash
npm run dev
```

### Preview de Producción
```bash
npm run build
npm run preview
```

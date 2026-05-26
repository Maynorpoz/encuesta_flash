# Votify - Sistema de Encuestas Serverless en Tiempo Real

Votify es una aplicación web moderna y reactiva diseñada bajo la arquitectura **Serverless**. Permite a los usuarios registrarse, crear encuestas personalizadas, compartir enlaces de votación y observar la actualización de resultados acumulados en tiempo real a través de WebSockets sin necesidad de refrescar la página.

Este proyecto ha sido desarrollado como el trabajo final para el curso de **Arquitectura de Software**, demostrando la aplicación práctica de conceptos de desacoplamiento de funciones, escalabilidad elástica, persistencia ágil en la nube, y diseño de contratos (APIs).

---

## 🚀 Características del Proyecto
*   **Autenticación Serverless**: Registro e inicio de sesión seguros mediante tokens JWT administrados por una función serverless dedicada.
*   **Creación Dinámica de Encuestas**: Panel interactivo para agregar, renombrar y configurar de 2 a 10 opciones de respuesta.
*   **Votación Pública e Instantánea**: Interfaz móvil y de escritorio optimizada para el registro ágil de votos.
*   **Monitoreo en Tiempo Real**: Pantalla de resultados equipada con gráficos de barras interactivos animados y canales WebSocket para visualización reactiva al instante.
*   **UI/UX Premium**: Diseño visual sofisticado bajo la técnica de *Glassmorphism* (efecto esmerilado translúcido) y soporte nativo para modo oscuro.

---

## 🛠️ Stack Tecnológico

*   **Frontend**: React (Vite), Vanilla CSS (animaciones optimizadas y diseño responsivo).
*   **Backend (Serverless Emulator)**: Node.js (Express y WS Server) estructurado con total separación de responsabilidades para emular AWS Lambda y AWS API Gateway de manera local y portátil.
*   **Base de Datos**: Capa de acceso desnormalizada (simulando DynamoDB / Firestore) con persistencia en disco basada en JSON.
*   **Protocolo Real-Time**: WebSockets nativos.

---

## 📁 Estructura del Repositorio

El código del proyecto está organizado de manera limpia y modular:

```text
encuestas/
├── backend/                  # Código del Servidor (Serverless Emulator)
│   ├── src/
│   │   ├── functions/        # Funciones/Handlers independientes (AWS Lambda equivalents)
│   │   │   ├── auth.js       # Lambda: Registro y Login (JWT Authorizer)
│   │   │   ├── createPoll.js # Lambda: Creación y listado de encuestas
│   │   │   ├── getPoll.js    # Lambda: Obtener metadatos públicos de encuesta
│   │   │   ├── getResults.js # Lambda: Obtener resultados agregados (REST)
│   │   │   ├── vote.js       # Lambda: Registrar voto y despachar eventos de actualización
│   │   │   └── wsHandler.js  # Gestor WebSocket y difusor en tiempo real
│   │   ├── services/         # Servicios de datos compartidos
│   │   │   └── db.js         # Capa de base de datos desnormalizada
│   │   └── apiGateway.js     # Enrutador Express principal (API Gateway Emulator)
│   └── package.json
├── frontend/                 # Aplicación Web SPA
│   ├── src/
│   │   ├── components/       # Componentes reusables de diseño UI
│   │   ├── pages/            # Vistas (Home, Login, Register, Dashboard, Vote, Results)
│   │   ├── styles/           # Hojas de estilo personalizadas (index.css con Glassmorphism)
│   │   ├── utils/            # Módulo de API cliente (Fetch & WS connections)
│   │   ├── App.jsx           # Enrutador local nativo de la SPA
│   │   └── main.jsx
│   └── package.json
├── docs/                     # Documentación Técnica del Proyecto
│   ├── arquitectura.md       # Diagramas Mermaid (Casos de Uso, Secuencia, Arquitectura)
│   └── api-spec.yaml         # Contrato técnico OpenAPI 3.0 / Swagger
└── package.json              # Configuración y orquestador del proyecto raíz
```

---

## 💻 Instrucciones para Ejecución Local

Para facilitar la ejecución inmediata sin depender de la nube de AWS o Firebase, el proyecto está completamente auto-contenido.

### Requisitos Previos
*   Tener instalado **Node.js** (versión 18 o superior).

### Paso 1: Clonar e Instalar Dependencias
Desde la raíz del proyecto, ejecuta el comando para instalar todas las dependencias del proyecto raíz, frontend y backend de manera automática:
```bash
npm run install:all
```

### Paso 2: Ejecutar en Entorno de Desarrollo
Para levantar los servidores del frontend (Vite) y el backend (API Gateway + WebSockets) en paralelo, ejecuta el comando:
```bash
npm run dev
```

Esto iniciará de forma automática:
1.  **Frontend**: [http://localhost:5173](http://localhost:5173) (Página principal de Votify).
2.  **API Gateway**: [http://localhost:5000](http://localhost:5000) (Endpoints REST emulando AWS Lambda).
3.  **WebSocket Gateway**: `ws://localhost:5000/ws` (Transmisión de resultados en tiempo real).

---

## 📊 Documentación Adicional
1.  **Diagramas Técnicos**: Encontrarás el diagrama de arquitectura serverless, el flujo de secuencia en tiempo real y los casos de uso descritos en formato Mermaid dentro del archivo [docs/arquitectura.md](file:///c:/Users/mayno/OneDrive/Escritorio/encuestas/docs/arquitectura.md).
2.  **Contrato de la API**: La especificación completa de los endpoints REST está detallada bajo el estándar abierto en [docs/api-spec.yaml](file:///c:/Users/mayno/OneDrive/Escritorio/encuestas/docs/api-spec.yaml).

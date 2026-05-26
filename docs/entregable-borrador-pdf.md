# Borrador del Informe del Proyecto Final: Votify

> [!NOTE]
> **Instrucciones para el estudiante**: Copia el contenido de este archivo en un procesador de textos (como Microsoft Word, Google Docs o Notion), personaliza la portada con los datos de tu grupo/universidad, toma las capturas de pantalla una vez que ejecutes el sistema localmente, ¡y expórtalo como PDF!

---

## PORTADA
*   **Nombre de la Institución**: [Ingresa el nombre de tu Universidad]
*   **Facultad**: Facultad de Ingeniería y Ciencias de la Computación
*   **Curso**: Arquitectura de Software
*   **Nombre del Proyecto**: Votify - Encuestas Online con Resultados en Tiempo Real
*   **Grupo**: Grupo 1 y 3 (Arquitectura Serverless)
*   **Integrantes**:
    *   [Integrante 1]
    *   [Integrante 2]
    *   [Integrante 3]
*   **Fecha de Entrega**: [Fecha actual]

---

## 1. DESCRIPCIÓN DEL PROBLEMA

En entornos corporativos, educativos o sociales, la toma de decisiones ágiles requiere mecanismos rápidos y fiables para recopilar la opinión de un grupo de personas. Los sistemas tradicionales de encuestas suelen basarse en peticiones HTTP periódicas (request-response) que obligan al usuario a recargar la página para ver actualizaciones. Esto arruina la interactividad en presentaciones de diapositivas en vivo, conferencias o votaciones rápidas en clase.

Por otra parte, la infraestructura de backend para soportar encuestas suele verse expuesta a picos masivos de tráfico. Por ejemplo, una encuesta compartida en una red social o proyectada en un auditorio pasa de 0 a miles de usuarios en segundos, y luego vuelve a un estado de inactividad total. Un servidor convencional (tipo Monolito con VM fija) requeriría aprovisionarse para el pico máximo de tráfico, lo que representa un desperdicio del 95% del presupuesto cuando el sistema no está en uso.

**Votify** resuelve estos problemas combinando una interfaz interactiva de actualización instantánea a través de WebSockets con un diseño conceptual Serverless, asegurando escalabilidad bajo demanda sin desperdicio de recursos de computación.

---

## 2. ALCANCE DEL MVP (Producto Mínimo Viable)

El MVP desarrollado cumple con las siguientes capacidades esenciales:
1.  **Registro y Autenticación**: Módulo seguro para creadores de encuestas (login y registro con JWT).
2.  **Creación de Encuestas**: Editor dinámico para ingresar una pregunta y añadir entre 2 y 10 opciones de respuestas personalizadas.
3.  **Votación Pública y Anónima**: Compartir un enlace único que permita a usuarios externos (no autenticados) votar ágilmente una sola vez por dispositivo/navegador.
4.  **Resultados en Tiempo Real**: Vista de resultados equipada con gráficos de barras animados que se actualizan instantáneamente a través de un WebSocket persistente ante cada voto registrado.
5.  **Dashboard del Creador**: Panel donde el usuario autenticado ve el listado de encuestas creadas y el total acumulado de votos obtenidos.

---

## 3. REQUERIMIENTOS FUNCIONALES Y NO FUNCIONALES

### Requerimientos Funcionales (RF)
*   **RF-1**: El sistema debe permitir a nuevos creadores registrarse usando un nombre de usuario único y contraseña.
*   **RF-2**: El creador autenticado debe poder diseñar encuestas indicando pregunta, descripción y múltiples opciones.
*   **RF-3**: El creador autenticado debe poder ver un listado histórico de sus encuestas y sus estadísticas rápidas (votos totales).
*   **RF-4**: El sistema debe generar un enlace único de votación y otro enlace para monitorear los resultados en tiempo real.
*   **RF-5**: Cualquier usuario con el enlace público de votación debe poder emitir su voto sin necesidad de iniciar sesión.
*   **RF-6**: El sistema debe validar que un votante no emita más de un voto por encuesta.
*   **RF-7**: La página de resultados debe recibir y pintar las actualizaciones de forma automática sin recargar el navegador.

### Requerimientos No Funcionales (RNF)
*   **RNF-1 (Latencia)**: La actualización de resultados en vivo debe reflejarse en los clientes conectados en menos de 500ms tras registrar el voto.
*   **RNF-2 (Escalabilidad)**: La arquitectura debe soportar incrementos abruptos en el volumen de peticiones mediante el desacoplamiento de funciones independientes.
*   **RNF-3 (Usabilidad/Aesthetics)**: La interfaz de usuario debe ser atractiva, responsiva y adaptada a dispositivos móviles, aplicando conceptos modernos de diseño visual como *Glassmorphism*.
*   **RNF-4 (Seguridad)**: Las operaciones de creación y consulta privada de encuestas deben requerir tokenización JWT en el encabezado HTTP.

---

## 4. ARQUITECTURA Y DIAGRAMAS

### Justificación de la Arquitectura Serverless
Elegir un modelo **Serverless** para Votify se justifica por:
1.  **Escalabilidad Elástica**: Ante la viralidad de una encuesta, las plataformas Serverless (como AWS Lambda o Cloud Functions) crean contenedores efímeros bajo demanda para responder a cada voto individualmente, liberando recursos automáticamente al terminar la ejecución.
2.  **Costo de Ejecución**: En lugar de pagar por un servidor virtual activo 24/7 (como AWS EC2), el modelo serverless factura por milisegundos de uso de computación (`pago-por-uso`). Durante la noche, si no hay votos ni visitas, el costo total del backend es de $0.
3.  **Tolerancia a Fallos**: Si una función Lambda dedicada a registrar votos falla catastróficamente por una carga extrema, no afecta las funciones de login o creación, aislando el error.

### Diagrama de Arquitectura
*(Por favor copia el diagrama del archivo docs/arquitectura.md e insértalo en esta sección. En el reporte final, también puedes exportarlo a formato imagen usando un visor de Mermaid)*

```mermaid
graph TD
    Client[Cliente / Navegador Web] <-->|HTTP / WebSockets| APIGateway[AWS API Gateway]
    
    subgraph AWS Cloud (Servicios Administrados)
        APIGateway -->|Enruta Peticiones REST| LambdaAuth[AWS Lambda: Auth Function]
        APIGateway -->|Enruta Peticiones REST| LambdaCreate[AWS Lambda: Create Poll Function]
        APIGateway -->|Enruta Peticiones REST| LambdaVote[AWS Lambda: Vote Function]
        
        LambdaAuth -->|Persiste Usuarios| DB[(AWS DynamoDB)]
        LambdaCreate -->|Persiste Encuestas| DB
        LambdaVote -->|Registra Votos| DB
        
        DB -->|DynamoDB Streams | Stream[Stream de Datos de Votos]
        Stream -->|Dispara Evento| LambdaWS[AWS Lambda: WS Broadcast Function]
        
        APIGateway <.->|Gestiona Conexiones WS| LambdaWS
    end
```

### Diagramas de Secuencia y Casos de Uso
*(Copia también los diagramas de Secuencia y Casos de Uso del archivo docs/arquitectura.md para cumplir con la rúbrica de "al menos 2 diagramas adicionales")*

---

## 5. STACK TECNOLÓGICO

*   **Frontend**: HTML5 y React (Vite) para una Single Page Application (SPA) modular y veloz.
*   **Estilos**: Vanilla CSS personalizado, aplicando HSL, gradientes lineares, efectos translúcidos (backdrop-filter) y transiciones fluidas.
*   **Backend (Emulación de API Gateway e IAAS Serverless)**: Node.js + Express enrutando de forma desacoplada las peticiones a controladores (handlers) independientes que funcionan como funciones serverless puras.
*   **Tiempo Real**: Canales de WebSockets para comunicación persistente bidireccional de baja latencia.
*   **Base de Datos**: Colecciones JSON almacenadas de forma local en disco, simulando un almacenamiento NoSQL flexible estructurado en documentos.

---

## 6. DECISIONES Y TRADE-OFFS

### WebSockets sobre Server-Sent Events (SSE)
*   **Decisión**: Se implementó una conexión WebSocket completa bidireccional para recibir las actualizaciones de los resultados.
*   **Trade-off**: Mientras que SSE es unidireccional y corre sobre HTTP clásico, WebSockets es un estándar que requiere el mantenimiento del estado de la conexión en el servidor. Esto se resolvió utilizando un orquestador de conexiones (`wsHandler`) que asocia las conexiones WebSocket a identificadores únicos de encuestas.

### Base de Datos Emulada en Disco Local
*   **Decisión**: Usar un archivo de persistencia local JSON controlado por la clase `Database`.
*   **Trade-off**: Permite la ejecución del proyecto localmente de forma autocontenida sin requerir credenciales de AWS o Firebase. El código fue estructurado bajo un patrón de Adapter, lo que permite cambiar el origen de datos a Firebase Firestore cambiando una sola línea de código en producción.

---

## 7. EVIDENCIA DEL SISTEMA (Capturas de Pantalla)

> [!TIP]
> **Acción Requerida**: Levanta el sistema localmente con `npm start` y toma capturas de pantalla de las siguientes secciones para insertarlas aquí:
> 1.  **Página de Inicio (Landing Page)**: Destacando el diseño del fondo y el efecto del título.
> 2.  **Formulario de Login / Registro**: Evidenciando los campos con bordes interactivos.
> 3.  **Dashboard del Creador**: Donde se visualiza el resumen de encuestas con sus contadores de votos.
> 4.  **Creador de Encuestas**: Agregando opciones de forma dinámica con el botón "+ Agregar opción".
> 5.  **Página Pública de Votación**: Mostrando la encuesta con las opciones en forma de botones de selección.
> 6.  **Página de Resultados en Tiempo Real**: Captura la actualización inmediata de los gráficos de barras tras emitir un voto en una ventana de incógnito paralela.

---

## 8. INSTRUCCIONES DE EJECUCIÓN

1.  Asegúrate de contar con **Node.js** v18 o superior.
2.  Clona el repositorio e instala las dependencias de todos los módulos del proyecto:
    ```bash
    npm run install:all
    ```
3.  Inicia la aplicación en paralelo para el frontend y el backend emulador:
    ```bash
    npm run dev
    ```
4.  Navega a [http://localhost:5173](http://localhost:5173) en tu navegador preferido.

---

## 9. CONCLUSIONES

1.  La arquitectura serverless es idónea para sistemas basados en eventos de alta concurrencia variable. El procesamiento desacoplado en funciones individuales garantiza un aislamiento de fallas que previene caídas totales del servicio.
2.  La combinación de API Gateway y WebSockets proporciona un canal eficiente en la nube para empujar actualizaciones instantáneas de datos a los clientes, minimizando la sobrecarga de consultas en bases de datos.
3.  Al estructurar el emulador local con handlers aislados que reciben `req` y `res`, se comprueba que el desarrollo serverless no requiere de entornos en la nube obligatorios para la fase de prototipado y validación técnica, disminuyendo los tiempos y costos de diseño.

# Vista de Procesos
**"Plataforma de Gestión de Proveedores - Indurama"**

## ¿Qué son los diagramas de secuencia?
Los diagramas de secuencia son una herramienta de modelado en la Ingeniería de Software que forma parte del Lenguaje Unificado de Modelado (UML). Se utilizan para describir cómo los objetos de un sistema interactúan entre sí a través del tiempo, mostrando el flujo de mensajes o llamadas entre ellos. Estos diagramas son especialmente útiles para representar procesos y casos de uso en sistemas orientados a objetos.

### Estructura que siguen los diagramas de secuencia
*   **Actores y Objetos:** Representan las entidades que participan en la interacción. Los actores se representan como figuras humanas, y los objetos como rectángulos.
*   **Líneas de vida:** Indican la existencia de un actor u objeto durante el proceso. Son líneas verticales que comienzan debajo de cada actor u objeto.
*   **Mensajes:** Representan la comunicación entre actores y objetos mediante flechas horizontales.
*   **Bloques de ejecución:** Rectángulos sobre las líneas de vida que representan la ejecución de un proceso o método.
*   **Tiempo:** Se representa de forma implícita en la dirección descendente del diagrama.

---

## Diagramas de secuencia

### Diagrama 1: Identificar Necesidad

![Diagramas Secuencia 1](https://github.com/user-attachments/assets/9da92193-dcc8-476a-a083-33c806ce6104)

**Explicación:**
Este diagrama describe el flujo inicial donde el **Solicitante** genera un requerimiento de abastecimiento. El **Sistema Indurama** actúa como intermediario para validar y procesar los datos. Los pasos detallados son:

1.  **Consulta de Datos:** El Solicitante consulta los datos de la empresa y departamento; el Sistema retorna la información general necesaria.
2.  **Creación:** El Solicitante envía el mensaje `Crear Necesidad` a la entidad **Necesidad**.
3.  **Definición de Parámetros:** El Solicitante define el rango de fechas (`fechaInicio`, `fechaFin`) y confirma el Tipo de Proyecto.
4.  **Clasificación:** Se busca y selecciona la **Clase de Búsqueda** (ej. Materia Prima, Servicios) y el sistema devuelve la información correspondiente.
5.  **Documentación:** El Solicitante define el Pliego Técnico y adjunta los **Documentos Técnicos** de respaldo, recibiendo una confirmación de los adjuntos cargados.

### Diagrama 2: Búsqueda de Proveedor

![Diagramas Secuencia 2](https://github.com/user-attachments/assets/0d8e9fd9-c449-4451-8d7d-15eb8fcbde21)

**Explicación:**
Este diagrama detalla el proceso de gestión de proveedores nuevos. El **Gestor** procesa una sugerencia (derivada de una necesidad) y gestiona el alta del proveedor en el sistema. El flujo es:

1.  **Gestión de la Sugerencia:** El Gestor consulta datos, crea la `Sugerencia` con datos básicos y detalla el área (Mantenimiento/Procesos/I+D).
2.  **Vinculación:** La sugerencia se vincula a la entidad **Necesidad**.
3.  **Definición Técnica:** El Gestor confirma las fechas, el tipo de proyecto y define la ficha técnica (Pliego) en el sistema.
4.  **Invitación:** El Gestor envía el mensaje `Invitar Proveedor(email, nombre)` al actor **Proveedor**.
5.  **Registro del Proveedor:** El Proveedor recibe la invitación, ejecuta `Crear Cuenta` (estado Pendiente) e ingresa su información secuencialmente:
    *   Información Fiscal y Legal.
    *   Información Bancaria y Tributaria.
6.  **Validación y Decisión:** El sistema valida la información ingresada. Finalmente, el Gestor envía el mensaje `Aprobar Proveedor` o `Rechazar Proveedor` para finalizar el proceso.

### Diagrama 3: Cotización

![Diagramas Secuencia 3](https://github.com/user-attachments/assets/b0ca5a19-917b-40d1-8544-5467613e5b11)

**Explicación:**
Este diagrama modela la fase de negociación y selección de ofertas. El **Gestor** solicita precios y el **Proveedor** responde a través de la entidad **Cotizacion**. Los pasos son:

1.  **Investigación:** El Gestor consulta la experiencia, referencias, costos y localización del Proveedor; el Proveedor devuelve esta información.
2.  **Solicitud:** El Gestor ejecuta el mensaje `Solicitar Cotización`.
3.  **Oferta:** El Proveedor responde ejecutando `Generar Cotización`, ingresando el `montoTotal` y la `fecha`.
4.  **Gestión:** El Gestor recibe la cotización y ejecuta `Gestionar Cotizacion`.
5.  **Comparación:** El Gestor realiza la acción `Comparar Con Otra Cotizacion` y el sistema devuelve el `Resultado Comparación`.
6.  **Selección:** El Gestor selecciona la mejor opción (`Seleccionar Cotización`), el sistema actualiza el estado a "Aceptada" y notifica la selección al Proveedor.

### Diagrama 4: Evaluación de Proveedor (EPI)

![Diagramas Secuencia 4](https://github.com/user-attachments/assets/9094e4a4-9510-4afb-81b3-8154cdf2a014)

**Explicación:**
Este diagrama representa el proceso de auditoría y calificación de desempeño (Evaluación de Proveedor Interno). El **Gestor** califica al **Proveedor** interactuando con las entidades `EvaluacionProveedor`, `ResultadoCriterio` y `Retroalimentacion`. El flujo lógico es:

1.  **Inicio:** El Gestor inicia el proceso `Realizar Evaluacion`.
2.  **Datos Previos:** Se consultan datos AMEF (Análisis de Modo y Efecto de Falla) y datos generales de calidad/comerciales.
3.  **Registro:** El Gestor registra el análisis AMEF en la entidad `EvaluacionProveedor`.
4.  **Calificación:** El Gestor ingresa los valores para cada criterio en la entidad `ResultadoCriterio`.
5.  **Cálculo:** El sistema ejecuta los cálculos internos:
    *   `Calcular Puntajes` (Globales).
    *   `Calcular Puntaje Calidad`.
    *   `Calcular Puntaje Abastecimiento`.
6.  **Retroalimentación:** Se genera el objeto `Retroalimentacion` y se envía al Proveedor.
7.  **Cierre:** El sistema notifica al Proveedor el resultado y este envía un mensaje de `Confirmar Recepción`.

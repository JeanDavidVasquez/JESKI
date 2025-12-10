# Modelo de Datos
**"Plataforma de Gestión de Proveedores - Indurama"**

## ¿Qué es un modelo de datos?
Un modelo de datos es una representación estructurada que define cómo se organizan, almacenan y manipulan los datos dentro de un sistema o base de datos. Es un diseño conceptual que para este proyecto describe:

*   **Entidades:** Objetos o conceptos del ecosistema de Indurama, como "**Proveedor**", "**Solicitud**", "**Cotización**" o "**Evaluación EPI**".
*   **Atributos:** Propiedades o características de las entidades, como el "*RUC*" de una empresa, el "*monto total*" de una oferta o el "*puntaje*" de una auditoría.
*   **Relaciones:** Conexiones o asociaciones entre entidades, como la relación entre un "**Gestor**" y las "**Evaluaciones**" que realiza.

El propósito principal de este modelo es facilitar la comprensión y gestión de los datos complejos de abastecimiento, asegurando que estén organizados de manera lógica para soportar los procesos de auditoría y compras.

---

## Estructura general del modelo de datos
El modelo de datos para Indurama se compone de los siguientes elementos clave:

### 1. Entidades
Representan los objetos principales que necesitan ser modelados dentro del sistema.
*   **Usuario:** La entidad base para la autenticación y roles (Solicitante, Gestor).
*   **Proveedor:** La entidad central que almacena la información corporativa, legal y operativa.
*   **Necesidad:** El requerimiento inicial generado por un departamento interno.
*   **EvaluacionProveedor (EPI):** El registro de la auditoría de calidad y abastecimiento.

### 2. Atributos
Son las características o propiedades que describen una entidad. Basado en nuestro diagrama, los ejemplos incluyen:

*   **Proveedor:** `razon_social`, `ruc`, `info_bancaria`, `amef`.
*   **Cotización:** `fecha`, `monto_total`, `estado`.
*   **CriterioEvaluacion:** `nombre`, `puntaje_maximo`, `ponderacion`.

### 3. Relaciones
Describen cómo las entidades están conectadas entre sí y cómo interactúan.
*   Un **Solicitante** *genera* una **Necesidad**.
*   Un **Proveedor** *envía* una o varias **Cotizaciones**.
*   Una **Evaluación** *está compuesta por* múltiples **Resultados de Criterio**.
*   Un **Gestor** *redacta* una **Retroalimentación**.

---

## Diagrama Entidad-Relación (DER)

<img width="3320" height="1525" alt="modelo datos" src="https://github.com/user-attachments/assets/3efe1d19-39e0-4a7f-a05e-7945d5784157" />

---

## Diccionario de Datos
A continuación, se detalla la estructura lógica de las tablas principales del sistema:

### A. Gestión de Usuarios
| Entidad | Atributos Clave | Descripción |
| :--- | :--- | :--- |
| **DEPARTAMENTO** | `id_departamento`, `nombre` | Áreas de la empresa (Ej: Mantenimiento). |
| **USUARIO** | `id_usuario`, `email`, `rol`, `password` | Credenciales y datos de acceso. |
| **SOLICITANTE** | `id_usuario`, `area` | Datos específicos del empleado que pide insumos. |

### B. Gestión de Proveedores
| Entidad | Atributos Clave | Descripción |
| :--- | :--- | :--- |
| **PROVEEDOR** | `id_proveedor`, `ruc`, `razon_social`, `amef` | Información legal, fiscal y de riesgos. |
| **CONTACTO_PROVEEDOR** | `id_contacto`, `nombre`, `rol` | Personas clave (Gerente, Calidad). |

### C. Flujo de Compras
| Entidad | Atributos Clave | Descripción |
| :--- | :--- | :--- |
| **NECESIDAD** | `id_necesidad`, `descripcion`, `tipo_proyecto` | Requerimiento inicial de compra. |
| **SUGERENCIA_PROVEEDOR** | `id_sugerencia`, `datos_basicos` | Recomendación de proveedor nuevo. |
| **COTIZACION** | `id_cotizacion`, `monto_total`, `estado` | Oferta económica enviada. |
| **LINEA_COTIZACION** | `id_linea`, `cantidad`, `precio_unitario` | Detalle de productos/servicios ofertados. |

### D. Módulo EPI (Evaluación)
| Entidad | Atributos Clave | Descripción |
| :--- | :--- | :--- |
| **CRITERIO_EVALUACION** | `id_criterio`, `puntaje_maximo`, `ponderacion` | Configuración de preguntas y pesos. |
| **EVALUACION_PROVEEDOR** | `id_evaluacion`, `puntaje_total` | Registro de la auditoría realizada. |
| **RESULTADO_CRITERIO** | `id_resultado`, `puntaje_obtenido` | Calificación individual por pregunta. |
| **RETROALIMENTACION** | `id_retro`, `texto` | Feedback final al proveedor. |

---

## Tipos comunes de modelos de datos aplicados:
*   **Modelo conceptual:** Representación abstracta de las relaciones entre Proveedores, Solicitudes y Evaluaciones (Diagrama ER).
*   **Modelo lógico:** Especificación de las estructuras detalladas en las tablas anteriores (Claves foráneas, Tipos de datos).
*   **Modelo físico:** Implementación final en el sistema de base de datos (SQL).

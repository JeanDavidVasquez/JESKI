<p align="right">
  <img src="https://i.postimg.cc/13qQdqZs/utpllogo.png" alt="Logo UTPL" width="150"/>
</p>

# Diagrama de Casos de Uso para la Aplicación de Gestión de Proveedores – Indurama

# Diagrama de Casos de Uso

## ¿Qué es un diagrama de casos de uso?
Un **diagrama de casos de uso** es una representación visual utilizada en el **modelado de sistemas** para mostrar cómo interactúan los **actores** (usuarios, sistemas externos u otros componentes) con las **principales funciones** que ofrece un sistema.  
Este tipo de diagrama, basado en el estándar **UML (Lenguaje Unificado de Modelado)**, describe **qué realiza el sistema desde la perspectiva del usuario**, sin entrar en detalles sobre cómo se implementan dichas funciones.

---

## ¿Para qué sirve un diagrama de casos de uso?
El **diagrama de casos de uso** es una herramienta fundamental en el **análisis, diseño y documentación** de sistemas, ya que permite:

- **Definir los requisitos funcionales:** Identificar y detallar las funciones o servicios que el sistema debe ofrecer.  
- **Mejorar la comunicación:** Proporcionar un lenguaje común entre analistas, desarrolladores y usuarios para asegurar la comprensión de los requerimientos.  
- **Delimitar el alcance del sistema:** Establecer con claridad qué elementos forman parte del sistema y cuáles no.  
- **Reconocer a los actores principales:** Identificar quiénes interactúan con el sistema, ya sean personas o sistemas externos.  
- **Jerarquizar las funcionalidades:** Permitir la evaluación y priorización de las funciones según su relevancia o beneficio para los usuarios.

---

## Estructura de un diagrama de casos de uso
Un **diagrama de casos de uso** está compuesto por los siguientes **elementos principales**:

### Actores
Representan las **entidades externas** que se comunican con el sistema.  
Pueden ser **personas, organizaciones o sistemas externos**.  
Se representan con una **figura humana** o con una **etiqueta identificadora**.  

**Ejemplo:**  
- Usuario  
- Administrador  
- Sistema Externo  

---

### Casos de uso
Indican las **funciones o servicios específicos** que el sistema brinda a los actores.  
Se representan mediante **óvalos** que contienen el nombre de la acción.  

**Ejemplo:**  
- Registrar Usuario  
- Generar Reporte  
- Procesar Pago  

---

### Relaciones
- **Asociación:** Representa la conexión entre un actor y un caso de uso (línea continua).  
- **Inclusión (`<<include>>`):** Indica que un caso de uso reutiliza la funcionalidad de otro, evitando redundancia.  
- **Extensión (`<<extend>>`):** Muestra un caso de uso opcional que amplía otro principal bajo ciertas condiciones.  
- **Generalización:** Define relaciones jerárquicas entre actores o entre casos de uso.

---

### Sistema
Representa el **límite del sistema modelado**, ilustrado mediante un **rectángulo** que contiene los casos de uso.

---

## 1. Diagrama de Caso de Uso (Identificar Necesidad)

<img width="1000" height="782" alt="diagrama_caso_uso_identificar_necesidad" src="https://github.com/user-attachments/assets/98a05c10-d152-4098-8dfc-d95f282cdbe9" />

## Especificación (Identificar Necesidad)
<table>
  <tr>
    <th>Nombre</th>
    <th>Registro</th>
  </tr>
  <tr>
    <td>Actores</td>
    <td>
       - Usuario (Representa a Solicitante, Gestor)<br>
       - Indurama<br>
       - Proveedor
    </td>
  </tr>
  <tr>
    <td>Flujo normal</td>
    <td>
      - Usuario inicia el registro de una necesidad en el Sistema.<br>
      - Sistema carga el formulario de Identificar Empresa al Usuario.<br>
      - Usuario registra la empresa incluyendo Departamento y Solicitante consultados al Sistema.<br>
      - Indurama valida la empresa y carga el formulario para Describir Necesidad del Usuario.<br>
      - Usuario ingresa los detalles (incluyendo Definir Fechas y Definir Tipo de Proyecto) en el Sistema.<br>
      - Sistema guarda la descripción y carga la función de Búsqueda al Usuario.<br>
      - Usuario realiza una Búsqueda (Producto Terminado, Materia Prima, Maquinaria, Servicios) en el Sistema.<br>
      - Sistema consulta a los Proveedores y muestra los resultados al Usuario.<br>
      - Usuario selecciona un resultado y procede a Adjuntar Aspectos en el Sistema.<br>
      - Sistema carga las opciones para adjuntar (Pliego Técnico, Ficha Técnica, Oferta Comercial) para el Usuario.<br>
      - Usuario adjunta los documentos y finaliza el registro en el Sistema.<br>
      - Sistema notifica el registro de la necesidad al Usuario.
    </td>
  </tr>
</table>


## 2. Diagrama de Caso de Uso (Búsqueda de Proveedor)

<img width="1072" height="930" alt="diagrama_caso_uso_busqueda_proveedor" src="https://github.com/user-attachments/assets/84f6cd6d-7d85-4b01-9c36-a9bcdbbfed34" />

## Especificación (Búsqueda de Proveedor)
<table>
  <tr>
    <th>Nombre</th>
    <th>Registro</th>
  </tr>
  <tr>
    <td>Actores</td>
    <td>
       - Usuario (Representa a Gestor, Solicitante)<br>
       - Proveedor
    </td>
  </tr>
  <tr>
    <td>Flujo normal</td>
    <td>
      - Usuario ingresa al módulo "Búsqueda de Proveedor" en el Proveedor.<br>
      - Proveedor carga y muestra al Usuario las opciones principales: "Crear proveedor", "Sugerencia de solicitante" y "Banco de proveedores".
    </td>
  </tr>
  <tr>
    <td>Flujo A: Crear proveedor</td>
    <td>
      - Usuario selecciona la opción "Crear proveedor" en Proveedor.<br>
      - Proveedor carga el formulario de registro de nuevo proveedor al Usuario.<br>
      - Usuario ingresa la información solicitada (incluyendo Información fiscal y legal, Información de contactos, Información bancaria e Información tributaria) en el Proveedor.<br>
      - Usuario guarda el nuevo proveedor en el Proveedor.<br>
      - Proveedor valida los datos y notifica la correcta creación del proveedor al Usuario.
    </td>
  </tr>
  <tr>
    <td>Flujo B: Sugerencia de solicitante</td>
    <td>
      - Usuario selecciona la opción "Sugerencia de solicitante" en Proveedor.<br>
      - Proveedor carga el formulario de sugerencia al Usuario.<br>
      - Usuario ingresa la información básica del proveedor sugerido en el Proveedor.<br>
      - Proveedor valida los datos ingresados por el Usuario.<br>
      - Usuario guarda la sugerencia en el Proveedor.<br>
      - Proveedor notifica que la sugerencia ha sido registrada al Usuario.
    </td>
  </tr>
  <tr>
    <td>Flujo C: Banco de proveedores</td>
    <td>
      - Usuario selecciona la opción "Banco de proveedores" en el Proveedor.<br>
      - Proveedor carga la interfaz de búsqueda y filtrado al Usuario.<br>
      - Usuario realiza una búsqueda pudiendo filtrar por diferentes categorías en el Proveedor.<br>
      - Proveedor consulta la base de datos de Proveedores y muestra los resultados de la búsqueda al Usuario.<br>
      - Usuario selecciona un proveedor del listado para ver sus detalles.
    </td>
  </tr>
</table>


## 3. Diagrama de Caso de Uso (Cotización)

<img width="793" height="555" alt="digrama_caso_uso_cotizacion" src="https://github.com/user-attachments/assets/8c66fd92-dfce-4e80-bc9c-3c1517f6362c" />

## Especificación (Cotización)
<table>
  <tr>
    <th>Nombre</th>
    <th>Registro</th>
  </tr>
  <tr>
    <td>Actores</td>
    <td>
       - Gestor<br>
       - Proveedor
    </td>
  </tr>
  <tr>
    <td>Flujo normal</td>
    <td>
      - Gestor ingresa al módulo de "Cotización" en Proveedor.<br>
      - Proveedor carga y muestra las opciones principales: "Validar proveedor", "Recepción de Cotización" y "Seleccionar Cotización" al Gestor.
    </td>
  </tr>
  <tr>
    <td>Flujo A: Validar proveedor</td>
    <td>
      - Gestor selecciona la opción "Validar proveedor" en el Proveedor.<br>
      - Proveedor carga el formulario o interfaz de validación para el Gestor.<br>
      - El Gestor, para completar la validación, consulta y registra la siguiente información (obtenida del Proveedor) en el Proveedor:<br>
        &nbsp;&nbsp;• Registra la Experiencia del Proveedor.<br>
        &nbsp;&nbsp;• Registra las Referencias Comerciales del Proveedor.<br>
        &nbsp;&nbsp;• Registra los Costos propuestos por el Proveedor.<br>
        &nbsp;&nbsp;• Registra la Locación del Proveedor.<br>
      - Proveedor valida los datos y notifica el registro de datos al Gestor.<br>
      - Gestor finaliza la validación en el Proveedor.<br>
      - Proveedor guarda el estado de validación (Aprobado / Pendiente / Rechazado) del Proveedor y notifica al Gestor.
    </td>
  </tr>
  <tr>
    <td>Flujo B: Recepción de Cotización</td>
    <td>
      - Gestor selecciona la opción "Recepción de Cotización" en el Proveedor.<br>
      - Proveedor despliega la interfaz para administrar las cotizaciones al Gestor.<br>
      - Gestor utiliza la función "Recibir Cotización" para registrar las ofertas enviadas por los Proveedores en el Proveedor.<br>
      - Gestor, una vez recibidas varias cotizaciones, utiliza la función "Comparación de Cotización" en el Proveedor.<br>
      - Proveedor procesa los datos de las cotizaciones (enviadas por los Proveedores) y muestra un cuadro comparativo al Gestor.
    </td>
  </tr>
  <tr>
    <td>Flujo C: Seleccionar Cotización</td>
    <td>
      - Gestor selecciona la opción "Seleccionar Cotización" en el Proveedor.<br>
      - Proveedor carga la interfaz para adjudicar la cotización.<br>
      - El Gestor, basándose en la validación (Flujo A) y la comparación (Flujo B), elige la cotización ganadora en el Proveedor.<br>
      - Proveedor pide confirmación de la elección del Gestor.<br>
      - Gestor confirma y guarda la selección final en el Proveedor.<br>
      - Sistema notifica al Gestor la adjudicación de la cotización.
    </td>
  </tr>
</table>


## 4. Diagrama de Caso de Uso (EPI)

<img width="773" height="558" alt="diagrama_caso_uso_epi" src="https://github.com/user-attachments/assets/cd4d90e1-499c-463f-8b06-07aa50860d38" />

## Especificación (EPI)
<table>
  <tr>
    <th>Nombre</th>
    <th>Registro</th>
  </tr>
  <tr>
    <td>Actores</td>
    <td>
       - Gestor<br>
       - Proveedor<br>
       - EPI
    </td>
  </tr>
  <tr>
    <td>Flujo normal</td>
    <td>
      - Gestor inicia el proceso de "Evaluación de Proveedor (EPI)" en el Proveedor.<br>
      - Proveedor carga el módulo de EPI y muestra las opciones principales: "Identificar empresa", "Criterios de evaluación", "Notificación" y "Retroalimentación" al Gestor.
    </td>
  </tr>
  <tr>
    <td>Flujo A: Identificar empresa</td>
    <td>
      - Gestor selecciona la opción "Identificar empresa" en el Proveedor.<br>
      - Proveedor carga el formulario de identificación de la empresa al Gestor.<br>
      - Gestor registra la información, lo cual incluye obligatoriamente completar la sección de AMEF en el Proveedor.<br>
      - Proveedor ingresa los datos para el AMEF, quien los registra en el EPI.<br>
      - Gestor guarda la identificación de la empresa en el Sistema.<br>
      - Sistema valida y almacena la información.
    </td>
  </tr>
  <tr>
    <td>Flujo B: Criterios de evaluación</td>
    <td>
      - Gestor selecciona la opción "Criterios de evaluación" en el Sistema.<br>
      - Sistema carga el formulario detallado de evaluación.<br>
      - Gestor debe ingresar obligatoriamente los siguientes criterios, basados en la información proporcionada por el Proveedor:<br>
        &nbsp;&nbsp;• Datos generales (proporcionados por Proveedor).<br>
        &nbsp;&nbsp;• Criterios de Calidad (proporcionados por Proveedor).<br>
        &nbsp;&nbsp;• Criterios Comerciales (proporcionados por Proveedor).<br>
      - Gestor completa y guarda la evaluación del proveedor en el Sistema.<br>
      - Sistema procesa y almacena los resultados de la evaluación.
    </td>
  </tr>
  <tr>
    <td>Flujo C: Notificación</td>
    <td>
      - Gestor selecciona la opción "Notificación" en el Sistema.<br>
      - Sistema carga las diferentes modalidades de notificación para el Gestor.<br>
      - (Opcional - Extensión) Gestor selecciona "Correo electrónico" para enviar la evaluación o sus resultados.<br>
      - (Opcional - Extensión) Gestor selecciona "QR" para generar un código que enlace a la evaluación.<br>
      - (Opcional - Extensión) Gestor selecciona "Móvil" para enviar una alerta a la app del proveedor.<br>
      - Sistema ejecuta la notificación seleccionada por el Gestor.
    </td>
  </tr>
  <tr>
    <td>Flujo D: Retroalimentación</td>
    <td>
      - Gestor selecciona la opción "Retroalimentación" en el Sistema.<br>
      - Sistema carga un formulario de texto para la retroalimentación.<br>
      - Gestor redacta y registra los comentarios de retroalimentación para el Proveedor en el Sistema.<br>
      - Gestor guarda y envía la retroalimentación.<br>
      - Sistema almacena la retroalimentación y la hace disponible para las partes correspondientes.
    </td>
  </tr>
</table>

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

<img width="977" height="508" alt="diagrama_caso_uso_identificar_necesidad" src="https://github.com/user-attachments/assets/756adf80-4ea8-4706-811b-2ce33ce3d59e" />


## Especificación (Identificar Necesidad)
<table>
  <tr>
    <th>Nombre</th>
    <th>Registro</th>
  </tr>
  <tr>
    <td>Actores</td>
    <td>
       - Usuario (Solicitante, Gestor)<br>
       - Indurama<br>
       - Necesidad
    </td>
  </tr>
  <tr>
    <td>Flujo normal</td>
    <td>
      - Usuario consulta datos generales en Indurama.<br>
      - Indurama devuelve datos generales al Usuario.<br>
      - Usuario define fechas en Necesidad.<br>
      - Necesidad devuelve las fechas al Usuario.<br>
      - Usuario define tipo de proyecto en Necesidad.<br>
      - Necesidad devuelve el tipo de proyecto al Usuario.<br>
      - Usuario busca clase en Necesidad.<br>
      - Necesidad devuelve información de la clase al Usuario.<br>
      - Usuario adjunta aspectos técnicos en Necesidad.<br>
      - Necesidad devuelve la información de aspectos técnicos al Usuario.
    </td>
  </tr>
</table>



## 2. Diagrama de Caso de Uso (Búsqueda de Proveedor)

<img width="1059" height="906" alt="diagrama_caso_uso_busqueda_proveedor" src="https://github.com/user-attachments/assets/f350bc0a-9cd0-4f37-885c-427fa980924f" />


## Especificación (Búsqueda de Proveedor)
<table>
  <tr>
    <th>Nombre</th>
    <th>Registro</th>
  </tr>
  <tr>
    <td>Actores</td>
    <td>
       - Usuario (Solicitante, Gestor)<br>
       - Proveedor<br>
       - Necesidad
    </td>
  </tr>
  <tr>
    <td>Flujo normal</td>
    <td>
      - Usuario envía una sugerencia de proveedor (ya sea de Procesos, I+D o Mantenimiento) a Necesidad.<br>
      - Necesidad recibe la sugerencia y devuelve una confirmación al Usuario.<br>
      - Usuario realiza una consulta (ya sea de Materia Prima, Producto Terminado, Repuestos, Maquinaria, Servicios, Ingeniería Técnica o CAPEX) a Proveedor.<br>
      - Proveedor devuelve la información correspondiente (ya sea de Materia Prima, Producto Terminado, Repuestos, Maquinaria, Servicios, Ingeniería Técnica o CAPEX) al Usuario.<br>
      - Gestor ingresa datos generales para la creación de un nuevo Proveedor.<br>
      - Proveedor valida la creación realizada por el Gestor.<br>
      - Gestor ingresa la Información Fiscal y Legal, Información de Contactos, Información Bancaria e Información Tributaria al Proveedor.<br>
      - Proveedor valida la información ingresada por el Gestor.
    </td>
  </tr>
</table>



## 3. Diagrama de Caso de Uso (Cotización)

<img width="765" height="542" alt="diagrama_caso_uso_cotizacion" src="https://github.com/user-attachments/assets/62eb4b97-817f-4422-9581-f44721c7b0dc" />


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
      - Gestor consulta "Experiencia" a Proveedor.<br>
      - Proveedor devuelve datos de "Experiencia" al Gestor.<br>
      - Gestor consulta "Referencias Comerciales" a Proveedor.<br>
      - Proveedor devuelve "Referencias Comerciales" al Gestor.<br>
      - Gestor consulta "Costos" a Proveedor.<br>
      - Proveedor devuelve datos de "Costos" al Gestor.<br>
      - Gestor consulta "Localización" a Proveedor.<br>
      - Proveedor devuelve datos de "Localización" al Gestor.<br>
      - Gestor solicita "Recibir Cotización" a Proveedor.<br>
      - Proveedor devuelve la "Cotización" al Gestor.<br>
      - Gestor solicita "Comparación de Cotización" a Proveedor.<br>
      - Proveedor devuelve datos para la "Comparación de Cotización" al Gestor.<br>
      - Gestor envía la "Seleccionar Cotización" (la decisión) a Proveedor.<br>
      - Proveedor devuelve una confirmación de la selección al Gestor.
    </td>
  </tr>
</table>



## 4. Diagrama de Caso de Uso (EPI)

<img width="763" height="533" alt="diagrama_caso_uso_epi" src="https://github.com/user-attachments/assets/bb15b017-11d3-42f5-b0c4-21726a06bad5" />


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
       - Proveedor
    </td>
  </tr>
  <tr>
    <td>Flujo normal</td>
    <td>
      - Gestor consulta "AMEF" (de Identificar Empresa) a Proveedor.<br>
      - Proveedor devuelve datos de "AMEF" al Gestor.<br>
      - Gestor consulta "Datos Generales" (de Criterios de Evaluación) a Proveedor.<br>
      - Proveedor devuelve "Datos Generales" al Gestor.<br>
      - Gestor consulta "Calidad" (de Criterios de Evaluación) a Proveedor.<br>
      - Proveedor devuelve datos de "Calidad" al Gestor.<br>
      - Gestor consulta "Comercial" (de Criterios de Evaluación) a Proveedor.<br>
      - Proveedor devuelve datos de "Comercial" al Gestor.<br>
      - Gestor envía "Retroalimentación" a Proveedor.<br>
      - Proveedor recibe la retroalimentación y devuelve una confirmación al Gestor.
    </td>
  </tr>
</table>

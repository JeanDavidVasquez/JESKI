## Diagrama de Clases

### "Plataforma Unificada de Gestión de Proveedores"

#### ¿Qué es un Diagrama de Clases?

Un *diagrama de clases* es un tipo de diagrama estático, clave en la Programación Orientada a Objetos (POO), que modela la estructura lógica de un sistema, como nuestra solución para Indurama. Muestra de forma gráfica:

* **Clases:** Representan las entidades o conceptos clave del sistema (ej. Proveedor, Usuario, Cotización).
* **Atributos:** Definen las características o propiedades de cada clase (ej. nombreProveedor, estadoCotizacion).
* **Métodos:** Especifican los comportamientos o acciones que la clase puede realizar (ej. calcularSubtotal()).
* **Relaciones:** Muestran cómo interactúan las diferentes clases entre sí (asociaciones, composiciones o herencias).

Es una herramienta esencial en la fase de diseño de software para definir la arquitectura y la interacción de sus componentes.

#### Estructura General del Diagrama

Nuestro diagrama de clases sigue la notación estándar UML, destacando:

* **Clases:** Representadas como rectángulos divididos en tres secciones: Nombre de la clase, Atributos y Métodos.
* **Relaciones entre Clases:**
    * *Asociaciones:* Conexiones directas que indican qué clases interactúan (ej. Usuario se asocia con Clasificador).
    * *Composición/Agregación:* Muestran estructuras de 'todo-parte' (ej. Una OrdenEvaluacion está compuesta por CriteriosEvaluacion).
* **Visibilidad de Atributos y Métodos:** Se utiliza la notación estándar:
    * `+` *Público:* Accesible desde cualquier lugar.
    * `-` *Privado:* Accesible solo dentro de la clase.
* **Cardinalidad:** Define la cantidad de objetos relacionados (ej. $1:N$, $N:M$).

---

### Descripción del Modelo Arquitectónico

El diagrama modela la arquitectura lógica de la plataforma, estructurada en cuatro ejes funcionales principales para gestionar el ciclo de vida de las compras y la homologación:

1.  **Gestión de Usuarios y Roles (Herencia):**
    * Se implementa una jerarquía mediante la clase padre **`Usuario`**, de la cual heredan los roles especializados: **`Gestor`** (encargado de la administración, aprobación de proveedores y configuración de criterios) y **`Solicitante`** (encargado de generar necesidades desde un área o departamento).

2.  **Administración de Proveedores:**
    * La clase central **`Proveedor`** encapsula toda la información fiscal, legal y operativa.
    * Se asocia con entidades de soporte como **`ContactoProveedor`** (para la gestión de accesos) y su portafolio de oferta mediante las clases **`Producto`** y **`Servicio`**.

3.  **Ciclo de Compras y Cotizaciones:**
    * El flujo inicia cuando un Solicitante genera una **`Necesidad`**, la cual detalla los requerimientos y adjunta documentos técnicos (pliegos o fichas).
    * Los proveedores responden a estas necesidades mediante la entidad **`Cotizacion`**, permitiendo la comparación de ofertas y la selección basada en montos y estados.

4.  **Sistema de Evaluación y Calidad:**
    * El diagrama destaca un módulo robusto de calificación mediante la clase **`EvaluacionProveedor`** (EPI).
    * Este módulo permite valorar el desempeño utilizando **`CriterioEvaluacion`** configurables (con puntajes y ponderaciones) y generar **`ResultadoCriterio`** específicos.
    * Finalmente, el proceso se cierra con una **`Retroalimentacion`**, permitiendo al Gestor enviar comentarios y decisiones basadas en los resultados obtenidos.

---

### Foto del Diagrama de Clases

<img width="100%" alt="Diagrama de Clases - Plataforma Proveedores" src="https://github.com/user-attachments/assets/aa80fd26-53c3-44d3-b112-43118d78152a" />

### Diccionario de Clases
Para ver el detalle completo de cada atributo y método, consulta el siguiente documento:
[**📄 Ver Diccionario de Clases en Google Sheets**](https://docs.google.com/spreadsheets/d/1T2Y_uCvz0BG-SExoEJAmILGt5xq603W5j9QSF35ILrA/edit?usp=sharing)

## Diagrama de Clases

### "Plataforma Unificada de Gestión de Proveedores"

#### ¿Qué es un Diagrama de Clases?

Un *diagrama de clases* es un tipo de diagrama estático, clave en la Programación Orientada a Objetos (POO), que modela la estructura lógica de un sistema, como nuestra solución para Indurama. Muestra de forma gráfica:

* *Clases:* Representan las entidades o conceptos clave del sistema (ej. Proveedor, Usuario, Cotización).
* *Atributos:* Definen las características o propiedades de cada clase (ej. nombreProveedor, estadoCotizacion).
* *Métodos:* Especifican los comportamientos o acciones que la clase puede realizar (ej. calcularSubtotal()).
* *Relaciones:* Muestran cómo interactúan las diferentes clases entre sí (asociaciones, composiciones o herencias).

Es una herramienta esencial en la fase de diseño de software para definir la arquitectura y la interacción de sus componentes.

#### Estructura General del Diagrama

Nuestro diagrama de clases sigue la notación estándar UML, destacando:

* *Clases:* Representadas como rectángulos divididos en tres secciones: Nombre de la clase, Atributos y Métodos.
* *Relaciones entre Clases:*
    * *Asociaciones:* Conexiones directas que indican qué clases interactúan (ej. Usuario se asocia con Clasificador).
    * *Composición/Agregación:* Muestran estructuras de 'todo-parte' (ej. Una OrdenEvaluacion está compuesta por CriteriosEvaluacion).
* *Visibilidad de Atributos y Métodos:* Se utiliza la notación estándar:
    * + *Público:* Accesible desde cualquier lugar.
    * - *Privado:* Accesible solo dentro de la clase.
* *Cardinalidad:* Define la cantidad de objetos relacionados (ej. $1:N$, $N:M$).

---

### Diccionario de Clases
[**Enlace para el diccionario de clases**](https://docs.google.com/spreadsheets/d/1T2Y_uCvz0BG-SExoEJAmILGt5xq603W5j9QSF35ILrA/edit?usp=sharing)

### Foto del Diagrama de Clases

<img width="2692" height="2460" alt="Diagrama en blanco" src="https://github.com/user-attachments/assets/5e591fab-5bb3-47f8-9959-9ff92d6f635f" />


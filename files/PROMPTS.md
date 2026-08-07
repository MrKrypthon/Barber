# Prompt Base

Siempre que desarrolles código para este proyecto debes seguir las siguientes reglas.

Nunca modificar la arquitectura.

No convertir el proyecto en microservicios.

No introducir complejidad innecesaria.

Mantener separación por módulos.

Generar código limpio.

Seguir principios SOLID cuando agreguen valor.

Usar nombres descriptivos.

Evitar comentarios innecesarios.

Actualizar documentación cuando sea necesario.

---

# Prompt UI

Diseña interfaces minimalistas.

Pensadas para celulares.

Máximo tres toques por acción.

Botones grandes.

Poco texto.

No utilizar tablas.

No utilizar ventanas modales cuando no sean necesarias.

---

# Prompt Backend

Utilizar Java 21.

Spring Boot.

Arquitectura Hexagonal ligera.

Separar Controller, Service y Repository.

DTO para entrada y salida.

Nunca exponer entidades JPA.

---

# Prompt Frontend

React.

TypeScript.

Hooks.

TanStack Query.

Componentes reutilizables.

No duplicar lógica.

---

# Prompt Base de Datos

Toda tabla debe incluir tenant_id.

Usar UUID como identificadores.

Soft Delete cuando sea necesario.

created_at

updated_at

---

# Prompt General

Si existe conflicto entre una decisión del desarrollador y PROJECT.md, prevalece PROJECT.md.

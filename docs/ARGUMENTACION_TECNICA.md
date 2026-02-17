# Argumentacion Tecnica

## Opcion elegida

La opcion elegida para la entrega de PonchEO es:

- Frontend desplegado en **Vercel** (React + Vite).
- Backend desplegado en **Vercel** (Express en runtime serverless).
- Base de datos en **Supabase Postgres** (managed PostgreSQL).

Esta combinacion busca balancear velocidad de entrega, costo bajo para demo academica, y facilidad de operacion por un equipo pequeno. El objetivo no es optimizar para miles de usuarios, sino para un contexto de empresa pequena (10-60 empleados) con una necesidad fuerte de trazabilidad, reglas claras y demo reproducible.

## 3 razones por las que esta opcion es mejor para este contexto

### 1) Menor friccion operativa para un equipo pequeno y corto tiempo

Vercel permite despliegues rapidos conectando el repositorio, sin tener que administrar manualmente una VM o contenedor dedicado desde cero. Para una entrega academica, esto reduce el riesgo de perder tiempo en tareas de infraestructura que no agregan valor directo a la funcionalidad principal (ponches, correcciones, nomina).

Supabase, por su lado, elimina la carga de administrar PostgreSQL manualmente (backups, upgrades, alta disponibilidad basica). Ademas expone un `DATABASE_URL` compatible con Prisma, por lo que el cambio desde entorno local es directo y no obliga a redisenar el acceso a datos.

Beneficio concreto en este proyecto:

- El equipo puede enfocarse en reglas de negocio (horas extra, nocturnidad, feriados, auditoria).
- Se mantiene una ruta de despliegue repetible para demo y evaluacion.
- Se minimiza el tiempo de “puesta en ambiente”.

### 2) Ajuste natural con la arquitectura actual del repositorio

El frontend ya esta construido con Vite y el backend con Express/TypeScript. Vercel soporta ambos modelos de despliegue con cambios minimos. En vez de reescribir toda la app para otro stack, se mantiene la arquitectura actual y solo se adapta la capa de ejecucion.

En este repositorio ya se incorporo soporte para ese flujo:

- Backend con entrada serverless (`packages/backend/src/vercel.ts` + `packages/backend/vercel.json`).
- Endpoint de job seguro (`POST /api/jobs/auto-close`) para ejecutarse por cron.
- Frontend configurable con `VITE_API_BASE_URL` para apuntar al backend desplegado.

Eso permite separar deployment de frontend y backend en dos proyectos Vercel (mismo repo, distinto root), que es una estrategia simple y clara para equipo de bootcamp.

### 3) Costo y mantenibilidad adecuados para demo y primera version productiva pequena

Tanto Vercel como Supabase tienen planes gratuitos o de bajo costo para PoC/demo, que es exactamente el caso de uso de esta entrega. La plataforma no tiene requerimientos de throughput alto ni procesamiento batch pesado continuo.

Con Supabase Postgres se conserva un motor SQL robusto para:

- integridad referencial,
- transacciones para aprobaciones/correcciones,
- precision decimal para nomina,
- consultas auditables.

Con Vercel se obtiene:

- despliegue por commit,
- rollback rapido,
- ambiente publico no localhost (requisito de aceptacion),
- variables por entorno.

Resultado: buena relacion simplicidad/valor sin agregar componentes innecesarios.

## 2 sacrificios para implementar esta opcion

### Sacrificio 1: limitaciones de procesos persistentes en serverless

El backend en Vercel no es un proceso Node persistente como en una VM clasica. Eso afecta jobs tipo `node-cron` ejecutados en memoria, porque la funcion serverless no siempre esta viva. Por eso se necesita cambiar de modelo:

- en lugar de cron local permanente,
- usar scheduler externo o Vercel Cron que invoque un endpoint seguro.

Este ajuste ya implica una decision de arquitectura: desacoplar el job de autocierre del proceso principal y protegerlo con secreto (`CRON_SECRET`).

### Sacrificio 2: mayor cuidado en configuracion multi-proyecto (frontend/backend)

Al usar dos proyectos en Vercel (uno por `packages/frontend` y otro por `packages/backend`), hay mas variables cruzadas:

- configurar `CORS_ORIGIN` correctamente,
- definir `VITE_API_BASE_URL`,
- asegurar migraciones Prisma hacia Supabase,
- sincronizar secretos entre ambientes.

No es complejo, pero requiere disciplina de DevOps basica para evitar fallos de “funciona local, falla en cloud”.

## Que haria distinto si tuviera mas tiempo

### 1) Consolidar observabilidad y trazas de negocio

Agregaria logging estructurado con correlacion por request (request-id), y dashboards minimos de errores/latencias (por ejemplo con OpenTelemetry + proveedor de logs). Para una app de asistencia y nomina, detectar incidentes de integridad rapidamente es clave.

### 2) Fortalecer pruebas de regresion de reglas laborales

El motor de nomina y los bordes de tiempo (turnos nocturnos, cruce de medianoche, feriado + descanso, correcciones retroactivas) merecen una bateria de pruebas mas amplia. Implementaria:

- tests unitarios parametrizados de reglas DR,
- tests de integracion de flujos completos (clock-in -> correction -> payroll),
- validacion automatica en CI para bloquear merges con regresiones.

### 3) Endurecer auditoria para compliance

La auditoria actual registra mutaciones, pero con mas tiempo la elevaria a nivel “forense”:

- snapshot consistente de valores previos y nuevos por entidad,
- idempotencia en eventos sensibles,
- endpoint de exportacion para inspeccion externa,
- politicas de retencion y particion por fecha.

### 4) Mejorar UX operacional para supervisor

Implementaria pantallas faltantes para cerrar ciclo completo sin depender de Swagger/Postman:

- creacion de correcciones desde empleado,
- CRUD completo de asignaciones de turno en calendario,
- filtros avanzados de auditoria y nomina por departamento,
- accion de revertir nomina desde UI.

### 5) Pipeline de despliegue y migracion totalmente automatizado

Con mas tiempo dejaria CI/CD completo:

- checks de build/lint/test en pull request,
- migraciones controladas por ambiente,
- smoke tests post-deploy,
- politica de rollback automatizada.

## Conclusion

Para esta entrega, **Vercel + Supabase** es una opcion tecnicamente defendible y pragmatica. Maximiza velocidad de salida, cumple el requisito de ambiente desplegado (no localhost) y respeta la arquitectura existente con cambios moderados.

Los principales sacrificios (cron persistente y configuracion multi-proyecto) son manejables en el contexto del curso y del alcance actual. Ademas dejan una ruta clara para evolucionar la plataforma: primero estabilidad funcional y cumplimiento de reglas, luego madurez operativa (observabilidad, pruebas profundas y automatizacion completa).

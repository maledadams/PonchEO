# Argumentacion Tecnica (Proyecto Completo)

## Opcion elegida

La opcion elegida para PonchEO no fue solamente una decision de despliegue. Fue una decision integral de producto y arquitectura:

- Monorepo con **npm workspaces** para coordinar frontend y backend.
- Backend **Node.js + Express + TypeScript + Prisma + PostgreSQL**.
- Frontend **React + Vite + Tailwind + daisyUI**.
- Seguridad con **JWT + RBAC** (EMPLOYEE y SUPERVISOR).
- Reglas laborales implementadas en servicios de negocio (ponches, correcciones, nomina, auditoria).
- Entrega desplegable en **Vercel + Supabase** para cumplir el requisito de ambiente publico no localhost.

Esta opcion se eligio porque el problema principal del proyecto no es una interfaz bonita ni la escala extrema: es la **consistencia de reglas de negocio** (turnos, horas, tardanzas, correcciones, auditoria y nomina) con un equipo pequeno y tiempo limitado.

En otras palabras, se priorizo una arquitectura que permitiera:

- modelar bien el dominio,
- entregar rapido,
- y defender tecnicamente cada decision.

## 3 razones por las que esta opcion es mejor para este contexto

### 1) Prioriza correctamente la complejidad real del dominio

El dominio de control de asistencia parece simple al inicio, pero tiene complejidad real:

- turnos que cruzan medianoche,
- ponches abiertos por olvido,
- correcciones con aprobacion,
- reglas de pago por horas extra, nocturnidad y feriados,
- trazabilidad de cambios para auditoria.

Por eso se eligio un backend tipado con capas claras:

- rutas/controladores para transporte HTTP,
- servicios para reglas de negocio,
- Prisma para persistencia tipada.

Esto evita mezclar reglas en el frontend o en SQL disperso y reduce errores de negocio.
Tambien permite modificar reglas en un punto central, por ejemplo en `payroll.service.ts`, `punch.service.ts` y `correction.service.ts`.

Beneficio directo: el sistema es mas defendible en una evaluacion academica porque las reglas criticas estan explicitas y testeables, no escondidas en la UI.

### 2) Balancea velocidad de desarrollo con calidad suficiente de entrega

Con un equipo pequeno y tres sprints, usar Express + Prisma + React/Vite permite iterar rapido sin perder estructura.

Decisiones concretas que apoyan esa velocidad:

- Monorepo: un solo repo, scripts unificados, menos friccion de coordinacion.
- Prisma: esquema unico de datos, migraciones y tipado generado.
- Zod/validaciones: errores consistentes para consumo de frontend y Postman.
- Swagger + Postman collection: facil probar endpoints y hacer demo.

Ademas, se incorporaron controles de calidad que mejoran la estabilidad:

- `build`, `lint` y `test` funcionando,
- manejo de errores estandarizado con `AppError`,
- formato uniforme de respuestas `{ success, data/error }`.

No es una plataforma enterprise completa, pero si un nivel correcto para un proyecto academico funcional y demostrable.

### 3) Mantiene una ruta clara de operacion real (de local a cloud)

El proyecto puede correrse localmente con Docker/Postgres y tambien desplegarse en cloud con Vercel + Supabase.

Esto es importante porque cumple dos objetivos:

- desarrollo rapido en local,
- entrega evaluable en ambiente publico.

La arquitectura no cambia entre ambos entornos, solo variables:

- `DATABASE_URL`,
- `CORS_ORIGIN`,
- `JWT_SECRET`,
- `VITE_API_BASE_URL`,
- `CRON_SECRET`.

Tambien se resolvio el caso operativo del autocierre de ponches para serverless con endpoint de job protegido (`/api/jobs/auto-close`) en lugar de depender solo de procesos persistentes.

Resultado: se evita el clasico problema de "funciona local pero no en produccion" y se deja una base que puede evolucionar sin reescribir todo.

## 2 sacrificios para poder implementarla

### Sacrificio 1: menor profundidad en pruebas de integracion end-to-end

Se implementaron pruebas unitarias utiles, pero no se completo una suite amplia de integracion para todos los flujos complejos (por ejemplo escenarios largos de nomina con muchas combinaciones).

Que significa este sacrificio:

- menor garantia automatica en casos borde,
- mas dependencia de pruebas manuales y validacion por Postman/Swagger para la demo.

Fue una decision consciente para priorizar funcionalidad critica y entrega deployable en el tiempo disponible.

### Sacrificio 2: simplicidad operativa por encima de sofisticacion de infraestructura

Se eligio una arquitectura pragmaticamente simple:

- dos proyectos Vercel (frontend y backend),
- Supabase como Postgres administrado,
- cron via endpoint protegido.

No se implementaron componentes de mayor complejidad como:

- colas de trabajo dedicadas,
- observabilidad avanzada completa,
- pipeline CI/CD con gates estrictos por ambiente.

Esto reduce robustez operativa en escenarios mas exigentes, pero mantiene el foco en el objetivo del curso: resolver bien el problema funcional principal con una entrega defendible.

## Que haria distinto si tuviera mas tiempo

### 1) Endureceria reglas de negocio con mas pruebas automatizadas

Ampliaria cobertura en:

- payroll por escenarios parametrizados (44h, 50h, 70h, nocturno, feriado, descanso),
- correcciones encadenadas,
- casos de timezone y cruce de medianoche.

Tambien agregaria pruebas de integracion de flujos completos:

- login -> clock-in -> clock-out -> correction -> approve -> payroll.

### 2) Mejoraria la auditoria para trazabilidad de nivel forense

La auditoria actual registra mutaciones, pero la llevaria a un nivel mas estricto:

- old/new values garantizados por entidad mutada,
- trazas de correlacion por request-id,
- exportacion filtrada para revision externa.

Esto seria especialmente util para incidentes de nomina o disputas de asistencia.

### 3) Completaria UX operativa para cerrar todo el ciclo sin depender de herramientas externas

Aunque ya hay UI funcional, faltaria completar algunas operaciones de supervisor/empleado en pantallas mas avanzadas:

- manejo de asignaciones de turnos en vista calendario completa,
- filtros mas fuertes en auditoria,
- reportes por departamento y periodo con exportacion.

La idea seria que Postman quede para QA y no para operacion diaria.

### 4) Formalizaria un pipeline de entrega continua

Implementaria CI/CD con:

- checks obligatorios en pull request,
- despliegues por ambiente,
- smoke tests post-deploy,
- estrategia de rollback.

Esto reduce riesgo operacional y mejora la mantenibilidad a mediano plazo.

## Conclusiones

La decision tecnica del proyecto completo fue coherente con el contexto:

- problema de negocio con reglas laborales no triviales,
- equipo pequeno,
- plazo limitado,
- requisito de ambiente publico para evaluacion.

La arquitectura elegida equilibra bien:

- velocidad de desarrollo,
- claridad del dominio,
- y capacidad de defensa tecnica.

No es una solucion perfecta ni final de largo plazo, pero si una base correcta, funcional y escalable para una siguiente fase de madurez.

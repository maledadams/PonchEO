# Reglas de Negocio

## Roles

- `EMPLOYEE`: puede fichar entrada/salida, ver sus propios ponches y solicitar correcciones de sus propios ponches.
- `SUPERVISOR`: puede gestionar catalogos (empleados, turnos, feriados, reglas), aprobar/rechazar correcciones y generar/finalizar nomina.

## Ponches

1. Un empleado no puede hacer `clock-in` si ya tiene un ponche `OPEN`.
2. Para `clock-in` debe existir `ShiftAssignment` del dia.
3. `clock-out` solo aplica al ponche abierto del mismo empleado.
4. Si el empleado no hace `clock-out`, el sistema puede autocerrar despues de `AUTO_CLOSE_THRESHOLD_HOURS`.
5. Todo `clock-out` recalcula `DailyTimesheet`.

## Correcciones

1. Solo el empleado duenio del ponche puede solicitar correccion.
2. Una correccion por ponche (`punchId` unico).
3. Solo un supervisor puede aprobar o rechazar.
4. Al aprobar:
   - se actualiza el `Punch` a `CORRECTED`
   - se calcula `workedMinutes`
   - se recalcula `DailyTimesheet`

## Nomina

1. Se genera desde `DailyTimesheet` por rango de fechas.
2. Reglas de pago:
   - Regular: hasta 44h
   - Extra: 44h-68h (1.35x)
   - Excesiva: >68h (2.00x)
   - Nocturna: premium 15%
   - Feriado y descanso: premium 100% adicional (2.00x total)
3. Estados:
   - `DRAFT`
   - `FINALIZED`

## Auditoria

1. Mutaciones (`POST/PUT/PATCH/DELETE`) generan registro en `AuditLog`.
2. Se guarda:
   - usuario
   - accion
   - entidad
   - id entidad (si se puede inferir)
   - payload nuevo
   - IP

## Feriados

1. Soporte de feriados por fecha.
2. `Corpus Christi` se calcula por fecha movil (Pascua + 60 dias) al sembrar por anio.

## Seguridad API

1. Todas las rutas de negocio requieren JWT.
2. Endpoints sensibles usan `requireRole`.
3. El backend aplica scoping de datos para evitar lectura entre empleados.

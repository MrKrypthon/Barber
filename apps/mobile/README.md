# apps/mobile (reservado)

Esta carpeta está reservada para la futura aplicación **React Native + Expo**, descrita en `docs/TECHNOLOGIES.md` §5.

## Estado

No implementada. Su construcción queda diferida hasta después de validar el MVP web, según:

- **ADR-007** (`docs/DECISIONS.md`): el MVP es web-only (Next.js con capacidades PWA).
- `docs/ROADMAP.md`: "Aplicaciones móviles" está listado en v1.0, no en v0.1.

No se instalan dependencias de Expo/React Native todavía, para no añadir dependencias sin una necesidad activa (`CLAUDE.md` §25).

## Por qué existe esta carpeta ya

El monorepo reserva la ruta `apps/mobile/` desde el inicio para que, cuando se decida construir la app nativa, no haga falta reestructurar `pnpm-workspace.yaml` ni las rutas de los paquetes compartidos (`packages/types`, `packages/validation`, `packages/api-client`) que ya están pensados para ser reutilizados por Web y Mobile.

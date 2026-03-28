## Plan de Fusión Super-Son1k-2.2

### Objetivo
Unificar las capacidades avanzadas del repositorio actual (cola BullMQ, hooks/servicios compartidos, Pixel AI, Stripe, documentación extendida) con los componentes funcionales del repositorio `Super-Son1k-2.1` (prisma v6, rutas públicas, scripts y guías específicas) para entregar un único código base estable denominado **Super-Son1k-2.2**.

### Fuente de Verdad
- **Repositorio base:** rama `feature/super-son1k-2.2-merge` del repo actual.
- **Repositorio de referencia:** `/workspace/tmp/Super-Son1k-2.1`.

### Diferencias relevantes detectadas

#### Backend
- `Super-Son1k-2.1` expone `packages/backend/src/routes/generation-public.ts` con generación sin autenticación (requiere mantener soporte y adaptar a la cola).
- Esquema Prisma:
  - En `Super-Son1k-2.1` `Generation.userId` es opcional para permitir generaciones públicas; en el repo actual es obligatorio.
  - `stripeCustomerId` tiene restricción `@unique` en la versión 2.1; se perdió en el repo actual.
  - `Super-Son1k-2.1` usa Prisma 6.19 (`package.json` backend y root); el repo actual está en ^5.0.0.
- `packages/backend/src/routes/generation.ts` del repo actual incorpora cola BullMQ y validación avanzada (mantener como base, asegurando compatibilidad con prisma y rutas públicas).

#### Frontend / Apps
- El repo actual añade Pixel Chat, Stripe Checkout, hooks de progreso, etc. (mantener).
- Revisar que las APIs `/api/generate-music` no dependan de URLs hardcodeadas (el repo actual usa fallback Vercel).
- Confirmar que apps de `Super-Son1k-2.1` sin equivalente (si las hubiera) se copien.

#### Paquetes compartidos
- El repo actual añade `packages/shared-hooks`, `shared-services`, `shared-ui` ampliado y pruebas (`__tests__`). Mantener tal cual.
- Verificar si `Super-Son1k-2.1` posee utilidades específicas (ninguna adicional detectada hasta ahora).

#### Documentación / Scripts
- El repo actual incluye gran cantidad de guías recientes; `Super-Son1k-2.1` contiene otros checklists (ej. `BETA_DEPLOY_CHECKLIST.md`, scripts CLI). Identificar duplicados útiles y moverlos a `docs/legacy/` o combinar.

### Pasos propuestos
1. **Prisma/DB**
   - Decidir versión final (recomendado: mantener Prisma 6.19 para compatibilidad y actualizar dependencias).
   - Actualizar `schema.prisma` para permitir `userId` opcional + reinstaurar índice único de Stripe.
   - Re-generar migraciones si es necesario.

2. **Backend**
   - Integrar `generation-public` como nueva ruta que use la cola BullMQ (crear adaptador).
   - Revisar `SunoService`, `tokenManager` y workers para asegurar que soportan `userId` null (modo público).

3. **Frontend**
   - Eliminar fallback remoto de `generate-music` y sustituir por variables env seguras.
   - Confirmar compatibilidad con nuevos endpoints (ajustar polling/progreso si se usa `generationId`).

4. **Infraestructura**
   - Revisar dependencias raíz (`package.json`): actualizar versión a `2.2.0`, asegurarse de que `@prisma/client` coincide con Prisma CLI.
   - Mantener `pnpm` y Turbo; regenerar lockfile si hay cambios mayores.

5. **Documentación**
   - Actualizar `README.md`, `STATUS.md` y guías de despliegue a la versión 2.2.
   - Centralizar checklists en `docs/`.

6. **Validación**
   - Ejecutar `pnpm install`, `pnpm lint`, `pnpm build`, `pnpm test`.
   - Probar generación completa: crear job, verificar cola, websocket y ruta pública.
   - Documentar cualquier limitación pendiente.

### Riesgos / Atención
- Cambio de versión Prisma implica migraciones; validar en entorno local antes de despliegue.
- Ruta pública + cola requiere manejo de `userId` null y cuotas (definir reglas).
- Eliminar fallback remoto puede requerir desplegar backend junto a frontend; asegurar variables env en Vercel/Railway.


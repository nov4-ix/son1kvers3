      # 🚀 GUÍA DE SETUP RÁPIDO - Sub-Son1k-2.3

## ⚡ Setup en 5 Pasos (15 minutos)

### **PASO 1: Variables de Entorno (5 min)**

#### 1.1 Configuración Principal
```bash
# Copia el template de configuración
copy ENV_CONFIG_TEMPLATE.md .env
# En Linux/Mac: cp ENV_CONFIG_TEMPLATE.md .env
```

#### 1.2 Edita `.env` y configura:

**CRÍTICO - Base de Datos:**
```env
DATABASE_URL="postgresql://USER:PASS@HOST:5432/DB_NAME"
```

Opciones:
- **Supabase** (RECOMENDADO): https://supabase.com → Gratis, crea proyecto, copia connection string
- **Railway**: https://railway.app → PostgreSQL addon → Copia URL
- **Local**: Instala PostgreSQL localmente

**CRÍTICO - Tokens de Suno:**
```env
SUNO_COOKIES="__session=sess_XXXXXX; cf_clearance=YYYYYY"
```

Cómo obtener:
1. Abre https://app.suno.ai
2. Inicia sesión
3. F12 → Application → Cookies
4. Copia `__session` y `cf_clearance`
5. Pega en formato: `__session=XXX; cf_clearance=YYY`

#### 1.3 Configuración del Frontend
Crea `apps/the-generator-nextjs/.env.local`:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key_supabase
```

---

### **PASO 2: Inicializar Base de Datos (2 min)**

```bash
cd packages/backend

# Generar cliente de Prisma
pnpm prisma generate

# Crear tablas en la base de datos
pnpm prisma db push

# (Opcional) Abrir Prisma Studio para ver la DB
pnpm prisma studio
```

---

### **PASO 3: Verificar Instalación (1 min)**

```bash
# Volver a raíz
cd ../..

# Verificar que todo está instalado
pnpm list --depth=0
```

Si hay errores, ejecuta:
```bash
pnpm install
```

---

### **PASO 4: Iniciar Backend (2 min)**

```bash
# Opción A: Solo backend
cd packages/backend
pnpm dev

# Opción B: Todo el proyecto
pnpm dev
```

Deberías ver:
```
✅ Token pool initialized with X valid tokens
🚀 Backend running on http://localhost:3001
```

---

### **PASO 5: Iniciar Frontend (1 min)**

En una **nueva terminal**:

```bash
cd apps/the-generator-nextjs
pnpm dev
```

Abre: http://localhost:3002

---

## 🎵 PROBANDO GENERACIÓN MUSICAL

1. **Abre** http://localhost:3002
2. **Escribe** ideas para una canción en "Letra"
3. **Click** en "GENERAR LETRA"
4. **Describe** el estilo musical (ej: "Cyberpunk Dark Synthwave")
5. **Click** en "MEJORAR PROMPT"
6. **Selecciona** voz (Hombre/Mujer/Random/Dueto)
7. **Click** en "THE GENERATOR"  
8. **Espera** 60-120 segundos
9. **Escucha** tu música generada! 🎉

---

## 🔧 TROUBLESHOOTING

### Error: "No valid tokens available"
✅ **Solución:** Verifica que `SUNO_COOKIES` en `.env` tenga un token válido de Suno.

### Error: "Database connection failed"
✅ **Solución:** Verifica que `DATABASE_URL` esté correcta y que la base de datos esté activa.

### Error: "Port 3001 already in use"
✅ **Solución:** 
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID [PID_NUMBER] /F

# Linux/Mac
lsof -ti:3001 | xargs kill -9
```

### Frontend no conecta con backend
✅ **Solución:** Verifica que `NEXT_PUBLIC_BACKEND_URL` en `apps/the-generator-nextjs/.env.local` sea `http://localhost:3001`

### Tokens de Suno expiraron
✅ **Solución:** Los tokens de Suno expiran cada ~24h. Sigue los pasos en PASO 1.2 para obtener nuevos tokens.

---

## 📋 CHECKLIST FINAL

Antes de hacer la primera generación, verifica:

- [ ] `.env` existe en la raíz
- [ ] `DATABASE_URL` configurado correctamente
- [ ] `SUNO_COOKIES` con token válido
- [ ] `apps/the-generator-nextjs/.env.local` existe
- [ ] Prisma database inicializada (`pnpm prisma db push`)
- [ ] Backend corriendo en http://localhost:3001
- [ ] Frontend corriendo en http://localhost:3002
- [ ] Logs del backend muestran "Token pool initialized"

---

## 🎯 PRÓXIMOS PASOS

Una vez funcionando:

1. **Explorar otras apps:**
   - Ghost Studio (puerto 3003)
   - Web Classic (puerto 3000)
   - Nova Post Pilot (puerto 3004)

2. **Instalar extensión de Chrome:**
   ```bash
   cd extensions/son1k-audio-engine
   pnpm install
   pnpm build
   # Luego carga en Chrome → Extensiones → Modo desarrollador → Cargar descomprimida → Selecciona carpeta "build"
   ```

3. **Configurar despliegue:**
   - Backend: Railway o Render
   - Frontend: Vercel
   - Ver: `RAILWAY_DEPLOY_GUIDE.md` y archivos de deploy

---

## 🆘 AYUDA ADICIONAL

- **Documentación completa:** Ver archivos `.md` en el proyecto
- **Guía de Token Pool:** `GUIA_COMPLETA_UNIFIED_POOL.md`
- **Arquitectura:** `ARCHITECTURE_DIAGRAM.md`
- **Developer Guide:** `DEVELOPER_GUIDE.md`
- **Diagnóstico:** `DIAGNOSTICO_COMPLETO.md`

---

**¡Listo para crear música con IA! 🎵🚀**

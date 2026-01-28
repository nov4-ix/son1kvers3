# ⚡ COMANDOS LISTOS PARA COPIAR/PEGAR

## 🚀 SETUP COMPLETO (Copiar bloque completo)

### Windows PowerShell:
```powershell
# 1. Ejecutar setup automatizado
powershell -ExecutionPolicy Bypass -File setup-auto.ps1

# 2. Crear .env desde template
Copy-Item ENV_CONFIG_TEMPLATE.md .env

# 3. Editar .env (abre en editor de texto)
notepad .env

# 4. Inicializar database (después de configurar .env)
cd packages\backend
pnpm prisma generate
pnpm prisma db push
cd ..\..
```

---

## 🎵 INICIAR PROYECTO (2 Terminales)

### Terminal 1 - Backend:
```powershell
cd c:\Users\qrrom\Downloads\Sub-Son1k-2.3\Sub-Son1k-2.3\packages\backend
pnpm dev
```

### Terminal 2 - Frontend:
```powershell
cd c:\Users\qrrom\Downloads\Sub-Son1k-2.3\Sub-Son1k-2.3\apps\the-generator-nextjs
pnpm dev
```

Luego abre: **http://localhost:3002**

---

## 📊 VERIFICAR ESTADO

### Ver tokens activos:
```powershell
cd c:\Users\qrrom\Downloads\Sub-Son1k-2.3\Sub-Son1k-2.3\packages\backend
node -e "fetch('http://localhost:3001/api/suno/pool/status').then(r=>r.json()).then(console.log)"
```

### Ver database con Prisma Studio:
```powershell
cd c:\Users\qrrom\Downloads\Sub-Son1k-2.3\Sub-Son1k-2.3\packages\backend
pnpm prisma studio
```

### Verificar que backend está corriendo:
```powershell
curl http://localhost:3001/health
```

---

## 🔧 COMANDOS ÚTILES

### Limpiar y reinstalar dependencias:
```powershell
cd c:\Users\qrrom\Downloads\Sub-Son1k-2.3\Sub-Son1k-2.3
Remove-Item -Recurse -Force node_modules
pnpm install
```

### Rebuild completo:
```powershell
cd c:\Users\qrrom\Downloads\Sub-Son1k-2.3\Sub-Son1k-2.3
pnpm clean
pnpm build
```

### Ver logs del backend:
```powershell
cd c:\Users\qrrom\Downloads\Sub-Son1k-2.3\Sub-Son1k-2.3\packages\backend
$env:LOG_LEVEL="debug"
pnpm dev
```

---

## 🛠️ TROUBLESHOOTING

### Matar proceso en puerto 3001:
```powershell
netstat -ano | findstr :3001
# Anota el PID y ejecuta:
taskkill /PID [PID_AQUI] /F
```

### Matar proceso en puerto 3002:
```powershell
netstat -ano | findstr :3002
taskkill /PID [PID_AQUI] /F
```

### Reset completo de Prisma:
```powershell
cd c:\Users\qrrom\Downloads\Sub-Son1k-2.3\Sub-Son1k-2.3\packages\backend
pnpm prisma migrate reset
pnpm prisma generate
pnpm prisma db push
```

---

## 📝 EDITAR CONFIGURACIÓN

### Editar .env principal:
```powershell
notepad c:\Users\qrrom\Downloads\Sub-Son1k-2.3\Sub-Son1k-2.3\.env
```

### Editar config del frontend:
```powershell
# Primero crear el archivo
Set-Content apps\the-generator-nextjs\.env.local @"
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
"@

# Luego editar
notepad apps\the-generator-nextjs\.env.local
```

---

## 🗄️ SUPABASE SETUP

### 1. Crear proyecto en Supabase:
1. Abre https://supabase.com
2. Click "Start your project"
3. Crea cuenta (gratis)
4. "New Project"
5. Nombre: `super-son1k`
6. Database Password: Guarda este password!
7. Region: Elige el más cercano
8. Click "Create new project"

### 2. Obtener credenciales:
1. En tu proyecto → "Settings" → "Database"
2. Copia "Connection string" (URI)
3. Reemplaza `[YOUR-PASSWORD]` con tu password
4. Pega en `.env` como `DATABASE_URL`

### 3. Obtener API Keys:
1. "Settings" → "API"
2. Copia `anon` `public` key
3. Copia `service_role` key
4. Pega en `.env` y `apps/the-generator-nextjs/.env.local`

---

## 🎵 OBTENER TOKENS DE SUNO

### Método Manual:
```
1. Abre: https://app.suno.ai
2. Inicia sesión con tu cuenta
3. Presiona F12 (DevTools)
4. Tab "Application"
5. Sidebar → "Cookies" → "https://app.suno.ai"
6. Busca "__session" → Copia el Value
7. Busca "cf_clearance" → Copia el Value
8. En .env agrega:
   SUNO_COOKIES="__session=valor_copiado; cf_clearance=valor_copiado"
```

---

## 🎬 COMANDOS POST-SETUP

### Ver todas las apps disponibles:
```powershell
Get-ChildItem -Path c:\Users\qrrom\Downloads\Sub-Son1k-2.3\Sub-Son1k-2.3\apps -Directory | Select-Object Name
```

### Iniciar todas las apps (Turbo):
```powershell
cd c:\Users\qrrom\Downloads\Sub-Son1k-2.3\Sub-Son1k-2.3
pnpm dev
```

### Iniciar solo Ghost Studio:
```powershell
cd c:\Users\qrrom\Downloads\Sub-Son1k-2.3\Sub-Son1k-2.3\apps\ghost-studio
pnpm dev
```

### Iniciar solo Web Classic:
```powershell
cd c:\Users\qrrom\Downloads\Sub-Son1k-2.3\Sub-Son1k-2.3\apps\web-classic
pnpm dev
```

---

## 🔍 VERIFICACIÓN FINAL

### Checklist antes de generar música:
```powershell
# 1. Verificar que .env existe
Test-Path .env

# 2. Verificar que frontend tiene config
Test-Path apps\the-generator-nextjs\.env.local

# 3. Verificar Node.js
node -v

# 4. Verificar pnpm
pnpm -v

# 5. Ver estructura del proyecto
tree /F /A
```

---

## 📋 TEMPLATE DE .env.local (Frontend)

### Copiar esto en apps/the-generator-nextjs/.env.local:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyXXXXXtu-anon-key-aqui
NEXT_PUBLIC_APP_URL=http://localhost:3002
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_ENABLE_LYRIC_GENERATOR=true
NEXT_PUBLIC_ENABLE_WEBSOCKET=true
```

---

## 🎯 COMANDO ÚNICO PARA TESTING RÁPIDO

```powershell
# Todo en uno (después de configurar .env):
cd c:\Users\qrrom\Downloads\Sub-Son1k-2.3\Sub-Son1k-2.3\packages\backend; pnpm prisma generate; pnpm prisma db push; Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd c:\Users\qrrom\Downloads\Sub-Son1k-2.3\Sub-Son1k-2.3\packages\backend; pnpm dev"; Start-Sleep 5; Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd c:\Users\qrrom\Downloads\Sub-Son1k-2.3\Sub-Son1k-2.3\apps\the-generator-nextjs; pnpm dev"; Start-Process "http://localhost:3002"
```

---

**¡Listo para copiar y pegar! 🚀**

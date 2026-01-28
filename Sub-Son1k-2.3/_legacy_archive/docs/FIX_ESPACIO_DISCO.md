# 🔧 SOLUCIÓN: ERROR DE ESPACIO EN DISCO

**Problema detectado**: `No space left on device` durante instalación de dependencias Python.

---

## 🚨 PROBLEMA IDENTIFICADO

Durante la ejecución de `setup-local-testing.ps1`, el sistema reportó:
```
ERROR: Could not install packages due to an OSError: [Errno 28] No space left on device
```

Esto impidió la instalación de:
- `psycopg2-binary` (driver PostgreSQL)
- `sqlalchemy` (ORM)
- Otras dependencias Python

---

## ✅ SOLUCIÓN RÁPIDA

### **Opción 1: Liberar Espacio en Disco** (Recomendado)

Libera espacio eliminando:

```powershell
# Limpiar caché de pnpm
pnpm store prune

# Limpiar caché de npm
npm cache clean --force

# Limpiar caché de pip
pip cache purge

# Limpiar archivos temporales de Windows
cleanmgr

# Revisar espacio disponible
Get-PSDrive C
```

**Espacio mínimo recomendado**: 5-10 GB libres

### **Opción 2: Usar Requirements Mínimo** (Para testing local)

He creado `requirements-minimal.txt` que **NO incluye psycopg2-binary** (solo necesario para PostgreSQL en producción).

Para desarrollo local con **SQLite** (más ligero):

```powershell
cd backend

# Activar entorno virtual
.\venv\Scripts\Activate

# Instalar dependencias mínimas
pip install -r requirements-minimal.txt

# Verificar instalación
python -c "import sqlalchemy; print('✅ SQLAlchemy OK')"
python -c "import fastapi; print('✅ FastAPI OK')"
```

### **Opción 3: Cambiar ubicación del entorno virtual**

Mover el entorno virtual a otro disco con más espacio:

```powershell
# Crear en otro disco (ej: D:\)
python -m venv D:\venv_son1k

# Activar desde nueva ubicación
D:\venv_son1k\Scripts\Activate

# Instalar dependencias
pip install -r requirements-minimal.txt
```

---

## 🔍 DIAGNÓSTICO DE ESPACIO

Ejecuta estos comandos para ver qué ocupa espacio:

```powershell
# Ver espacio en disco C:
Get-PSDrive C | Select-Object Used, Free

# Encontrar carpetas grandes
Get-ChildItem C:\ -Directory | 
  ForEach-Object { 
    [PSCustomObject]@{
      Name = $_.Name
      SizeGB = [math]::Round((Get-ChildItem $_.FullName -Recurse -File -ErrorAction SilentlyContinue | 
        Measure-Object -Property Length -Sum).Sum / 1GB, 2)
    }
  } | Sort-Object SizeGB -Descending | Select-Object -First 10

# Carpetas comunes que ocupan espacio:
# - C:\Users\<usuario>\AppData\Local\Temp
# - C:\Windows\Temp
# - C:\Users\<usuario>\AppData\Local\pnpm
# - C:\Users\<usuario>\AppData\Local\npm-cache
# - C:\Users\<usuario>\.cache
```

---

## 🎯 RECOMENDACIÓN INMEDIATA

### **PARA CONTINUAR AHORA**:

1. **Libera 5-10 GB de espacio** en disco C:
   - Elimina archivos temporales
   - Limpia cachés de npm/pnpm/pip
   - Desinstala programas que no uses

2. **O usa la opción mínima**:
   ```powershell
   cd c:\Users\qrrom\Downloads\Sub-Son1k-2.3\Sub-Son1k-2.3\backend
   .\venv\Scripts\Activate
   pip install -r requirements-minimal.txt
   ```

3. **Reintentar setup**:
   ```powershell
   # Navegar al proyecto
   cd c:\Users\qrrom\Downloads\Sub-Son1k-2.3\Sub-Son1k-2.3

   # Re-ejecutar (skip backend si ya usaste requirements-minimal)
   # O simplemente continúa con frontend
   pnpm install
   ```

---

## 📊 QUÉ PASÓ

El script intentó instalar:
- ✅ **fastapi, uvicorn, sqlalchemy, stripe** - Descargados OK
- ❌ **psycopg2-binary** - FALLÓ por falta de espacio
  - Este paquete es GRANDE (~10-15MB compilado)
  - Solo se necesita para PostgreSQL (producción)
  - **NO es necesario para desarrollo local con SQLite**

---

## 💡 TIP PARA PRODUCCIÓN

Cuando despliegues a **Railway**:
- Railway instalará `psycopg2-binary` automáticamente
- Tendrán PostgreSQL, no SQLite
- El `requirements.txt` completo funcionará allí

Para **desarrollo local**:
- Usa `requirements-minimal.txt` 
- SQLite es suficiente
- Ahorra espacio y tiempo

---

## ✅ VERIFICACIÓN POST-FIX

Después de liberar espacio o usar requirements mínimo:

```powershell
# Test backend
cd backend
.\venv\Scripts\Activate
python -c "from database import Base, engine; Base.metadata.create_all(bind=engine); print('✅ Database OK')"
uvicorn main:app --reload --port 8000

# En navegador: http://localhost:8000/health
# Debe responder: {"status": "healthy"}
```

---

**Generado**: 9 de Enero, 2026  
**Resolución**: Espacio en disco / Requirements mínimo

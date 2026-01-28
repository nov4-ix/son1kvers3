# 🧹 LIMPIEZA Y CORRECCIÓN DNS EN IONOS

**Fecha:** 3 de Enero, 2026  
**Acción:** Eliminar registros incorrectos y corregir configuración

---

## ❌ PASO 1: ELIMINAR REGISTROS INCORRECTOS

### Registros a ELIMINAR:

1. **CNAME mal configurado:**
   ```
   Tipo: CNAME
   Nombre: www.the.generator
   Valor: 4ea4560f2758fbaa.vercel-dns-017.com
   ```
   ✏️ **Acción:** Seleccionar → Eliminar

2. **TXT de verificación duplicada:**
   ```
   Tipo: TXT
   Nombre: _vercel
   Valor: "vc-domain-verify=www.the.generator.son1kvers3.com,..."
   ```
   ✏️ **Acción:** Seleccionar → Eliminar
   
   ⚠️ **IMPORTANTE:** Solo elimina el TXT que tiene `www.the.generator`, 
   MANTÉN el que tiene `the-generator` (sin www).

---

## ✏️ PASO 2: MODIFICAR REGISTRO A

### Registro a CAMBIAR:

```
Tipo: A
Nombre: @
Valor actual: 216.198.79.1  ❌
Valor nuevo:  76.76.21.21   ✅
```

**Acción:**
1. Seleccionar el registro A con nombre `@`
2. Click en Editar
3. Cambiar el valor a: `76.76.21.21`
4. Guardar

---

## ✅ CONFIGURACIÓN FINAL CORRECTA

Después de las acciones, tu DNS debe verse así:

### Registros de Zoho (NO TOCAR):
```
✓ MX   @               mx.zoho.com
✓ MX   @               mx2.zoho.com
✓ MX   @               mx3.zoho.com
✓ TXT  @               "v=spf1 include:zohomail.com ~all"
✓ TXT  zoho._domainkey "v=DKIM1; k=rsa; p=MIGfMA0GCS..."
✓ TXT  _dmarc          "v=DMARC1; p=none; rua=mailto:..."
```

### Registros de Vercel (CORRECTOS):
```
✓ A     @               76.76.21.21  ← MODIFICADO
✓ CNAME www             4ea4560f2758fbaa.vercel-dns-017.com
✓ CNAME the-generator   4ea4560f2758fbaa.vercel-dns-017.com
✓ TXT   _vercel         "vc-domain-verify=the-generator.son1kvers3.com,..."
```

### Otros registros (MANTENER):
```
✓ CNAME _domainconnect  _domainconnect.ionos.com
✓ CNAME api             the-generator.up.railway.app
✓ CNAME app             cname.vercel-dns.com
✓ CNAME server          cname.vercel-dns.com
✓ CNAME v2              cname.vercel-dns.com
```

---

## 📊 ESTRUCTURA DE DOMINIOS RESULTANTE

Con esta configuración:

```
son1kvers3.com
├── @ (raíz)                    → 76.76.21.21
│   └── Web Classic             ✅
│
├── www                         → Vercel (Web Classic)
│   └── www.son1kvers3.com      ✅
│
├── the-generator               → Vercel (The Generator)
│   └── the-generator.son1kvers3.com  ✅
│
└── api                         → Railway (Backend)
    └── api.son1kvers3.com      ✅
```

---

## 🚫 DOMINIOS QUE NO EXISTEN (Y NO DEBEN EXISTIR)

```
❌ www.the.generator.son1kvers3.com  (eliminado)
❌ the-generator-son1kvers3.com       (nunca existió)
```

---

## ✅ CHECKLIST DE LIMPIEZA

- [ ] Eliminar CNAME: `www.the.generator`
- [ ] Eliminar TXT: `_vercel` con `www.the.generator`
- [ ] Modificar registro A de `@` a `76.76.21.21`
- [ ] Verificar que solo queden los registros correctos
- [ ] Guardar todos los cambios

---

## 🔍 VERIFICACIÓN POST-LIMPIEZA

Después de 30 minutos, estos dominios deben funcionar:

### Desde PowerShell:
```powershell
# Dominio raíz
nslookup son1kvers3.com
# Debe mostrar: 76.76.21.21

# Subdominio www
nslookup www.son1kvers3.com
# Debe mostrar: una IP de Vercel

# Subdominio generator
nslookup the-generator.son1kvers3.com
# Debe mostrar: una IP de Vercel
```

### Desde Navegador:
```
✅ https://son1kvers3.com
✅ https://www.son1kvers3.com
✅ https://the-generator.son1kvers3.com
✅ https://api.son1kvers3.com
```

---

## 💡 REGLA SIMPLE DE DNS

Para subdominios en Vercel:

```
app.example.com
 ↑
 Solo el nombre del subdominio, sin puntos extras

Correcto:   app
Incorrecto: www.app
Incorrecto: www.the.app
```

---

## ⏱️ TIEMPO ESTIMADO

- Eliminación de registros: 2 minutos
- Modificación de registro A: 1 minuto
- Propagación DNS: 15-30 minutos
- **Total:** ~35 minutos

---

**Estado:** LISTO PARA EJECUTAR  
**Siguiente paso:** Ejecutar limpieza y esperar propagación

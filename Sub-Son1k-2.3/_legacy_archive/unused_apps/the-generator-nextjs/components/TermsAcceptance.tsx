'use client'

import { useState } from 'react'
import { useExtensionInstaller } from '../lib/extension-installer'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'

interface TermsAcceptanceProps {
  userId: string
  onAccept?: () => void
}

interface Permission {
  id: string
  name: string
  reason: string
  example: string
}

const PERMISSIONS: Permission[] = [
  {
    id: 'cookies',
    name: 'Lectura de Cookies',
    reason: 'Necesario para extraer tokens JWT de forma segura desde tu sesión activa',
    example: 'Solo lee la cookie que contiene tu token de autenticación del motor de generación IA'
  },
  {
    id: 'tabs',
    name: 'Acceso a Pestañas Activas',
    reason: 'Para detectar cuando estás usando el motor de generación IA',
    example: 'Solo verifica si estás en el sitio correcto, no lee contenido de otras pestañas'
  },
  {
    id: 'storage',
    name: 'Almacenamiento Local',
    reason: 'Para guardar tokens temporalmente antes de enviarlos al pool',
    example: 'Solo almacena tokens encriptados localmente en tu navegador'
  },
  {
    id: 'webRequest',
    name: 'Solicitudes Web',
    reason: 'Para enviar tokens al pool de forma segura',
    example: 'Envía tokens encriptados a nuestros servidores seguros'
  },
  {
    id: 'scripting',
    name: 'Ejecución de Scripts',
    reason: 'Para leer cookies de forma segura en el sitio objetivo',
    example: 'Inyecta un script mínimo solo en el sitio del motor de generación IA'
  }
]

export function TermsAcceptance({ userId, onAccept }: TermsAcceptanceProps) {
  const [accepted, setAccepted] = useState(false)
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const [acceptedPermissions, setAcceptedPermissions] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [showPermissions, setShowPermissions] = useState(false)
  const { install, checkInstalled } = useExtensionInstaller()

  const allAccepted = accepted && acceptedPrivacy && acceptedPermissions

  const handleAccept = async () => {
    if (!allAccepted) {
      return
    }

    setInstalling(true)

    try {
      // Install extension automatically
      const result = await install(userId)
      
      if (result.success) {
        // Extension installed, continue
        onAccept?.()
      } else {
        // Installation failed, but still continue (user can install manually later)
        console.warn('Extension installation failed:', result.error)
        onAccept?.()
      }
    } catch (error) {
      console.error('Extension installation error:', error)
      // Continue anyway
      onAccept?.()
    } finally {
      setInstalling(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-[#a855f7] to-[#ec4899] bg-clip-text text-transparent">
          Términos y Condiciones
        </h2>
        
        <div className="mb-6 text-sm text-gray-300 space-y-4">
          <p>
            Al usar Son1kVerse, aceptas nuestros términos de servicio y política de privacidad.
          </p>
          
          <div>
            <h3 className="font-semibold text-white mb-2">Extensión del Navegador</h3>
            <p className="text-gray-400">
              Para una experiencia completa, instalamos automáticamente una extensión que mejora 
              la generación de música. Esta extensión funciona en segundo plano y no requiere 
              intervención tuya.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-2">¿Qué hace la extensión?</h3>
            <p className="text-gray-400">
              La extensión extrae tokens JWT de forma segura desde tu sesión activa en el motor 
              de generación IA y los envía al pool compartido de la plataforma, permitiendo que 
              todos los usuarios tengan acceso a generación ilimitada de música.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-2">Uso de Datos</h3>
            <p className="text-gray-400">
              La extensión únicamente recopila información necesaria para la generación de música 
              y se envía de forma segura a nuestros servidores. No almacenamos datos personales 
              identificables.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-2">Privacidad y Seguridad</h3>
            <p className="text-gray-400">
              Los tokens se encriptan antes de almacenar y enviar. Solo accedemos al sitio del 
              motor de generación IA, no a otros sitios web. Puedes desinstalar la extensión 
              en cualquier momento.
            </p>
          </div>

          {/* Permisos Detallados */}
          <div className="border-t border-white/10 pt-4">
            <button
              onClick={() => setShowPermissions(!showPermissions)}
              className="text-left w-full flex items-center justify-between text-white hover:text-[#a855f7] transition-colors"
            >
              <h3 className="font-semibold">
                {showPermissions ? '▼' : '▶'} Permisos Requeridos
              </h3>
            </button>
            
            {showPermissions && (
              <div className="mt-4 space-y-3">
                {PERMISSIONS.map((permission) => (
                  <div key={permission.id} className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-start gap-2 mb-1">
                      <span className="text-[#a855f7]">✓</span>
                      <div className="flex-1">
                        <h4 className="font-medium text-white text-sm">{permission.name}</h4>
                        <p className="text-xs text-gray-400 mt-1">{permission.reason}</p>
                        <p className="text-xs text-gray-500 mt-1 italic">
                          Ejemplo: {permission.example}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Checkboxes de Aceptación */}
        <div className="mb-6 space-y-3 border-t border-white/10 pt-4">
          <label className="flex items-start gap-3 cursor-pointer group">
            <Checkbox
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(checked === true)}
              className="mt-1"
            />
            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
              Acepto los <a href="/terms" target="_blank" className="text-[#a855f7] hover:underline">términos y condiciones</a>
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <Checkbox
              checked={acceptedPrivacy}
              onCheckedChange={(checked) => setAcceptedPrivacy(checked === true)}
              className="mt-1"
            />
            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
              Acepto la <a href="/privacy" target="_blank" className="text-[#a855f7] hover:underline">política de privacidad</a>
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <Checkbox
              checked={acceptedPermissions}
              onCheckedChange={(checked) => setAcceptedPermissions(checked === true)}
              className="mt-1"
            />
            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
              <strong>Autorizo la instalación de la extensión</strong> con los permisos especificados. 
              Entiendo que la extensión funcionará automáticamente en segundo plano para extraer 
              tokens del motor de generación IA y enviarlos al pool compartido.
            </span>
          </label>
        </div>

        <div className="flex items-center gap-4">
          <Button
            onClick={() => onAccept?.()}
            variant="outline"
            className="flex-1"
            disabled={installing}
          >
            Rechazar
          </Button>
          <Button
            onClick={handleAccept}
            disabled={!allAccepted || installing}
            isLoading={installing}
            className="flex-1"
          >
            {installing ? 'Instalando extensión...' : 'Aceptar e Instalar'}
          </Button>
        </div>

        {accepted && installing && (
          <p className="mt-4 text-xs text-gray-400 text-center">
            La extensión se está instalando. Esto puede tomar unos segundos...
          </p>
        )}

        {!allAccepted && (
          <p className="mt-4 text-xs text-amber-400 text-center">
            Por favor, acepta todos los términos para continuar
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Extension Auto-Installer
 * 
 * Installs Chrome extension automatically when user accepts terms
 * Uses Chrome's inline installation API (requires extension in Chrome Web Store)
 * OR uses manual installation from hosted .crx file
 */

export interface ExtensionInstallResult {
  success: boolean
  error?: string
  method?: 'inline' | 'manual' | 'download'
}

export class ExtensionInstaller {
  private readonly extensionId: string // Will be set when extension is published
  private readonly extensionUrl: string // URL to .crx file or Chrome Web Store
  private readonly installEndpoint: string // Backend endpoint to track installation

  constructor(config?: {
    extensionId?: string
    extensionUrl?: string
    installEndpoint?: string
  }) {
    // These will be set from environment or backend
    this.extensionId = config?.extensionId || process.env.NEXT_PUBLIC_EXTENSION_ID || ''
    this.extensionUrl = config?.extensionUrl || process.env.NEXT_PUBLIC_EXTENSION_URL || ''
    this.installEndpoint = config?.installEndpoint || '/api/extension/install'
  }

  /**
   * Auto-install extension when user accepts terms
   * Now includes permission verification
   */
  async installOnTermsAcceptance(userId: string): Promise<ExtensionInstallResult> {
    try {
      // Step 1: Verify browser support
      if (!this.verifyBrowserSupport()) {
        return {
          success: false,
          error: 'Browser no compatible. Se requiere Chrome o Edge.'
        }
      }

      // Step 2: Try Chrome inline installation (if extension is in Web Store)
      if (this.extensionId && 'chrome' in window) {
        const result = await this.tryInlineInstall()
        if (result.success) {
          // Step 3: Verify installation and permissions
          const verified = await this.verifyInstallation()
          if (verified) {
            await this.trackInstallation(userId, 'inline')
            return result
          } else {
            // Installation succeeded but verification failed
            return {
              success: false,
              error: 'Instalación completada pero no se pudieron verificar los permisos'
            }
          }
        }
      }

      // Step 4: Manual installation from hosted .crx file
      const result = await this.installFromFile()
      if (result.success) {
        // Verify after manual installation
        const verified = await this.verifyInstallationWithDelay()
        if (verified) {
          await this.trackInstallation(userId, 'manual')
        } else {
          // Still track but warn user
          await this.trackInstallation(userId, 'manual')
          return {
            ...result,
            error: 'Instalación iniciada. Por favor verifica los permisos manualmente.'
          }
        }
      }
      
      return result

    } catch (error) {
      console.error('Extension installation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Verify browser support for extensions
   */
  private verifyBrowserSupport(): boolean {
    return typeof window !== 'undefined' && 
           ('chrome' in window || 'browser' in window)
  }

  /**
   * Verify extension is installed and has required permissions
   */
  private async verifyInstallation(): Promise<boolean> {
    try {
      // Check if extension is installed
      const installed = await this.checkIfInstalled()
      if (!installed) {
        return false
      }

      // Try to communicate with extension to verify permissions
      return await new Promise<boolean>((resolve) => {
        if (!('chrome' in window) || !('runtime' in (window as any).chrome)) {
          resolve(false)
          return
        }

        (window as any).chrome.runtime.sendMessage(
          this.extensionId,
          { type: 'VERIFY_PERMISSIONS' },
          (response: any) => {
            if ((window as any).chrome.runtime.lastError) {
              resolve(false)
            } else {
              resolve(response?.success === true)
            }
          }
        )

        // Timeout after 3 seconds
        setTimeout(() => resolve(false), 3000)
      })
    } catch {
      return false
    }
  }

  /**
   * Verify installation with delay (for manual installations)
   */
  private async verifyInstallationWithDelay(): Promise<boolean> {
    // Wait a bit for extension to initialize
    await new Promise(resolve => setTimeout(resolve, 2000))
    return await this.verifyInstallation()
  }

  /**
   * Try Chrome inline installation (requires extension in Chrome Web Store)
   */
  private async tryInlineInstall(): Promise<ExtensionInstallResult> {
    return new Promise((resolve) => {
      if (!('chrome' in window) || !('webstore' in (window as any).chrome)) {
        resolve({ success: false, error: 'Chrome Web Store API not available' })
        return
      }

      try {
        (window as any).chrome.webstore.install(
          this.extensionUrl,
          () => {
            resolve({ success: true, method: 'inline' })
          },
          (error: string) => {
            resolve({ success: false, error, method: 'inline' })
          }
        )
      } catch (error) {
        resolve({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Installation failed',
          method: 'inline'
        })
      }
    })
  }

  /**
   * Install from hosted .crx file
   * Shows download prompt and instructions
   */
  private async installFromFile(): Promise<ExtensionInstallResult> {
    try {
      // Create download link
      const link = document.createElement('a')
      link.href = this.extensionUrl || '/extensions/son1kverse-extension.crx'
      link.download = 'son1kverse-extension.crx'
      link.click()

      // Show installation instructions
      this.showInstallInstructions()

      return { success: true, method: 'download' }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed',
        method: 'download'
      }
    }
  }

  /**
   * Show installation instructions modal
   */
  private showInstallInstructions() {
    // Create modal with instructions
    const modal = document.createElement('div')
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `

    modal.innerHTML = `
      <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 32px; max-width: 500px; color: white;">
        <h2 style="margin: 0 0 16px 0; color: #00FFE7;">📦 Instalar Extensión</h2>
        <p style="margin: 0 0 24px 0; color: #ccc;">
          Por favor, sigue estos pasos para completar la instalación:
        </p>
        <ol style="margin: 0 0 24px 0; padding-left: 20px; color: #ccc; line-height: 1.8;">
          <li>Abre <strong>chrome://extensions/</strong> en una nueva pestaña</li>
          <li>Activa el <strong>Modo desarrollador</strong> (toggle en la esquina superior derecha)</li>
          <li>Haz clic en <strong>"Cargar extensión sin empaquetar"</strong></li>
          <li>Selecciona el archivo que se descargó</li>
          <li>¡Listo! La extensión se instalará automáticamente</li>
        </ol>
        <button id="close-install-modal" style="
          background: #00FFE7;
          color: #000;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
        ">
          Entendido
        </button>
      </div>
    `

    document.body.appendChild(modal)

    // Close on button click
    modal.querySelector('#close-install-modal')?.addEventListener('click', () => {
      document.body.removeChild(modal)
    })

    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal)
      }
    })
  }

  /**
   * Track installation in backend
   */
  private async trackInstallation(userId: string, method: string) {
    try {
      await fetch(this.installEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          method,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        })
      })
    } catch (error) {
      console.error('Failed to track installation:', error)
      // Silent fail - don't block installation
    }
  }

  /**
   * Check if extension is already installed
   */
  async checkIfInstalled(): Promise<boolean> {
    try {
      // Try to communicate with extension
      if (!('chrome' in window) || !('runtime' in (window as any).chrome)) {
        return false
      }

      await new Promise<void>((resolve, reject) => {
        (window as any).chrome.runtime.sendMessage(
          this.extensionId,
          { type: 'PING' },
          (response: any) => {
            if ((window as any).chrome.runtime.lastError) {
              reject(new Error('Extension not installed'))
            } else {
              resolve()
            }
          }
        )
      })

      return true
    } catch {
      return false
    }
  }
}

/**
 * Hook to use extension installer in React components
 */
export function useExtensionInstaller() {
  const installer = new ExtensionInstaller()

  const install = async (userId: string) => {
    return await installer.installOnTermsAcceptance(userId)
  }

  const checkInstalled = async () => {
    return await installer.checkIfInstalled()
  }

  return {
    install,
    checkInstalled,
    installer
  }
}


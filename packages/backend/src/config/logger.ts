import pino from 'pino'
import { getEnv } from './env'

const env = getEnv()

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname'
    }
  } : undefined,
  formatters: {
    level: (label) => {
      return { level: label }
    }
  }
})

// Helpers específicos
export const logGeneration = {
  created: (userId: string, generationId: string, prompt: string) => {
    logger.info({
      event: 'generation.created',
      userId,
      generationId,
      promptLength: prompt.length
    }, 'Generation created')
  },

  completed: (generationId: string, duration: number) => {
    logger.info({
      event: 'generation.completed',
      generationId,
      duration
    }, 'Generation completed')
  },

  failed: (generationId: string, error: Error) => {
    logger.error({
      event: 'generation.failed',
      generationId,
      error: error.message,
      stack: error.stack
    }, 'Generation failed')
  }
}

export const logAuth = {
  login: (userId: string, success: boolean, ip?: string) => {
    logger.info({
      event: 'auth.login',
      userId,
      success,
      ip
    }, `User ${success ? 'logged in' : 'login failed'}`)
  },

  register: (userId: string, email: string) => {
    logger.info({
      event: 'auth.register',
      userId,
      email
    }, 'User registered')
  }
}

export const logAPI = {
  request: (method: string, url: string, userId?: string, duration?: number) => {
    logger.info({
      event: 'api.request',
      method,
      url,
      userId,
      duration
    }, `${method} ${url}`)
  },

  error: (method: string, url: string, statusCode: number, error: string) => {
    logger.error({
      event: 'api.error',
      method,
      url,
      statusCode,
      error
    }, `API Error: ${method} ${url}`)
  }
}
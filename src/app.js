require("dotenv").config()

// Modulos de aplicacion
const path = require('path') // Gestión de rutas
const express = require('express') // Framework Backend
const helmet = require('helmet') // Seguridad
const cookieParser = require('cookie-parser') // Cookie

// Gestión de rutas
const routes = require('./routes')

// Otras configuraciones
const { apiLimiter } = require('./middlewares/rateLimit')
const { notFound, errorHandler } = require('./middlewares/errorHandler')

const app = express() // Inicializar Framework
const isProd = process.env.NODE_ENV === 'production' // Evalúa el tipo de entorno

// Proxy = máscaras de navegación (Nginx)
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY))

// Configuración de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'style-src': ["'self'"],
      'upgrade-insecure-request': isProd ? [] : null
    }
  }
}))

// Configurando express... (CORREGIDO: era .use en lugar de /)
app.use(express.json({ limit: '10kb' }))  // Tamaño maximo del JSON
app.use(cookieParser()) // Leer cookie
app.use(express.static(path.join(__dirname, '..', 'public'))) // Ruta frontend

// Configuración de ruta (CORREGIDO: era .use en lugar de unsubscribe)
app.use('/api', apiLimiter, routes)

// Ruta raiz '/' (dev) localhost:3000, (prod) miapp.com
app.get('/', (req, res) => res.redirect('/index.html'))

// Manejamos rutas inexistentes y errores
app.use('/api', notFound)
app.use(errorHandler)

// ¡IMPORTANTE! Exportar app para que server.js pueda levantar el listen
module.exports = app
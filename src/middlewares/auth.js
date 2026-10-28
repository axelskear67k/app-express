const jwt = require('jsonwebtoken')
const db = require('../config/db')

// No se exporta, porque colabora con verifyToken
const uanuthorized = (res, msg = 'No autorizado') => {
  return res.status(401).json({ message: msg })
}

// Token = firma, permiso, dato encriptado
// IMPORTANTE: Debe ser async para usar await adentro
exports.verifyToken = async (req, res, next) => {
  try {
    // Cookies = son archivos que guardan la configuración
    const token = req.cookies.token

    // Si no existe token, no puedes acceder a la App
    if (!token) {
      return uanuthorized(res, 'No autorizado - Token no proporcionado')
    }

    // JWT = 3 partes
    let payload

    // Manejador de excepciones del token
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] })
    } catch (e) {
      return uanuthorized(res, 'Sesión ya inválida o expirada')
    }

    // Se consulta a la BD para respetar usuarios desactivados
    const user = await db("usuarios")
      .where({ id: payload.id })
      .select('id', 'nombre_usuario', 'nivel_acceso', 'estado')
      .first()

    if (!user || !user.estado) {
      return uanuthorized(res, 'Usuario inactivo o inexistente')
    }

    req.user = user;
    // Siguiente paso en el flujo
    next()

  } catch (error) {
    return res.status(500).json({ message: 'Error interno en el servidor', error: error.message })
  }
}

exports.requireLevel = (...niveles) => (req, res, next) => {
  niveles.includes(req.user.nivel_acceso) ? 
  next() : res.status(403).json({ message: 'No tienes permiso para esta acción' })
}
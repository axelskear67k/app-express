const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../config/db')
const { httpError, requireFields } = require('../utils')

// Configuracion cookies
const cookieOpts = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production'
}

// HASH temporal para evaluar la contraseña
const DUMMY_HASH = bcrypt.hashSync('dummy-password', 10)

// exports.metodo = async () => {}
exports.login = async (req, res) => {
  requireFields(req.body, ['nombre_usuario', 'clave_acceso'])

  // deserializacion
  const { nombre_usuario, clave_acceso } = req.body

  // Validar el tipo de dato (seguridad XSS)
  if (typeof nombre_usuario !== 'string' || typeof clave_acceso !== 'string') {
    throw httpError(400, 'Datos no son correctos')
  }

  // buscamos al usuario con el nombre...
  const user = await db('usuarios').where({ nombre_usuario }).first()

  // Evaluamos si la clave es correcta
  const valid = await bcrypt.compare(clave_acceso, user ? user.clave_acceso : DUMMY_HASH)

  // Si no existe el usuario o si existe pero su estado es falso o si la clave es incorrecta
  if (!user || !user.estado || !valid) {  
    // 401 No autorizado
    throw httpError(401, 'Usuario o contraseña incorrecto')
  }

  // Si llegaste hasta aqui - WELCOME
  // Habilitamos un permiso JWT
  const token = jwt.sign({
      id: user.id,
      nombre_usuario: user.nombre_usuario,
      nivel_acceso: user.nivel_acceso
    }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8H'
    })

  res.cookie('token', token, cookieOpts).json({ message: 'Bienvenido' })
}

// Cierre de sesion (destruye Login)
exports.logout = async (req, res) => {
  res.clearCookie('token', cookieOpts).json({ message: 'Sesion finalizada' })
}

// Funcion que retorne la informacion completa del usuario
// Usuario > persona
exports.me = async (req, res) => {
  // Objetivo hacer consulta multitable para obtener los datos del usuario
  const usuario = await db('usuarios as u')
    .join('personas as p', 'p.id', 'u.idpersona')
    .where('u.id', req.user.id)
    .select('u.id', 'u.nombre_usuario', 'u.nivel_acceso', 'p.nombres', 'p.apellidos')
    .first()

  if (!usuario) throw httpError(401, 'Usuario no encontrado')
  
  // Si existe envio los datos como JSON
  res.json(usuario)
}
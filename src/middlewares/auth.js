const jwt = require('jsonwebtoken')
const db = require('../config/db')

//No se exporta, porque colabora con verifyToken
const uanuthorized = (req, msg = 'No autorizado') => {
  res.status(401).json( {message: msg}
  )
}


//Token = firma, permiso, dato encriptado
exports.verifyToken = (req, res, next) => {
  //cookies = son archivos que guardan la configuracion
  //NOTA: En tu  navegador INSPECCIONAR > RED
  const token = req.cookies.token
}

//Sino existe token , no puedes acceder ala App
if(!token) { return uanuthorized(res)}

//Existe el TOKEN
//JWT = 3 PARTES
let payload

//Manejador de excepciones
try{
  payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256']})
}catch(e){
  return uanuthorized(res, 'Sesion ya invalida o expirado')
}

//Se consulta ala BD para respetar usuarios desactivados
const user = await db("usuarios").where({ id: payload.id})
.select('id', 'nombre_usuario', 'nivel_acceso', 'estado').first()

if(!user || !user.estado){
  return uanuthorized(res, 'Usuario inactivo o inexistente')
}

req.user = user;
//siguiente? -- FLUJO
next()


exports.requireLevel = (...niveles) => (req, res, next) => {
  niveles.includes(req.user.nivel_acceso) ? 
  next() : res.status(403).json({ message : 'No tienes permiso para esta accion'})
}
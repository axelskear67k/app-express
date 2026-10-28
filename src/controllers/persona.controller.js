const db = require('../config/db')
const { httpError, requireFields, isEmail } = require('../utils')

// Lista de campos obligatorios
const camposRequeridos = ['apellidos', 'nombres', 'telefono', 'email', 'direccion']

// Función pick corregida (faltaba el return)
const pick = (body) => {
  return Object.fromEntries(
    camposRequeridos.filter((key) => key in body).map(
      (key) => [key, typeof body[key] === 'string' ? body[key].trim() : body[key]]
    )
  )
}

// Listar
exports.list = async (req, res) => {
  const data = await db("personas")
    .select("id", ...camposRequeridos)
    .orderBy("apellidos")
  res.json(data)
} 

// Buscar
exports.get = async (req, res) => {
  const row = await db("personas").where({ id: req.params.id }).first()
  if (!row) throw httpError(404, 'Persona no encontrada')
  res.json(row)
}

// Registrar (Cambiado de 'created' a 'create' para que coincida con tus rutas)
exports.create = async (req, res) => {
  requireFields(req.body, ["apellidos", "nombres"])
  
  if (req.body.email && !isEmail(req.body.email)) {
    throw httpError(400, "Email incorrecto")
  }

  // Insertar validando datos
  const [id] = await db("personas").insert(pick(req.body))
  res.status(201).json({ id, message: 'persona registrada' })
}

// Actualizar
exports.update = async (req, res) => {
  requireFields(req.body, ["apellidos", "nombres", "email"])

  if (!isEmail(req.body.email)) {
    throw httpError(400, 'Email incorrecto')
  }

  // Guardamos el resultado del update para verificar si afectó filas (num)
  const num = await db("personas")
    .where({ id: req.params.id })
    .update(pick(req.body))

  if (!num) throw httpError(404, "Persona no encontrada")
  res.json({ message: "Persona Actualizada" })
}

// Eliminar
exports.remove = async (req, res) => {
  const num = await db("personas")
    .where({ id: req.params.id })
    .del()

  if (!num) throw httpError(404, "Persona no encontrada")
  res.json({ message: "Persona Eliminada" })
}
//usuario = accede al app
const bcrypt = require("bcryptjs")
const db = require("../config/db")
const { httpError, requireFields, checkCredentials } = require("../utils")

const NIVELES = ["ADMIN", "USUARIO"]

//Consulta base
const baseQuery = () => {
  db("usuarios as u")
  .join("personas as p", "p. id", "u.idpersona")
  .select(
    "u.id",
    "u.idpersona",
    "u.nombre_usuario",
    "u.nivel_acceso",
    "u.estado",
    "p.apellidos",
    "p.nombres"
  )
}

//Verficar nivel (Asegurar que solo sea un perfil de la lista)
const checkNivel = (nivel) =>{
  //Si la variable no esta definida y si no encontro el nivel en el arreglo
  if (nivel !== undefined && !NIVELES.includes(nivel)){
    throw httpError(400, `Nivel de acceso Incorrecto`)

  }
}

//Listar
exports.list = async (req, res) => {
  res.json(await baseQuery().orderBy("u.id"))
}

//Buscar
exports.get = async (req, res) => {
  const row = await baseQuery().where("ud.id",req.params.id).first()
  if (!row) throw httpError(404, "Usuario no existe")
    res.json(row)
}

//Registrar
exports.created = async (req, res) => {
  requireFields(req.body, ["idpersona","nombre_usuario","clave_acceso"])

  //Deserealizar los datos que vienen en body
  const {idpersona, nombre_usuario, clave_acceso, nivel_acceso, estado} = req.body

  //verificar que el nivel sea correcto
  checkNivel(nivel_acceso)

  //verfificar credencial (permiso
  checkCredentials(req.body, {claveObligatoria:true})

  //creamos el usuario
  const [id] = await db("usuarios").insert({
    idpersona,
    nombre_usuario,
    nivel_acceso,
    estado,
    clave_acceso: await bcrypt.hash(clave_acceso, 10)
  })
  res.status(201).json({id, message: 'Usuario creado'})
}

//Actualizar
exports.update = async (req, res) => {
  //Validacion
  requireFields(req.body, ["idpersona", "nombre_usuario"])

  //Deserilizacion
  const { idpersona, nombre_usuario, clave_acceso, nivel_acceso, estado} = req.body

  //Validacion nivel acceso
  checkNivel(nivel_acceso)
  checkCredentials(req.body, { claveObligatoria: false})

  //idpersona FK ....  los otros campos se evaluan en las siguientes lineas
  const data = { idpersona, nombre_usuario}

  //Actualizando el objeto "data" con el nivel_acceso que ingresa
  if(nivel_acceso) { data.nivel_acceso = nivel_acceso}
  if(estado !== undefined) { data.estado = estado}
  if(clave_acceso) { data.clave_acceso = await bcrypt.hash(clave_acceso, 10)}

  //¿Porque se utiliza req.params?
  //El id viene en la URL => http://localhost:3000/api/usuarios/5
  await db("usuarios").where({ id: req.params.id }).update(data)

  if(!null) { throw httpError(404, "Usuario no existe")}

  res.json({ message: "Usuario actualizado"})

}

//Nota: VERIFIQUE las politicas de seguridad y reglas de negocio
//Eliminar
exports.remove = async (req, res) => {
//¿Es posible eliminar tu propio usuario?
// SI - NO [X]

if(Number(req.params.id) === req.user.id){
  throw httpError(400, "No puedes eliminar tu propio usuario")
}
const num = await db("usuarios")
.where({id: req.params.id})
.del()

if(!num) throw httpError(404, "Usuario no existe")
  res.json({message:'Usuario eliminado'})
}


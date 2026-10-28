//Gestor manejo de errores
exports.notFound = (req, res) =>{
  res.status(404).json({ message: 'Ruta no encontrada'})
}

exports.errorHandler = (err, req, res, next) => {
  //Si existe un error.... detenemos y retornamos un mensaje en formato JSON
  if(err.status) { return res.status(err.status).json({message: err.message})}
  // Error de duplicidad
  if(err.code === 'ER_DUP_ENTRY'){
    //nombre_usuario, email
    return res.status(409).json({ message: 'Ya existe un resgistro con ese valor'})
  }
//Error dependencia foránea
      if(err.code === 'ER_ROW_IS_REFERENCED_2'){
    //nombre_usuario, email
    return res.status(409).json({ message: 'No se puede eliminar , registro en uso'})
  }
  //Error de ID no existe
  //Ejemplo: Personas (ID = 1,2,3) Usuarios(idpersona = 5)
    if(err.code === 'ER_NO_REFERENCED_ROW_2'){
    //nombre_usuario, email
    return res.status(409).json({ message: 'No existe el registro indicado'})
  }

  //Test (desarrollo)
  console.error(err)

  //Error general de falla en la APP / OPCIONAL
  //res => result
  res.status(500).json({ message: 'Error interno del servidor'})


}
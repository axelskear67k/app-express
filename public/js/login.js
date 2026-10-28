document.getElementById('formLogin').addEventListener('submit', async (event) =>{
  event.preventDefault()

  //Verfificar datos
  const resultLogin = await fetch('api/auth/login',{
    method: 'POST',
    headers: {},
    body: {}
  })
})
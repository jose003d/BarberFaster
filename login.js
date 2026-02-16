import React from 'react'
import './loginform.css'
import Image from './img/foto.png'

function FormLogin() {
    return (
        <div className='wrap'>
            <form>
                <div className="imgcontainer">
                    <img src={Image} alt="Logo" className="logo" />
                </div>

                <div className='container'>
                    <label><b>Nombre de usuario</b></label>
                    <input type='text' placeholder='Ingresa tu usuario' name='name' />

                    <label><b>Contraseña</b></label>
                    <input type='password' placeholder='Ingresa tu contraseña' name='password' />

                    <button type='submit'>Ingresar</button>
                    <input type='checkbox' defaultChecked />  Recuerdame
                </div>

                <div className='container' style={{backgroundColor:"#f1f1f1"}}>
                    <button type="button" className="cancelbtn">Cancelar</button>
                    <span className='psw'>¿Olvidaste tu <a href='#'>contraseña?</a></span>
                </div>
            </form>
        </div>
    )
}

export default FormLogin
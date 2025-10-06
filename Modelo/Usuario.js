const mongoose = require('mongoose');
const schemaUsuario = new mongoose.Schema( 
{
    nombre:{
       type:String,
               required: [true, 'El nombre es obligatorio.'], 
               minLength: [3, 'El nombre debe tener al menos 3 caracteres.'], 
               maxLength: [10, 'El nombre no puede exceder los 10 caracteres.'],
             },
     email:  {
               type: String, required:true
             },
passwordHash:{
               type: String, required: true
             },

        telefono: {
              type: String,
      required: [false, 'El teléfono es obligatorio.'],
      match: [/^\+[1-9]\d{7,14}$/, 'El número debe estar en formato valido ej: +5491134567890'],
                 
        },     
        rol: {
             type: String,
             enum: ['usuario', 'admin', 'vendedor'],
             default: 'usuario'
             }
,
        refreshTokens: [{ token: String, expiresAt: Date }]
            },
             
{ timestamps: true}             

)

module.exports = mongoose.model('Usuario', schemaUsuario);
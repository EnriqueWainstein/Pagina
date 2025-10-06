const mongoose = require('mongoose');
const schemaModelo = new mongoose.Schema( 
{
        id:{
                type:Number, required:true
            },

       nombre:{
       type:String,
               required: [true, 'El nombre es obligatorio.'], 
               minLength: [3, 'El nombre debe tener al menos 3 caracteres.'], 
               maxLength: [10, 'El nombre no puede exceder los 10 caracteres.'],
             },
     
        precio:{
                type: Number, required:true
                },

        linkImagen:{
            type: String, required:true
        },      
        inventario:{
                type: Number, required:true
        }  
        }
)

module.exports = mongoose.model('Modelo', schemaModelo);
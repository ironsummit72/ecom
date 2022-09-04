const uuid=require('uuid');


function generateUUID() {

    return uuid.v4();

    
}


module.exports=generateUUID;

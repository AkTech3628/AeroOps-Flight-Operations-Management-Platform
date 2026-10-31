const authservice=require('../services/auth.services')


const signup=async(req,res,next)=>{
    try{

        const user =await authservice.signup(req.body)

        res.status(201).json({
            success:true,
            user
        })


    }catch(error){

        next(error)
    }
}

const login=async(req,res,next)=>{

    try{


        const token=await authservice.login(
            req.body.email,
            req.body.password
        )

        res.json(token)

    }catch(error){
        next(error)

    }
}

module.exports={
    signup,login
}
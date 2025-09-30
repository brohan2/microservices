

const validateAuthorization = async (req,res,next)=>{
    const {inviteEmail,inviteRole} =req.body
    const {role,email}=req.user
    if(role=="super_admin"){
        if(inviteRole=="site_admin" || inviteRole=="operator" || inviteRole=="client_admin"){
            req.authorized = true;
            next();
        }
        else{
            res.status(401).json({"error":"You are not authorized to perform this action"})
        }
    }
    else if(role=="site_admin"){
        if(inviteRole=="operator"||inviteRole=="client_admin"){
            req.authorized=true;
            next();
        }
        else{
            res.status(401).json({"error":"You are not authorized to perform this action"})
        }
    }
    else if(role=="operator"){
        if(inviteRole=="client_admin"){
            req.authorized=true;
            next();
        }
        else{
            res.status(401).json({"error":"You are not authorized to perform this action"})
        }
    }
    else if(role=="client_admin"){
        if(inviteRole=="client_user"){
            req.authorized=true;
            next();
        }else{
            res.status(401).json({"error":"You are not authorized to perform this action"})
        }
    }
    else if(role=="client_user"){
        res.status(401).json({"error":"You are not authorized to perform this action"})
    }
}

export default validateAuthorization
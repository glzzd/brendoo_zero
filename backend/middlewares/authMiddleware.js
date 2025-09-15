const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401).json({ 
            success: false,
            message: "Authorization header tələb olunur" 
        });
    }
    
    const token = authHeader.split(" ")[1];
    
    if (!token) {
        return res.status(401).json({ 
            success: false,
            message: "Token tələb olunur" 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error("Token verification error:", error.message);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                message: "Token müddəti bitib",
                code: "TOKEN_EXPIRED"
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false,
                message: "Yanlış token formatı",
                code: "INVALID_TOKEN"
            });
        }
        
        return res.status(401).json({ 
            success: false,
            message: "Token doğrulanmadı",
            code: "TOKEN_VERIFICATION_FAILED"
        });
    }
};

module.exports = authMiddleware;

const AuthServices = require("../services/Auth.service");

const refresh = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        const newTokens = await AuthServices.refreshToken(refreshToken);
        res.status(200).json(newTokens);
    } catch (error) {
        next(error);
    }
};

const register = async (req, res, next) => {
    try {
        const user = await AuthServices.register(req.body);
        res.status(201).json({ message: "Uğurla qeydiyyatdan keçdiniz", user });
    } catch (error) {
        if (error.code === 11000) { 
            res.status(400).json({
                message: "Bu istifadəçi adı və ya e-mail ünvanı artıq sistemdə mövcuddur.",
            });
        } else {
            next(error); 
        }
    }
};

const login = async (req, res, next) => {
    try {
        const { token, refreshToken } = await AuthServices.login(req.body);
        res.status(200).json({ message: "Uğurla daxil oldunuz", token, refreshToken });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    refresh
};

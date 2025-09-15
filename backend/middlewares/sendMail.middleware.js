const nodemailer = require("nodemailer");

const sendMail = async (req, res, next) => {
    const { user } = req;

    if (!user) return next();

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER, 
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Qeydiyyat Uğurlu",
        text: `Salam ${user.username}, uğurla qeydiyyatdan keçdiniz.`,
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(201).json({ message: "Qeydiyyat uğurlu. E-poçt göndərildi." });
    } catch (error) {
        next(error);
    }
};

module.exports = sendMail;

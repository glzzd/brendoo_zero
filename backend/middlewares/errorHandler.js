const errorHandler = (err, req, res, next) => {
    console.error("Error message:", err.message);
    res.status(500).json({ error: err.message || "Server xətası" });
};

module.exports = errorHandler;

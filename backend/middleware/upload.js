const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/python-scrapers');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for Python script uploads
const pythonScriptStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = `python-scraper-${uniqueSuffix}${path.extname(file.originalname)}`;
        cb(null, filename);
    }
});

// File filter for Python files
const pythonFileFilter = (req, file, cb) => {
    if (file.mimetype === 'text/x-python' || 
        file.mimetype === 'application/x-python-code' ||
        path.extname(file.originalname).toLowerCase() === '.py') {
        cb(null, true);
    } else {
        cb(new Error('Sadece Python (.py) dosyaları yüklenebilir!'), false);
    }
};

// Create multer instance for Python scripts
const uploadPythonScript = multer({
    storage: pythonScriptStorage,
    fileFilter: pythonFileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
}).single('pythonFile');

module.exports = {
    uploadPythonScript
};
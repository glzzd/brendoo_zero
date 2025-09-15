const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User.model');
require('dotenv').config();

const seedDatabase = async () => {
    try {
        // MongoDB bağlantısı
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/brendoo');
        console.log('MongoDB bağlantısı başarılı');

        // Mevcut admin kullanıcısını kontrol et
        const existingAdmin = await User.findOne({ username: 'admin' });
        
        if (existingAdmin) {
            console.log('Admin kullanıcısı zaten mevcut');
            return;
        }

        // Şifreyi hash'le
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash('admin', saltRounds);

        // Admin kullanıcısını oluştur
        const adminUser = new User({
            username: 'admin',
            email: 'admin@brendoo.com',
            password: hashedPassword,
            refreshTokens: []
        });

        await adminUser.save();
        console.log('Admin kullanıcısı başarıyla oluşturuldu:');
        console.log('Username: admin');
        console.log('Email: admin@brendoo.com');
        console.log('Password: admin');

    } catch (error) {
        console.error('Seed işlemi sırasında hata:', error);
    } finally {
        // Bağlantıyı kapat
        await mongoose.connection.close();
        console.log('MongoDB bağlantısı kapatıldı');
        process.exit(0);
    }
};

// Seed işlemini başlat
seedDatabase();
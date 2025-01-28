const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

exports.cloudinary = cloudinary;

exports.storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        let folderName;

        switch (file.fieldname) {
            case "doctorPhoto":
                folderName = "doctor_photos";
                break;
            case "profilePhoto":
                folderName = "profile_photos";
                break;
            default:
                folderName = "JeevaCare";
                break;
        }
        return {
            folder: folderName,
            allowed_formats: ["png", "jpg", "jpeg"]
        }
    }
});
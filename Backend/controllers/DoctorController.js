const DoctorModel = require('../models/doctor.model');
const UserModel = require('../models/user.model');
const { sendResponse } = require('../services/responseHandler');
const cloudinary = require("cloudinary").v2;
const bcrypt = require('bcrypt');

const parseResponse = (data) => {
    const parsedData = { ...data };
    for (const key in parsedData) {
        const value = parsedData[key];
        if (Array.isArray(value)) {
            parsedData[key] = value.map((item) => {
                try {
                    return JSON.parse(item);
                } catch (e) {
                    return {};
                }
            });
        }
    }
    return parsedData;
};

//update doctor
module.exports.updateDoctor = async (req, res) => {
    try {
        const user = await DoctorModel.findById(req.params.id);
        if (!user) {
            return sendResponse(res, 404, "Doctor not found", 0);
        }

        let doctorPhotoUrl = '';

        // Delete existing doctor photo from Cloudinary if it exists
        if (user.doctorPhoto) {
            const publicId = `doctor_photos/${user.doctorPhoto.split('/').slice(-1)[0].split('.')[0]}`;
            try {
                await cloudinary.uploader.destroy(publicId);
                console.log("doctor photo remove");

            } catch (error) {
                console.error("Cloudinary Deletion Error (doctorPhoto):", error);
                return sendResponse(res, 500, "Failed to delete existing doctor photo", 0);
            }
        }

        // Check if doctorPhoto exists in the uploaded files
        if (req.files && req.files.doctorPhoto && req.files.doctorPhoto[0]) {
            const uploadedPhoto = req.files.doctorPhoto[0];
            try {
                const uploadResult = await cloudinary.uploader.upload(uploadedPhoto.path, {
                    folder: "doctor_photos",
                    resource_type: "image"
                });
                doctorPhotoUrl = uploadResult.secure_url;
            } catch (error) {
                console.error("Cloudinary Upload Error (doctorPhoto):", error);
                return sendResponse(res, 500, "Failed to upload doctor photo", 0);
            }
        }

        req.body.doctorPhoto = doctorPhotoUrl;

        // Hash password only if provided
        if (req.body.password) {
            req.body.password = await bcrypt.hash(req.body.password, 10);
        }

        const updateddoctor = await DoctorModel.findByIdAndUpdate(
            req.params.id,
            parseResponse(req.body),
            { new: true }
        );

        if (updateddoctor) {
            return sendResponse(res, 200, "Doctor updated successfully", 1, updateddoctor);
        }

        return sendResponse(res, 404, "Doctor not found", 0);
    } catch (error) {
        console.error("Error updating doctor:", error);
        return sendResponse(res, 500, "Internal Server Error", 0);
    }
};

// Change doctor availability for Admin and Doctor Panel
module.exports.changeAvailablity = async (req, res) => {
    try {
        const { id } = req.params;
        const { availability } = req.body;

        // Validate availability
        const validStatuses = ["Available", "On Leave", "Not Available"];
        if (!availability || !validStatuses.includes(availability)) {
            return res.status(400).json({
                message: "Invalid or missing availability status",
                success: false,
            });
        }

        // Update doctor availability
        const updatedDoctor = await DoctorModel.findByIdAndUpdate(
            id,
            { availability },
            { new: true }
        );

        if (!updatedDoctor) {
            return res.status(404).json({
                message: "Doctor not found",
                success: false,
            });
        }

        res.status(200).json({
            message: "Doctor availability updated successfully",
            success: true,
            doctor: updatedDoctor,
        });

    } catch (error) {
        console.error("Error in doctor availability:", error);
        res.status(500).json({ message: "Internal Server Error", success: false, error: error.message, });
    }
};
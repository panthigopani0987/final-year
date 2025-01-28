const DoctorModel = require('../models/doctor.model');
const UserModel = require('../models/user.model');
const Appointment = require('../models/appoinment.model');
const bcrypt = require('bcrypt');
const { sendResponse } = require('../services/responseHandler');
const cloudinary = require("cloudinary").v2;

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

//USER 

//get all user
module.exports.getAllUser = async (req, res) => {
    try {
        const user = await UserModel.find({});
        return sendResponse(res, 200, "Users retrieved successfully", user.length, user);
    } catch (error) {
        console.error("Error get all user:", error);
        return sendResponse(res, 500, "Internal Server Error", 0);
    }
}

//get ID by user
module.exports.getUserById = async (req, res) => {
    try {
        const user = await UserModel.findById(req.params.id);
        if (user) {
            return sendResponse(res, 200, "User retrieved successfully", 1, user);
        }
        return sendResponse(res, 404, "User not found", 0);
    } catch (error) {
        console.error("Error get all user:", error);
        return sendResponse(res, 500, "Internal Server Error", 0);
    }
}

//Doctor

//add doctor
module.exports.addDoctor = async (req, res) => {
    try {
        if (req.body !== "") {
            // Email check
            let checkmail = await DoctorModel.findOne({ email: req.body.email });
            if (checkmail) {
                return sendResponse(res, 400, "Email Already Exists", 0);
            }
            if (req.body.password !== "") {
                let pass = await bcrypt.hash(req.body.password, 10);
                req.body.password = pass;
            } else {
                return sendResponse(res, 400, "Password is required", 0);
            }

            let doctorPhotoUrl = '';

            console.log("Uploaded files");

            // Check if doctorPhoto exists in the uploaded files
            if (req.files && req.files.doctorPhoto) {
                const uploadedPhoto = req.files.doctorPhoto[0];

                try {
                    const uploadResult = await cloudinary.uploader.upload(uploadedPhoto.path, {
                        folder: "doctor_photos",
                        resource_type: "image"
                    });
                    doctorPhotoUrl = uploadResult.secure_url; // Store the URL of the uploaded photo
                } catch (error) {
                    console.error("Cloudinary Upload Error (doctorPhoto):", error);
                    return sendResponse(res, 500, "Failed to upload doctor photo", 0);
                }
            }

            req.body.doctorPhoto = doctorPhotoUrl;
            // Create and save new doctor
            const newDoctor = new DoctorModel(parseResponse(req.body));
            const savedDoctor = await newDoctor.save();

            return sendResponse(res, 200, "Your Doctor is Added successfully", 1, savedDoctor);
        } else {
            return sendResponse(res, 400, "Data Not Found", 0);
        }
    } catch (error) {
        console.error("Error adding doctor:", error);
        return sendResponse(res, 500, "Internal Server Error", 0);
    }
};

//get all doctors
module.exports.getAllDoctors = async (req, res) => {
    try {
        const doctors = await DoctorModel.find({});
        return sendResponse(res, 200, "Doctors retrieved successfully", doctors.length, doctors);
    } catch (error) {
        console.error("Error get all Doctors:", error);
        return sendResponse(res, 500, "Internal Server Error", 0);
    }
}

//get ID by doctors
module.exports.getDoctorsById = async (req, res) => {
    try {
        const doctors = await DoctorModel.findById(req.params.id);
        if (doctors) {
            return sendResponse(res, 200, "Doctors retrieved successfully", 1, doctors);
        }
        return sendResponse(res, 404, "Doctors not found", 0);
    } catch (error) {
        console.error("Error get all Doctors:", error);
        return sendResponse(res, 500, "Internal Server Error", 0);
    }
}

//admin dashboard details get
module.exports.adminDashborad = async (req, res) => {
    try {
        const doctors = await DoctorModel.find({});
        const user = await UserModel.find({});

        const dashborad = {
            doctors: doctors.length,
            patients: user.length,
        }
        return sendResponse(res, 200, "Dashboard Data retrieved successfully", dashborad);
    } catch (error) {
        console.error("Error Admin panel:", error);
        return sendResponse(res, 500, "Internal Server Error", 0);
    }
}

//list Appointment
module.exports.listAppointment = async (req, res) => {
    try {
        // Find all appointments for the logged-in user
        const appointments = await Appointment.find({});
        return sendResponse(res, 200, "Appointments retrieved successfully", 1, appointments);
    } catch (error) {
        console.error("Error listing appointments:", error);
        return sendResponse(res, 500, "Internal Server Error", 0);
    }
};

// Cancel appointment (Admin-only access)
module.exports.cancelAppointment = async (req, res) => {
    try {
        // Check if the user is an admin
        if (!req.user || req.user.role !== 'admin') {
            return sendResponse(res, 403, "Access denied. Only admins can cancel appointments.", 0);
        }

        // Validate the appointment exists
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return sendResponse(res, 400, "Appointment not found", 0);
        }

        // Find the doctor associated with the appointment
        const doctorExists = await DoctorModel.findById(appointment.chooseDoctor);
        if (!doctorExists) {
            return sendResponse(res, 400, "Doctor not found", 0);
        }

        let slots_booked = doctorExists.slots_booked;

        // Remove the cancelled slot from the doctor's schedule
        if (slots_booked[appointment.slotDate]) {
            const index = slots_booked[appointment.slotDate].indexOf(appointment.slotTime);
            if (index !== -1) {
                slots_booked[appointment.slotDate].splice(index, 1);
            }
        }

        // Save the updated doctor's slots
        await DoctorModel.findByIdAndUpdate(appointment.chooseDoctor, { slots_booked });

        // Delete the appointment
        await Appointment.findByIdAndDelete(req.params.id);

        return sendResponse(res, 200, "Appointment canceled successfully by admin", 1);
    } catch (error) {
        console.error("Error Cancel Appointment:", error);
        return sendResponse(res, 500, "Internal Server Error", 0);
    }
};

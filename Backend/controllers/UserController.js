require('dotenv').config();
const UserModel = require('../models/user.model');
const DoctorModel = require('../models/doctor.model');
const Appointment = require('../models/appoinment.model');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
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

//register
module.exports.registerUser = async (req, res) => {
    try {
        if (req.body !== "") {
            if (req.body.password !== "" && req.body.password === req.body.confirmPassword) {
                let checkmail = await UserModel.findOne({ email: req.body.email });
                if (checkmail) {
                    return sendResponse(res, 400, "Email Already Exists", 0);
                } else {
                    let pass = await bcrypt.hash(req.body.password, 10);
                    req.body.password = pass;
                    let newUser = new UserModel(req.body);
                    await newUser.save();

                    //email send
                    if (newUser) {
                        const transporter = nodemailer.createTransport({
                            host: "smtp.gmail.com",
                            port: 465,
                            secure: true,
                            auth: {
                                user: process.env.EMAIL_USER,
                                pass: process.env.EMAIL_PASSWORD,
                            },
                        });
                        transporter.verify(function (error, success) {
                            if (error) {
                                console.log("SMTP Connection Error:", error);
                            } else {
                                console.log("SMTP Server is ready to take our messages");
                            }
                        });
                        const info = await transporter.sendMail({
                            from: process.env.EMAIL_USER,
                            to: req.body.email,
                            subject: "Registration Successful ✔",
                            text: `Hello ${req.body.name}`,
                            html: `<p>You've Successfully Registered</p><br><p>You can now log in with your email address.</p>`,
                        });
                        return sendResponse(res, 200, "Admin Registered Successfully", 1, newUser);
                    } else {
                        return sendResponse(res, 400, "Something went wrong", 0);
                    }
                }
            } else {
                return sendResponse(res, 400, "Password and Confirm Password is Not Matched", 0);
            }
        } else {
            return sendResponse(res, 400, "Data Not Found", 0);
        }
    } catch (error) {
        console.error(error.message);
        return sendResponse(res, 500, "Internal Server Error", 0);
    }
}

//login
module.exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return sendResponse(res, 400, "Email and Password are required", 0);
        }
        // Find user by email
        const user = await UserModel.findOne({ email });
        if (!user) {
            return sendResponse(res, 404, "user not found", 0);
        }
        // Compare passwords
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return sendResponse(res, 400, "Invalid Password", 0);
        }
        // Generate JWT token
        try {
            const token = jwt.sign(
                {
                    userData: user,
                    email: user.email,
                    role: 'user'
                },
                process.env.JWT_SECRET,
                { expiresIn: "1d" }
            );
            return res.status(200).json({ message: "user logged in successfully", status: 1, data: token });
        } catch (tokenError) {
            console.error("Error in generating JWT token:", tokenError.message || tokenError);
            return sendResponse(res, 500, "Failed to generate token", 0);
        }
    } catch (error) {
        console.error("Error in user Login:", error);
        return sendResponse(res, 500, "Internal Server Error", 0);
    }
}

//admin login
module.exports.loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const payload = { email, role: 'admin' };
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
            return sendResponse(res, 200, "Admin Registered Successfully", 1, token);
        } else {
            return sendResponse(res, 400, "Email and Password is Not Matched", 0);
        }
    } catch (error) {
        console.error(error.message);
        return sendResponse(res, 500, "Internal Server Error", 0);
    }
};

// Doctor Login
module.exports.loginDoctor = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return sendResponse(res, 400, "Email and Password are required", 0);
        }
        // Find doctor by email
        const doctor = await DoctorModel.findOne({ email });
        if (!doctor) {
            return sendResponse(res, 404, "Doctor not found", 0);
        }
        // Compare passwords
        const isPasswordMatch = await bcrypt.compare(password, doctor.password);
        if (!isPasswordMatch) {
            return sendResponse(res, 400, "Invalid Password", 0);
        }
        // Generate JWT token
        try {
            const token = jwt.sign(
                {
                    userData: doctor,
                    email: doctor.email,
                    role: 'doctor'
                },
                process.env.JWT_SECRET,
                { expiresIn: "1d" }
            );
            return res.status(200).json({ message: "Doctor logged in successfully", status: 1, data: token });
        } catch (tokenError) {
            console.error("Error in generating JWT token:", tokenError.message || tokenError);
            return sendResponse(res, 500, "Failed to generate token", 0);
        }
    } catch (error) {
        console.error("Error in Doctor Login:", error);
        return sendResponse(res, 500, "Internal Server Error", 0);
    }
};

//update profile
module.exports.updateProfile = async (req, res) => {
    try {
        console.log(req.params.id);

        const user = await UserModel.findById(req.params.id);
        if (!user) {
            return sendResponse(res, 404, "User not found", 0);
        }

        let profilePhotoUrl = '';

        // Delete existing profile photo from Cloudinary if it exists
        if (user.profilePhoto) {
            const publicId = user.profilePhoto.split('/').pop().split('.')[0];
            try {
                await cloudinary.uploader.destroy(`profile_photos/${publicId}`);
            } catch (error) {
                console.error("Cloudinary Deletion Error (profilePhoto):", error);
                return sendResponse(res, 500, "Failed to delete existing profile photo", 0);
            }
        }

        console.log("Uploaded files");

        // Check if profilePhoto exists in the uploaded files
        if (req.files && req.files.profilePhoto) {
            const uploadedPhoto = req.files.profilePhoto[0];

            try {
                const uploadResult = await cloudinary.uploader.upload(uploadedPhoto.path, {
                    folder: "profile_photos",
                    resource_type: "image"
                });
                profilePhotoUrl = uploadResult.secure_url;
            } catch (error) {
                console.error("Cloudinary Upload Error (profilePhoto):", error);
                return sendResponse(res, 500, "Failed to upload profile photo", 0);
            }
        }
        req.body.profilePhoto = profilePhotoUrl;

        let pass = await bcrypt.hash(req.body.password, 10);
        req.body.password = pass;

        const updatedprofile = await UserModel.findByIdAndUpdate(
            req.params.id,
            parseResponse(req.body),
            { new: true }
        );

        if (updatedprofile) {
            return sendResponse(res, 200, "Profile updated successfully", 1, updatedprofile);
        }

        return sendResponse(res, 404, "Profile not found", 0);
    } catch (error) {
        console.error("Error updating user profile:", error);
        return sendResponse(res, 500, "Internal Server Error", 0);
    }
};

//appoinment

//book appointment
module.exports.bookAppointment = async (req, res) => {
    try {
        req.body.userId = req.user._id;

        // Validate user existence
        const userExists = await UserModel.findById(req.body.userId);
        if (!userExists) {
            return sendResponse(res, 400, "User not found", 0);
        }

        // Validate doctor existence
        const doctorExists = await DoctorModel.findById(req.body.chooseDoctor);
        if (!doctorExists) {
            return sendResponse(res, 400, "Doctor not found", 0);
        }

        if (doctorExists.availability !== "Available") {
            return res.json({ success: false, message: 'Doctor Not Available' });
        }

        let slots_booked = doctorExists.slots_booked || {}; // Initialize slots_booked as an empty object if undefined

        // checking for slot availability 
        if (slots_booked[req.body.slotDate]) {
            if (slots_booked[req.body.slotDate].includes(req.body.slotTime)) {
                return res.json({ success: false, message: 'Slot Not Available' });
            } else {
                slots_booked[req.body.slotDate].push(req.body.slotTime);
            }
        } else {
            slots_booked[req.body.slotDate] = [req.body.slotTime];
        }

        doctorExists.slots_booked = slots_booked; // Update slots_booked

        const newAppointment = new Appointment(parseResponse(req.body));
        const savedAppointment = await newAppointment.save();

        // Save new slots data in doctorExists
        await doctorExists.save();

        return sendResponse(res, 200, "Appointment booked successfully", 1, savedAppointment);
    } catch (error) {
        console.error("Error Book Apponitment:", error);
        return sendResponse(res, 500, "Internal Server Error", 0);
    }
}

//cancle appointment
module.exports.cancelAppointment = async (req, res) => {
    try {
        req.body.userId = req.user._id;

        // Validate the appointment exists
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return sendResponse(res, 400, "Appointment not found", 0);
        }

        // Check if the appointment belongs to the user
        if (appointment.userId.toString() !== req.body.userId.toString()) {
            return sendResponse(res, 400, "You can only cancel your own appointments", 0);
        }

        // Find the doctor associated with the appointment
        const doctorExists = await DoctorModel.findById(appointment.chooseDoctor);
        if (!doctorExists) {
            return sendResponse(res, 400, "Doctor not found", 0);
        }

        let slots_booked = doctorExists.slots_booked;
        console.log(doctorExists.slots_booked == appointment.slotDate);
        
        // if (slots_booked[appointment.slotDate]) {
        //     const index = slots_booked[appointment.slotDate].indexOf(appointment.slotTime);
        //     if (index !== -1) {
        //         slots_booked[appointment.slotDate][index] = { status: "Cancelled", reason: "User Request" }; // Mark as cancelled with reason
        //     } else {
        //         console.error("Slot time not found for the given date.");
        //     }
        // } else {
        //     console.error("No slots found for the given date.");
        // }

        // // Save the updated doctor's slots
        // await DoctorModel.findByIdAndUpdate(appointment.chooseDoctor, { slots_booked });

        // // Delete the appointment
        // await Appointment.findByIdAndDelete(req.params.id);

        return sendResponse(res, 200, "Appointment canceled successfully", 1);
    } catch (error) {
        console.error("Error Cancel Appointment:", error);
        return sendResponse(res, 500, "Internal Server Error", 0);
    }
};

//list Appointment
module.exports.listAppointment = async (req, res) => {
    try {
        req.body.userId = req.user._id;

        // Find all appointments for the logged-in user
        const appointments = await Appointment.find({ userId: req.body.userId });

        if (appointments.length > 0) {
            return sendResponse(res, 200, "Appointments retrieved successfully", 1, appointments);
        } else {
            return sendResponse(res, 404, "No appointments found", 0);
        }
    } catch (error) {
        console.error("Error listing appointments:", error);
        return sendResponse(res, 500, "Internal Server Error", 0);
    }
};
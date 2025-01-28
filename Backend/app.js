const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const Passport = require('passport');
const session = require("express-session");
const cookieParser = require('cookie-parser');
const db = require('./config/db');
const passportJwt = require('./config/passportConfig');

dotenv.config();
const app = express();

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(
    session({
        name: "JWTSESSION",
        secret: process.env.JWT_SECRET_USER,
        resave: true,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 100,
        },
    })
);
app.use(cors({
    origin:'*',
    credentials:true,
}));
app.use(express.json());
app.use(Passport.initialize());
app.use(Passport.session());
app.use('/',require('./routes/index'));

//server check
app.get("/", (req, res) => {
    res.send("API Is Working");
});

//sevrer code
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port : ${PORT}`);
});
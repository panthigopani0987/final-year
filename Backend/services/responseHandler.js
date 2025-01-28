module.exports.sendResponse = (res, statusCode, message, status, data = null) => {
    const response = {
        message,
        status,
    };
    if (data) response.data = data;

    res.status(statusCode).json(response);
};
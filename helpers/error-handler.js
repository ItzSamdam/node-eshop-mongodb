function errorHandler(err, request, response, next) {
    if (error.name === 'UnauthorizedError') {
        // jwt authentication error
        return response.status(401).json({message: "The user is not authorized"})
    }

    if (error.name === 'ValidationError') {
        //  validation error
        return res.status(401).json({message: error})
    }

    // default to 500 server error
    return response.status(500).json(error);
}

module.exports = errorHandler;
class ApiResponse {
    // Success response
    static success(res, data = null, message = 'Success', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            statusCode,
            message,
            data,
            timestamp: new Date().toISOString()
        });
    }

    // Error response
    static error(res, message = 'Error', statusCode = 400, errors = null) {
        const response = {
            success: false,
            statusCode,
            message,
            timestamp: new Date().toISOString()
        };

        if (errors) response.errors = errors;

        return res.status(statusCode).json(response);
    }

    static handleMongooseError(res, error) {

        if (error.name === 'ValidationError') {
            const errors = [];

            for (let field in error.errors) {
                errors.push({
                    field: field,
                    message: error.errors[field].message
                });
            }

            return res.status(400).json({ errors });
        }

        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            const message = `${field.charAt(0).toUpperCase() + field.slice(1)} is already in use.`;

            return this.error(res, message, 409, [{
                field: field,
                message: message
            }]);
        }


        return res.status(500).json({
            errors: [{
                field: 'server',
                message: error.message || 'Internal server error'
            }]
        });
    }

    static validationError(res, errors = []) {
        return res.status(400).json({
            success: false,
            statusCode:400,
            errors: errors,
            timestamp: new Date().toISOString()
        });
    }

    // 400 Bad Request
    static badRequest(res, message = 'Bad request', errors = null) {
        return this.error(res, message, 400, errors);
    }

    // 401 Unauthorized
    static unauthorized(res, message = 'Unauthorized') {
        return this.error(res, message, 401);
    }

    // 403 Forbidden
    static forbidden(res, message = 'Forbidden') {
        return this.error(res, message, 403);
    }

    // 404 Not Found
    static notFound(res, message = 'Resource not found') {
        return this.error(res, message, 404);
    }

    // 409 Conflict
    static conflict(res, message = 'Conflict') {
        return this.error(res, message, 409);
    }

    // 500 Internal Server Error
    static serverError(res, message = 'Internal server error') {
        return this.error(res, message, 500);
    }
}

export default ApiResponse;
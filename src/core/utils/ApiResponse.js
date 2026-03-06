
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
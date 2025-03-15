class ApiError extends Error {
    constructor(statusCode, message, errors = null) {
        super(message);
        this.name = 'ApiError';
        this.success = false;
        this.statusCode = statusCode;
        this.errors = errors; // Store additional error details

        Error.captureStackTrace(this, this.constructor);
    }
}

export { ApiError };

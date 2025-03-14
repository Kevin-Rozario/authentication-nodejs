class ApiError extends Error {
    constructor(statusCode, message, errorMessage) {
        super();
        this.success = false;
        this.statusCode = statusCode;
        this.message = message;
        this.errorMessage = errorMessage;
    } 
}

export {ApiError}
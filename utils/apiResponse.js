class ApiResponse {
    constructor(statusCode, data, message) {
        this.statusCode = statusCode < 400;
        this.message = message
        this.data = data;
    }
}

export default ApiResponse;
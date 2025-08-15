import ballerina/http;

// Configurable server values
configurable string serverHost = ?;
configurable int serverPort = ?;

public listener http:Listener httpListener = new (serverPort, config = {
    host: serverHost
});

// Initialize database on startup
public function main() returns error? {
    check initDatabase();
}

@http:ServiceConfig {
    cors: {
        allowOrigins: ["http://localhost:5173", "http://localhost:3000", "*"],
        allowCredentials: true,
        allowHeaders: ["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
        allowMethods: ["POST", "OPTIONS", "GET", "PUT", "DELETE"],
        maxAge: 3600
    }
}

service / on httpListener {
    
    // Handle preflight OPTIONS requests at root level
    resource function options .(http:Request request) returns http:Response {
        http:Response response = new;
        response.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
        response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE");
        response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept, Origin, X-Requested-With");
        response.setHeader("Access-Control-Allow-Credentials", "true");
        response.setHeader("Access-Control-Max-Age", "3600");
        response.statusCode = 200;
        return response;
    }

    resource function get health() returns json {
        return {
            status: "UP",
            message: "Backend service is running",
            timestamp: "2024-01-01T00:00:00Z"
        };
    }
}
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
        allowOrigins: ["*"],
        allowCredentials: true,
        allowHeaders: ["Authorization", "Content-Type"],
        allowMethods: ["POST", "OPTIONS", "GET"],
        maxAge: 3600
    }
}

service / on httpListener {
    resource function get health() returns json {
        return {
            status: "UP",
            message: "Backend service is running",
            timestamp: "2024-01-01T00:00:00Z"
        };
    }
}
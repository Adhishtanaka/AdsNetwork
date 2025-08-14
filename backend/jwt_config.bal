import ballerina/jwt;
import ballerina/time;

// Configurable values - no default values to force external configuration
configurable string jwtSecret = ?;
configurable decimal jwtExpiryTime = ?;

// Generate JWT token using built-in JWT library with HMAC algorithm
public function generateJWT(int userId, string username, string email) returns string|error {
    decimal currentTime = <decimal>time:utcNow()[0];
    decimal expiryTime = currentTime + jwtExpiryTime;
    
    jwt:IssuerConfig issuerConfig = {
        username: username,
        issuer: "ballerina-backend",
        audience: ["ballerina-client"],
        expTime: expiryTime,
        customClaims: {
            "userId": userId,
            "username": username,
            "email": email
        },
        signatureConfig: {
            algorithm: jwt:HS256,
            config: jwtSecret
        }
    };
    
    string|error jwtToken = jwt:issue(issuerConfig);
    
    if jwtToken is error {
        return jwtToken;
    }
    
    return jwtToken;
}

// Validate JWT token using built-in JWT library
public function validateJWT(string token) returns JWTPayload|error {
    jwt:ValidatorConfig validatorConfig = {
        issuer: "ballerina-backend",
        audience: "ballerina-client",
        signatureConfig: {
            secret: jwtSecret
        }
    };
    
    jwt:Payload|error validatedPayload = jwt:validate(token, validatorConfig);
    
    if validatedPayload is error {
        return validatedPayload;
    }
    
    // Extract custom claims using member access
    anydata userIdClaim = validatedPayload["userId"];
    anydata usernameClaim = validatedPayload["username"];
    anydata emailClaim = validatedPayload["email"];
    
    // Handle optional fields properly
    string issuer = validatedPayload.iss ?: "ballerina-backend";
    string[]|string audienceValue = validatedPayload.aud ?: ["ballerina-client"];
    string[] audience = audienceValue is string[] ? audienceValue : [audienceValue];
    
    JWTPayload jwtPayload = {
        userId: <int>userIdClaim,
        username: <string>usernameClaim,
        email: <string>emailClaim,
        exp: <int>validatedPayload.exp,
        iat: <int>validatedPayload.iat,
        iss: issuer,
        aud: audience
    };
    
    return jwtPayload;
}

// Extract token from Authorization header
public function extractTokenFromHeader(string? authHeader) returns string|error {
    if authHeader is () {
        return error("Authorization header missing");
    }
    
    if !authHeader.startsWith("Bearer ") {
        return error("Invalid authorization header format");
    }
    
    string token = authHeader.substring(7);
    
    return token;
}
import ballerina/http;
import ballerina/crypto;

public  function authenticateUser(http:Request request) returns int|http:Unauthorized {
    string|http:HeaderNotFoundError authHeaderResult = request.getHeader("Authorization");
    
    string? authHeader = ();
    if authHeaderResult is string {
        authHeader = authHeaderResult;
    }
    
    string|error token = extractTokenFromHeader(authHeader);
    if token is error {
        return <http:Unauthorized>{
            body: {
                message: "Authorization header missing or invalid"
            }
        };
    }

    JWTPayload|error jwtPayload = validateJWT(token);
    if jwtPayload is error {
        return <http:Unauthorized>{
            body: {
                message: "Invalid or expired token"
            }
        };
    }

    return jwtPayload.userId;
}

// Hash password using crypto
public  function hashPassword(string password) returns string|error {
    byte[] hashedBytes = crypto:hashSha256(password.toBytes());
    return hashedBytes.toBase16();
}

// Verify password
public  function verifyPassword(string password, string hashedPassword) returns boolean {
    string|error newHash = hashPassword(password);
    if newHash is error {
        return false;
    }
    return newHash == hashedPassword;
}
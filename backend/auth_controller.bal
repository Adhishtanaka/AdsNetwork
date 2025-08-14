import ballerina/http;

@http:ServiceConfig {
    cors: {
        allowOrigins: ["*"],
        allowCredentials: true,
        allowHeaders: ["Authorization", "Content-Type"],
        allowMethods: ["POST", "OPTIONS", "GET"],
        maxAge: 3600
    }
}

service /auth on httpListener {

    resource function post login(http:Request request) returns json|http:BadRequest|http:Unauthorized|http:InternalServerError {
        json|http:ClientError jsonPayload = request.getJsonPayload();
        
        if jsonPayload is http:ClientError {
            return <http:BadRequest>{
                body: {
                    message: "Invalid JSON payload"
                }
            };
        }

        LoginRequest|error loginReq = jsonPayload.cloneWithType(LoginRequest);

        if loginReq is error {
            return <http:BadRequest>{
                body: {
                    message: "Please provide email and password"
                }
            };
        }

        User|error user = getUserByEmail(loginReq.email);
        if user is error {
            return <http:Unauthorized>{
                body: {
                    message: "Invalid email or password"
                }
            };
        }

        // Verify password
        boolean isValidPassword = verifyPassword(loginReq.password, user.password_hash);
        if !isValidPassword {
            return <http:Unauthorized>{
                body: {
                    message: "Invalid email or password"
                }
            };
        }

        // Handle optional id field properly
        int? optionalId = user.id;
        int userId = optionalId ?: 0;
        string username = user.username;
        string email = user.email;

        string|error jwtToken = generateJWT(userId, username, email);
        
        if jwtToken is error {
            return <http:InternalServerError>{
                body: {
                    message: "Failed to generate token: " + jwtToken.message()
                }
            };
        }

        return {
            message: "Login successful",
            token: jwtToken,
            user: {
                id: userId,
                username: username,
                email: email
            }
        };
    }

    resource function post register(http:Request request) returns json|http:BadRequest|http:InternalServerError {
        json|http:ClientError jsonPayload = request.getJsonPayload();
        
        if jsonPayload is http:ClientError {
            return <http:BadRequest>{
                body: {
                    message: "Invalid JSON payload"
                }
            };
        }

        RegisterRequest|error registerReq = jsonPayload.cloneWithType(RegisterRequest);

        if registerReq is error {
            return <http:BadRequest>{
                body: {
                    message: "Please provide username, email, and password"
                }
            };
        }

        User|error existingUser = getUserByEmail(registerReq.email);
        if existingUser is User {
            return <http:BadRequest>{
                body: {
                    message: "Email already registered"
                }
            };
        }

        string|error hashpass = hashPassword(registerReq.password);
        if hashpass is error {
            return <http:InternalServerError>{
                body: {
                    message: "Failed to hash password"
                }
            };
        }

        int|error userId = createUser(registerReq.username, registerReq.email, hashpass);
        if userId is error {
            return <http:InternalServerError>{
                body: {
                    message: "Failed to create user"
                }
            };
        }

        return {
            message: "User registered successfully",
            userId: userId.toString(),
            user: {
                id: userId,
                username: registerReq.username,
                email: registerReq.email
            }
        };
    }

    resource function get profile(http:Request request) returns UserInfo|http:Unauthorized|http:InternalServerError {
        // Handle header access properly - it returns string|HeaderNotFoundError
        string|http:HeaderNotFoundError authHeaderResult = request.getHeader("Authorization");
        
        string? authHeader = ();
        if authHeaderResult is string {
            authHeader = authHeaderResult;
        }
        
        // Extract token from header
        string|error token = extractTokenFromHeader(authHeader);
        if token is error {
            return <http:Unauthorized>{
                body: {
                    message: "Authorization header missing or invalid"
                }
            };
        }

        // Validate JWT token
        JWTPayload|error jwtPayload = validateJWT(token);
        if jwtPayload is error {
            return <http:Unauthorized>{
                body: {
                    message: "Invalid or expired token"
                }
            };
        }

        User|error user = getUserById(jwtPayload.userId);
        if user is error {
            return <http:InternalServerError>{
                body: {
                    message: "User profile not found"
                }
            };
        }

        int? optionalId = user.id;
        int userId = optionalId ?: 0;

        return {
            id: userId,
            username: user.username,
            email: user.email
        };
    }
}
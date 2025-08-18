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
                    message: "Please provide email, password, and location"
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
                    message: "Please provide username, email, password, location, and phone"
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

        int|error userId = createUser(registerReq.username, registerReq.email, hashpass, registerReq.location, registerReq.phone);
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

    resource function get profile(http:Request request) returns json|http:Unauthorized|http:InternalServerError {
        // Authenticate user
        int|http:Unauthorized userId = authenticateUser(request);
        if userId is http:Unauthorized {
            return userId;
        }

        // Get user details from database
        User|error user = getUserById(userId);
        if user is error {
            return <http:InternalServerError>{
                body: {
                    message: "User profile not found"
                }
            };
        }

        // Parse user location from JSON string
        Location? userLocation = ();
        string? userLocationJson = user.user_location;
        if userLocationJson is string {
            json|error locationJsonData = userLocationJson.fromJsonString();
            if locationJsonData is json {
                Location|error parsedLocation = locationJsonData.cloneWithType(Location);
                if parsedLocation is Location {
                    userLocation = parsedLocation;
                }
            }
        }

        int? optionalId = user.id;
        int userIdValue = optionalId ?: 0;

        return {
                id: userIdValue,
                username: user.username,
                email: user.email,
                location: userLocation,
                whatsappNumber: user.whatsapp_number,
                createdAt: user.created_at,
                updatedAt: user.updated_at
        };
    }
}
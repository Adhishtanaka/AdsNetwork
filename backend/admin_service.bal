import ballerina/http;

// Authenticate and authorize admin user (must have @agrilanka.com email)
public function authenticateAdminUser(http:Request request) returns int|http:Unauthorized|http:Forbidden {
    // First authenticate the user using existing JWT authentication
    int|http:Unauthorized userId = authenticateUser(request);
    if userId is http:Unauthorized {
        return userId;
    }
    
    // Get user details to check email domain
    User|error user = getUserById(userId);
    if user is error {
        return <http:Unauthorized>{
            body: {
                message: "Failed to get user details"
            }
        };
    }
    
    // Check if user email ends with @agrilanka.com
    if !user.email.endsWith("@agrilanka.com") {
        return <http:Forbidden>{
            body: {
                message: "Access denied. Admin access requires @agrilanka.com email domain."
            }
        };
    }
    
    return userId;
}

// Get all users for admin view
public function getAllUsersForAdmin() returns AdminUserInfo[]|error {
    User[]|error users = getAllUsers();
    if users is error {
        return users;
    }
    
    AdminUserInfo[] adminUserInfoList = [];
    
    foreach User user in users {
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
        string? createdAt = user.created_at;
        string createdAtValue = createdAt ?: "";
        string? updatedAt = user.updated_at;
        string updatedAtValue = updatedAt ?: "";
        string? whatsappNumber = user.whatsapp_number;
        string whatsappNumberValue = whatsappNumber ?: "";
        
        AdminUserInfo adminUserInfo = {
            id: userIdValue,
            username: user.username,
            email: user.email,
            location: userLocation,
            whatsappNumber: whatsappNumberValue,
            createdAt: createdAtValue,
            updatedAt: updatedAtValue
        };
        
        adminUserInfoList.push(adminUserInfo);
    }
    
    return adminUserInfoList;
}

// Delete user by ID (admin function)
public function deleteUserById(int userId) returns error? {
    error? deleteResult = deleteUserFromDb(userId);
    return deleteResult;
}

// Delete ad by ID (admin function)
public function deleteAdById(int adId) returns error? {
    error? deleteResult = deleteAdFromDb(adId);
    return deleteResult;
}

// Delete comment by ID (admin function)
public function deleteCommentById(int commentId) returns error? {
    error? deleteResult = deleteCommentFromDb(commentId);
    return deleteResult;
}
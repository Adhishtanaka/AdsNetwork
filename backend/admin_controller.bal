import ballerina/http;

@http:ServiceConfig {
    cors: {
        allowOrigins: ["*"],
        allowCredentials: true,
        allowHeaders: ["Authorization", "Content-Type"],
        allowMethods: ["GET", "DELETE", "OPTIONS"],
        maxAge: 3600
    }
}

service /admin on httpListener {

    // Get all users
    resource function get users(http:Request request) returns json|http:Unauthorized|http:Forbidden|http:InternalServerError {
        // Authenticate and authorize admin user
        int|http:Unauthorized|http:Forbidden adminUserId = authenticateAdminUser(request);
        if adminUserId is http:Unauthorized {
            return adminUserId;
        }
        if adminUserId is http:Forbidden {
            return adminUserId;
        }
        
        // Get all users
        AdminUserInfo[]|error users = getAllUsersForAdmin();
        if users is error {
            return <http:InternalServerError>{
                body: {
                    message: "Failed to retrieve users: " + users.message()
                }
            };
        }
        
        return {
            message: "Users retrieved successfully",
            totalUsers: users.length(),
            users: users
        };
    }

    // Get all ads
    resource function get ads(http:Request request) returns json|http:Unauthorized|http:Forbidden|http:InternalServerError {
        // Authenticate and authorize admin user
        int|http:Unauthorized|http:Forbidden adminUserId = authenticateAdminUser(request);
        if adminUserId is http:Unauthorized {
            return adminUserId;
        }
        if adminUserId is http:Forbidden {
            return adminUserId;
        }
        
        // Get all ads
        AdInfo[]|error ads = getAllAdsList();
        if ads is error {
            return <http:InternalServerError>{
                body: {
                    message: "Failed to retrieve ads: " + ads.message()
                }
            };
        }
        
        return {
            message: "Ads retrieved successfully",
            totalAds: ads.length(),
            ads: ads
        };
    }

    // Get all comments
    resource function get comments(http:Request request) returns json|http:Unauthorized|http:Forbidden|http:InternalServerError {
        // Authenticate and authorize admin user
        int|http:Unauthorized|http:Forbidden adminUserId = authenticateAdminUser(request);
        if adminUserId is http:Unauthorized {
            return adminUserId;
        }
        if adminUserId is http:Forbidden {
            return adminUserId;
        }
        
        // Get all comments
        CommentInfo[]|error comments = getAllCommentsList();
        if comments is error {
            return <http:InternalServerError>{
                body: {
                    message: "Failed to retrieve comments: " + comments.message()
                }
            };
        }
        
        return {
            message: "Comments retrieved successfully",
            totalComments: comments.length(),
            comments: comments
        };
    }

    // Delete a specific user
    resource function delete users/[int userId](http:Request request) returns json|http:Unauthorized|http:Forbidden|http:InternalServerError {
        // Authenticate and authorize admin user
        int|http:Unauthorized|http:Forbidden adminUserId = authenticateAdminUser(request);
        if adminUserId is http:Unauthorized {
            return adminUserId;
        }
        if adminUserId is http:Forbidden {
            return adminUserId;
        }
        
        // Delete the user
        error? deleteResult = deleteUserById(userId);
        if deleteResult is error {
            return <http:InternalServerError>{
                body: {
                    message: "Failed to delete user: " + deleteResult.message()
                }
            };
        }
        
        return {
            message: "User deleted successfully",
            userId: userId.toString()
        };
    }

    // Delete a specific ad
    resource function delete ads/[int adId](http:Request request) returns json|http:Unauthorized|http:Forbidden|http:InternalServerError {
        // Authenticate and authorize admin user
        int|http:Unauthorized|http:Forbidden adminUserId = authenticateAdminUser(request);
        if adminUserId is http:Unauthorized {
            return adminUserId;
        }
        if adminUserId is http:Forbidden {
            return adminUserId;
        }
        
        // Delete the ad
        error? deleteResult = deleteAdById(adId);
        if deleteResult is error {
            return <http:InternalServerError>{
                body: {
                    message: "Failed to delete ad: " + deleteResult.message()
                }
            };
        }
        
        return {
            message: "Ad deleted successfully",
            adId: adId.toString()
        };
    }

    // Delete a specific comment
    resource function delete comments/[int commentId](http:Request request) returns json|http:Unauthorized|http:Forbidden|http:InternalServerError {
        // Authenticate and authorize admin user
        int|http:Unauthorized|http:Forbidden adminUserId = authenticateAdminUser(request);
        if adminUserId is http:Unauthorized {
            return adminUserId;
        }
        if adminUserId is http:Forbidden {
            return adminUserId;
        }
        
        // Delete the comment
        error? deleteResult = deleteCommentById(commentId);
        if deleteResult is error {
            return <http:InternalServerError>{
                body: {
                    message: "Failed to delete comment: " + deleteResult.message()
                }
            };
        }
        
        return {
            message: "Comment deleted successfully",
            commentId: commentId.toString()
        };
    }
}
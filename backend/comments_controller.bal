import ballerina/http;

@http:ServiceConfig {
    cors: {
        allowOrigins: ["*"],
        allowCredentials: true,
        allowHeaders: ["Authorization", "Content-Type"],
        allowMethods: ["POST", "OPTIONS", "GET", "DELETE"],
        maxAge: 3600
    }
}

service /comments on httpListener {

    resource function post .(http:Request request) returns json|http:BadRequest|http:Unauthorized|http:InternalServerError {
        // Authenticate user
        int|http:Unauthorized userId = authenticateUser(request);
        if userId is http:Unauthorized {
            return userId;
        }
        
        // Get user details to extract email
        User|error user = getUserById(userId);
        if user is error {
            return <http:InternalServerError>{
                body: {
                    message: "Failed to get user details"
                }
            };
        }
        
        // Get JSON payload
        json|http:ClientError jsonPayload = request.getJsonPayload();
        if jsonPayload is http:ClientError {
            return <http:BadRequest>{
                body: {
                    message: "Invalid JSON payload"
                }
            };
        }
        
        // Parse the comment request
        CreateCommentRequest|error commentRequest = jsonPayload.cloneWithType(CreateCommentRequest);
        if commentRequest is error {
            return <http:BadRequest>{
                body: {
                    message: "Please provide user_email, ad_id, sentiment, and description"
                }
            };
        }
        
        // Create the comment using authenticated user's email
        int|error commentId = createNewComment(commentRequest, user.email);
        if commentId is error {
            return <http:InternalServerError>{
                body: {
                    message: "Failed to create comment: " + commentId.message()
                }
            };
        }
        
        // Get the created comment details
        CommentInfo|error createdComment = getCommentDetails(commentId);
        if createdComment is error {
            return <http:InternalServerError>{
                body: {
                    message: "Comment created but failed to retrieve details"
                }
            };
        }
        
        return {
            message: "Comment created successfully",
            commentId: commentId.toString(),
            comment: createdComment
        };
    }
    
    resource function get .(http:Request request) returns json|http:InternalServerError {
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
            comments: comments
        };
    }
    
    resource function get [int commentId](http:Request request) returns json|http:BadRequest|http:InternalServerError {
        // Get specific comment by ID
        CommentInfo|error comment = getCommentDetails(commentId);
        if comment is error {
            return <http:InternalServerError>{
                body: {
                    message: "Failed to retrieve comment: " + comment.message()
                }
            };
        }
        
        return {
            message: "Comment retrieved successfully",
            comment: comment
        };
    }
    
    resource function get ad/[int adId](http:Request request) returns json|http:BadRequest|http:InternalServerError {
        // Get all comments for a specific ad
        CommentInfo[]|error comments = getCommentsForAd(adId);
        if comments is error {
            return <http:InternalServerError>{
                body: {
                    message: "Failed to retrieve comments for ad: " + comments.message()
                }
            };
        }
        
        return {
            message: "Comments for ad retrieved successfully",
            adId: adId,
            comments: comments
        };
    }

    resource function delete [int commentId](http:Request request) returns json|http:Unauthorized|http:InternalServerError {
        // Authenticate user
        int|http:Unauthorized userId = authenticateUser(request);
        if userId is http:Unauthorized {
            return userId;
        }
        
        // Get user details to extract email
        User|error user = getUserById(userId);
        if user is error {
            return <http:InternalServerError>{
                body: {
                    message: "Failed to get user details"
                }
            };
        }
        
        // Delete the comment using authenticated user's email
        error? deleteResult = deleteExistingComment(commentId, user.email);
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
// Create a new comment
public function createNewComment(CreateCommentRequest commentRequest, string authenticatedUserEmail) returns int|error {
    // Validate sentiment
    if commentRequest.sentiment != "good" && commentRequest.sentiment != "bad" && commentRequest.sentiment != "neutral" {
        return error("Invalid sentiment. Must be 'good', 'bad', or 'neutral'");
    }

    // Verify that the ad exists
    Ad|error ad = getAdById(commentRequest.ad_id);
    if ad is error {
        return error("Ad not found with ID: " + commentRequest.ad_id.toString());
    }

    // Use authenticated user's email instead of the one in request for security
    int|error commentId = createComment(
        userEmail = authenticatedUserEmail,
        adId = commentRequest.ad_id,
        sentiment = commentRequest.sentiment,
        description = commentRequest.description
    );

    return commentId;
}

// Get comment details by ID
public function getCommentDetails(int commentId) returns CommentInfo|error {
    Comment|error comment = getCommentById(commentId);
    if comment is error {
        return comment;
    }

    int? optionalId = comment.id;
    int commentIdValue = optionalId ?: 0;
    string? optionalDescription = comment.description;
    string descriptionValue = optionalDescription ?: "";
    string? optionalCreatedAt = comment.created_at;
    string createdAtValue = optionalCreatedAt ?: "";

    CommentInfo commentInfo = {
        id: commentIdValue,
        userEmail: comment.user_email,
        adId: comment.ad_id,
        sentiment: comment.sentiment,
        description: descriptionValue,
        createdAt: createdAtValue
    };

    return commentInfo;
}

// Get all comments for a specific ad
public function getCommentsForAd(int adId) returns CommentInfo[]|error {
    Comment[]|error comments = getCommentsByAdId(adId);
    if comments is error {
        return comments;
    }

    CommentInfo[] commentInfoList = [];

    foreach Comment comment in comments {
        int? optionalId = comment.id;
        int commentIdValue = optionalId ?: 0;
        string? optionalDescription = comment.description;
        string descriptionValue = optionalDescription ?: "";
        string? optionalCreatedAt = comment.created_at;
        string createdAtValue = optionalCreatedAt ?: "";

        CommentInfo commentInfo = {
            id: commentIdValue,
            userEmail: comment.user_email,
            adId: comment.ad_id,
            sentiment: comment.sentiment,
            description: descriptionValue,
            createdAt: createdAtValue
        };

        commentInfoList.push(commentInfo);
    }

    return commentInfoList;
}

// Get all comments
public function getAllCommentsList() returns CommentInfo[]|error {
    Comment[]|error comments = getAllComments();
    if comments is error {
        return comments;
    }

    CommentInfo[] commentInfoList = [];

    foreach Comment comment in comments {
        int? optionalId = comment.id;
        int commentIdValue = optionalId ?: 0;
        string? optionalDescription = comment.description;
        string descriptionValue = optionalDescription ?: "";
        string? optionalCreatedAt = comment.created_at;
        string createdAtValue = optionalCreatedAt ?: "";

        CommentInfo commentInfo = {
            id: commentIdValue,
            userEmail: comment.user_email,
            adId: comment.ad_id,
            sentiment: comment.sentiment,
            description: descriptionValue,
            createdAt: createdAtValue
        };

        commentInfoList.push(commentInfo);
    }

    return commentInfoList;
}

public function deleteExistingComment(int commentId, string userEmail) returns error? {
    error? deleteResult = deleteComment(commentId = commentId, userEmail = userEmail);
    return deleteResult;
}
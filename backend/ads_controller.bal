import ballerina/http;

@http:ServiceConfig {
    cors: {
        allowOrigins: ["*"],
        allowCredentials: true,
        allowHeaders: ["Authorization", "Content-Type"],
        allowMethods: ["POST", "OPTIONS", "GET", "PUT", "DELETE"],
        maxAge: 3600
    }
}

service /advertisements on httpListener {

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
        
        // Parse the ad request
        CreateAdRequest|error adRequest = jsonPayload.cloneWithType(CreateAdRequest);
        if adRequest is error {
            return <http:BadRequest>{
                body: {
                    message: "Please provide title, description, price, location, category, userEmail, and photoUrls"
                }
            };
        }
        
        // Create the ad using authenticated user's email
        int|error adId = createNewAd(adRequest, user.email);
        if adId is error {
            return <http:InternalServerError>{
                body: {
                    message: "Failed to create ad: " + adId.message()
                }
            };
        }
        
        // Get the created ad details
        AdInfo|error createdAd = getAdDetails(adId);
        if createdAd is error {
            return <http:InternalServerError>{
                body: {
                    message: "Ad created but failed to retrieve details"
                }
            };
        }
        
        return {
            message: "Ad created successfully",
            adId: adId.toString(),
            ad: createdAd
        };
    }
    
    resource function get .(http:Request request) returns json|http:InternalServerError {
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
            ads: ads
        };
    }
    
    resource function get [int adId](http:Request request) returns json|http:BadRequest|http:InternalServerError {
        // Get specific ad by ID
        AdInfo|error ad = getAdDetails(adId);
        if ad is error {
            return <http:InternalServerError>{
                body: {
                    message: "Failed to retrieve ad: " + ad.message()
                }
            };
        }
        
        return {
            message: "Ad retrieved successfully",
            ad: ad
        };
    }

    resource function get my\-ads(http:Request request) returns json|http:Unauthorized|http:InternalServerError {
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
        
        // Get user's ads
        AdInfo[]|error userAds = getUserAdsList(user.email);
        if userAds is error {
            return <http:InternalServerError>{
                body: {
                    message: "Failed to retrieve user ads: " + userAds.message()
                }
            };
        }
        
        return {
            message: "User ads retrieved successfully",
            userEmail: user.email,
            totalAds: userAds.length(),
            ads: userAds
        };
    }

    resource function put [int adId](http:Request request) returns json|http:BadRequest|http:Unauthorized|http:InternalServerError {
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
        
        // Parse the update request
        UpdateAdRequest|error updateRequest = jsonPayload.cloneWithType(UpdateAdRequest);
        if updateRequest is error {
            return <http:BadRequest>{
                body: {
                    message: "Invalid update request format"
                }
            };
        }
        
        // Update the ad using authenticated user's email
        AdInfo|error updatedAd = updateExistingAd(adId, updateRequest, user.email);
        if updatedAd is error {
            return <http:InternalServerError>{
                body: {
                    message: "Failed to update ad: " + updatedAd.message()
                }
            };
        }
        
        return {
            message: "Ad updated successfully",
            adId: adId.toString(),
            ad: updatedAd
        };
    }

    resource function delete [int adId](http:Request request) returns json|http:Unauthorized|http:InternalServerError {
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
        
        // Delete the ad using authenticated user's email
        error? deleteResult = deleteExistingAd(adId, user.email);
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

    //  resource function post boost(http:Request request) returns json|http:BadRequest|http:Unauthorized|http:InternalServerError {

    //  }
}
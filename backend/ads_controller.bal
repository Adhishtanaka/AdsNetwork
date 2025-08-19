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

    resource function post [int adId]/boost(http:Request request) returns json|http:BadRequest|http:Unauthorized|http:InternalServerError|http:Forbidden {
        // Step 1: Authenticate user using JWT token
        int|http:Unauthorized userId = authenticateUser(request);
        if userId is http:Unauthorized {
            return userId;
        }
        
        // Step 2: Get authenticated user details to extract email from JWT token
        User|error authenticatedUser = getUserById(userId);
        if authenticatedUser is error {
            return <http:InternalServerError>{
                body: {
                    message: "Failed to get authenticated user details"
                }
            };
        }
        
        // Step 3: Retrieve the advertisement details
        AdInfo|error ad = getAdDetails(adId);
        if ad is error {
            return <http:InternalServerError>{
                body: {
                    message: "Failed to retrieve advertisement details: " + ad.message()
                }
            };
        }
        
        // Step 4: Verify that the ad owner email matches the JWT token user email
        if ad.userEmail != authenticatedUser.email {
            return <http:Forbidden>{
                body: {
                    message: "Access denied: Only the advertisement owner can boost this ad",
                    adOwnerEmail: ad.userEmail,
                    authenticatedUserEmail: authenticatedUser.email
                }
            };
        }
        
        // Step 5: Add WhatsApp ad ID to the database
        string adIdString = adId.toString();
        error? addWhatsAppResult = addWhatsAppAdId(adIdString);
        if addWhatsAppResult is error {
            return <http:InternalServerError>{
                body: {
                    message: "Failed to add WhatsApp ad ID: " + addWhatsAppResult.message()
                }
            };
        }
        
        // Step 7: Return success response confirming the boost operation
        return {
            message: "Advertisement boosted successfully",
            adId: adId.toString(),
            adTitle: ad.title,
            boostedBy: authenticatedUser.email,
            ownershipVerified: true,
            whatsAppAdAdded: true
        };
    }

    resource function post boostwhtsappid/[string whatsAppId](http:Request request) returns json|http:BadRequest|http:Unauthorized|http:InternalServerError {
        // Boost the WhatsApp ad
        error? boostResult = boostWhatsAppAd(whatsAppId);
        if boostResult is error {
            return <http:InternalServerError>{
                body: {
                    message: "Failed to boost WhatsApp ad: " + boostResult.message()
                }
            };
        }
        
        return {
            message: "WhatsApp ad boosted successfully",
            whatsAppId: whatsAppId
        };
    }

    resource function get getWhatsAppAdDetails(http:Request request) returns json|http:BadRequest|http:Unauthorized|http:InternalServerError {

        // Get WhatsApp ad details
        WhatsAppAdDetails[]|error whatsAppAdDetails = getWhatsAppAdDetails();
        if whatsAppAdDetails is error {
            return <http:InternalServerError>{
                body: {
                    message: "Failed to retrieve WhatsApp ad details: " + whatsAppAdDetails.message()
                }
            };
        }
        
        return {
            message: "WhatsApp ad details retrieved successfully",
            whatsAppAdDetails: whatsAppAdDetails
        };
    }

    // Updated nearby API endpoint with geohash parameter using dbconfig function
    resource function get nearby/[string geohash](http:Request request) returns json|http:Unauthorized|http:Forbidden|http:InternalServerError {
        // Get ads by geohash prefix using dbconfig function
        Ad[]|error nearbyAds = getAdsByGeohashPrefix(geohash);
        if nearbyAds is error {
            return <http:InternalServerError>{
                body: {
                    message: "Failed to retrieve nearby ads: " + nearbyAds.message()
                }
            };
        }
        
        // Convert Ad records to AdInfo records for consistent response format
        AdInfo[] nearbyAdInfoList = [];
        foreach Ad ad in nearbyAds {
            // Get seller details to fetch phone number
            User|error seller = getUserByEmail(ad.user_email);
            string? sellerPhone = ();
            if seller is User {
                sellerPhone = seller.whatsapp_number;
            }

            Location|error location = parseLocationFromJson(ad.location);
            if location is error {
                continue; // Skip ads with invalid location data
            }

            string[]|error photoUrls = parsePhotoUrlsFromJson(ad.photo_urls);
            if photoUrls is error {
                continue; // Skip ads with invalid photo URL data
            }

            int? optionalId = ad.id;
            int adIdValue = optionalId ?: 0;
            
            // Get comments for this ad
            CommentInfo[]|error comments = getCommentsForAd(adIdValue);
            CommentInfo[]? commentsArray = comments is error ? () : comments;

            string? optionalCategory = ad.category;
            string categoryValue = optionalCategory ?: "";
            string? createdAt = ad.created_at;
            string? dateValue = createdAt;

            AdInfo adInfo = {
                id: adIdValue,
                title: ad.title,
                description: ad.description,
                price: ad.price.toString(),
                location: location,
                category: categoryValue,
                userEmail: ad.user_email,
                sellerPhone: sellerPhone,
                photoUrls: photoUrls,
                date: dateValue,
                comments: commentsArray
            };

            nearbyAdInfoList.push(adInfo);
        }
        
        return {
            message: "Nearby ads retrieved successfully",
            geohash: geohash,
            totalAds: nearbyAdInfoList.length(),
            ads: nearbyAdInfoList
        };
    }
}
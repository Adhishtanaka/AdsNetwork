// Create a new ad
public function createNewAd(CreateAdRequest adRequest, string userEmail) returns int|error {
    // Convert price string to decimal
    decimal|error priceDecimal = decimal:fromString(adRequest.price);
    if priceDecimal is error {
        return error("Invalid price format");
    }

    // Create the ad in database
    int|error adId = createAd(
            title = adRequest.title,
            description = adRequest.description,
            price = priceDecimal,
            location = adRequest.location,
            userEmail = userEmail,
            photoUrls = adRequest.photoUrls,
            category = adRequest.category
    );

    return adId;
}

// Update an existing ad
public function updateExistingAd(int adId, UpdateAdRequest updateRequest, string userEmail) returns AdInfo|error {
    // Update the ad in database
    error? updateResult = updateAd(adId = adId, userEmail = userEmail, updateRequest = updateRequest);
    if updateResult is error {
        return updateResult;
    }

    // Get the updated ad details
    AdInfo|error updatedAd = getAdDetails(adId);
    return updatedAd;
}

// Delete an existing ad
public function deleteExistingAd(int adId, string userEmail) returns error? {
    error? deleteResult = deleteAd(adId = adId, userEmail = userEmail);
    return deleteResult;
}

// Get ad details by ID with comments and seller phone
public function getAdDetails(int adId) returns AdInfo|error {
    Ad|error ad = getAdById(adId);
    if ad is error {
        return ad;
    }

    // Get seller details to fetch phone number
    User|error seller = getUserByEmail(ad.user_email);
    string? sellerPhone = ();
    if seller is User {
        sellerPhone = seller.whatsapp_number;
    }

    // Parse location and photo URLs from JSON strings
    Location|error location = parseLocationFromJson(ad.location);
    if location is error {
        return error("Failed to parse ad location");
    }

    string[]|error photoUrls = parsePhotoUrlsFromJson(ad.photo_urls);
    if photoUrls is error {
        return error("Failed to parse photo URLs");
    }

    // Get comments for this ad
    CommentInfo[]|error comments = getCommentsForAd(adId);
    CommentInfo[]? commentsArray = comments is error ? () : comments;

    int? optionalId = ad.id;
    int adIdValue = optionalId ?: 0;
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

    return adInfo;
}

// Get all ads with comments and seller phone numbers
public function getAllAdsList() returns AdInfo[]|error {
    Ad[]|error ads = getAllAds();
    if ads is error {
        return ads;
    }

    AdInfo[] adInfoList = [];

    foreach Ad ad in ads {
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

        adInfoList.push(adInfo);
    }

    return adInfoList;
}

// Get ads for a specific user with comments and seller phone numbers
public function getUserAdsList(string userEmail) returns AdInfo[]|error {
    Ad[]|error ads = getAdsByUserEmail(userEmail);
    if ads is error {
        return ads;
    }

    AdInfo[] adInfoList = [];

    foreach Ad ad in ads {
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

        adInfoList.push(adInfo);
    }

    return adInfoList;
}

// Helper function to parse location from JSON string
function parseLocationFromJson(string? locationJson) returns Location|error {
    if locationJson is () {
        return error("Location data is missing");
    }

    json|error locationJsonData = locationJson.fromJsonString();
    if locationJsonData is error {
        return error("Invalid location JSON format");
    }

    Location|error location = locationJsonData.cloneWithType(Location);
    return location;
}

// Helper function to parse photo URLs from JSON string
function parsePhotoUrlsFromJson(string? photoUrlsJson) returns string[]|error {
    if photoUrlsJson is () {
        return [];
    }

    json|error photoUrlsJsonData = photoUrlsJson.fromJsonString();
    if photoUrlsJsonData is error {
        return error("Invalid photo URLs JSON format");
    }

    string[]|error photoUrls = photoUrlsJsonData.cloneWithType();
    return photoUrls;
}
import ballerina/sql;
import ballerinax/postgresql;
import ballerinax/postgresql.driver as _;

// Configurable values - no default values to force external configuration
configurable string dbHost = ?;
configurable int dbPort = ?;
configurable string dbName = ?;
configurable string dbUser = ?;
configurable string dbPassword = ?;

// PostgreSQL client with SSL configuration and improved timeout settings
final postgresql:Client dbClient = check new (
    host = dbHost,
    port = dbPort,
    username = dbUser,
    password = dbPassword,
    database = dbName,
    connectionPool = {
        maxOpenConnections: 10,
        maxConnectionLifeTime: 1800,
        minIdleConnections: 1
    },
    options = {
        ssl: {
            mode: "REQUIRE"
        },
        connectTimeout: 30,
        socketTimeout: 60,
        loginTimeout: 30
    }
);

// Database initialization
public function initDatabase() returns error? {
    // Create users table first (parent table)
    sql:ExecutionResult|sql:Error result = dbClient->execute(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            user_location JSONB,
            whatsapp_number VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    if result is sql:Error {
        return result;
    }

    // Create ads table with proper foreign key constraints
    result = dbClient->execute(`
        CREATE TABLE IF NOT EXISTS ads (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            price NUMERIC(15, 2),
            location JSONB,        
            user_email VARCHAR(255) NOT NULL,
            photo_urls JSONB,
            category VARCHAR(255),     
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_ads_user_email 
                FOREIGN KEY (user_email) 
                REFERENCES users(email) 
                ON UPDATE CASCADE 
                ON DELETE CASCADE
        )
    `);
    
    if result is sql:Error {
        return result;
    }

    // Create comments table with proper foreign key constraints
    result = dbClient->execute(`
        CREATE TABLE IF NOT EXISTS comments (
            id SERIAL PRIMARY KEY,
            user_email VARCHAR(255) NOT NULL,
            ad_id INT NOT NULL,
            sentiment VARCHAR(10) CHECK (sentiment IN ('good', 'bad', 'neutral')) NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_comments_user_email 
                FOREIGN KEY (user_email) 
                REFERENCES users(email) 
                ON UPDATE CASCADE 
                ON DELETE CASCADE,
            CONSTRAINT fk_comments_ad_id 
                FOREIGN KEY (ad_id) 
                REFERENCES ads(id) 
                ON UPDATE CASCADE 
                ON DELETE CASCADE
        )
    `);
    
    if result is sql:Error {
        return result;
    }

    // Create whatsapp table with specified columns
    result = dbClient->execute(`
        CREATE TABLE IF NOT EXISTS whatsapp (
            id VARCHAR(255) PRIMARY KEY,
            boosted BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    if result is sql:Error {
        return result;
    }

    // Create indexes for better performance on foreign key columns
    result = dbClient->execute(`
        CREATE INDEX IF NOT EXISTS idx_ads_user_email ON ads(user_email)
    `);
    
    if result is sql:Error {
        return result;
    }

    result = dbClient->execute(`
        CREATE INDEX IF NOT EXISTS idx_comments_user_email ON comments(user_email)
    `);
    
    if result is sql:Error {
        return result;
    }

    result = dbClient->execute(`
        CREATE INDEX IF NOT EXISTS idx_comments_ad_id ON comments(ad_id)
    `);
    
    if result is sql:Error {
        return result;
    }

    // Create additional indexes for better query performance
    result = dbClient->execute(`
        CREATE INDEX IF NOT EXISTS idx_ads_created_at ON ads(created_at DESC)
    `);
    
    if result is sql:Error {
        return result;
    }

    result = dbClient->execute(`
        CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC)
    `);
    
    if result is sql:Error {
        return result;
    }
}

// User operations
public function createUser(string username, string email, string passwordHash, Location location, string phone) returns int|error {
    string locationJson = location.toJsonString();
    
    sql:ExecutionResult result = check dbClient->execute(`
        INSERT INTO users (username, email, password_hash, user_location, whatsapp_number) 
        VALUES (${username}, ${email}, ${passwordHash}, ${locationJson}::jsonb, ${phone})
    `);

    if result.lastInsertId is int {
        return <int>result.lastInsertId;
    }
    return error("Failed to create user");
}

public function getAllUsers() returns User[]|error {
    stream<User, sql:Error?> userStream = dbClient->query(`
        SELECT id, username, email, password_hash, user_location, whatsapp_number, created_at, updated_at 
        FROM users ORDER BY created_at DESC
    `);
    
    User[] users = [];
    check from User user in userStream
        do {
            users.push(user);
        };
    
    return users;
}

public function getUserByEmail(string email) returns User|error {
    User user = check dbClient->queryRow(`
        SELECT id, username, email, password_hash, user_location, whatsapp_number, created_at, updated_at 
        FROM users WHERE email = ${email}
    `);
    return user;
}

public function deleteUserFromDb(int userId) returns error? {
    sql:ExecutionResult result = check dbClient->execute(`
        DELETE FROM users WHERE id = ${userId}
    `);
    
    if result.affectedRowCount == 0 {
        return error("Failed to delete user or user not found");
    }
}

public function getUserById(int userId) returns User|error {
    User user = check dbClient->queryRow(`
        SELECT id, username, email, password_hash, user_location, whatsapp_number, created_at, updated_at 
        FROM users WHERE id = ${userId}
    `);
    return user;
}

// Ad operations
public function createAd(string title, string description, decimal price, Location location, string userEmail, string[] photoUrls, string category) returns int|error {
    string locationJson = location.toJsonString();
    string photoUrlsJson = photoUrls.toJsonString();
    
    sql:ExecutionResult result = check dbClient->execute(`
        INSERT INTO ads (title, description, price, location, user_email, photo_urls, category) 
        VALUES (${title}, ${description}, ${price}, ${locationJson}::jsonb, ${userEmail}, ${photoUrlsJson}::jsonb, ${category})
    `);

    if result.lastInsertId is int {
        return <int>result.lastInsertId;
    }
    return error("Failed to create ad");
}

public function getAdById(int adId) returns Ad|error {
    Ad ad = check dbClient->queryRow(`
        SELECT id, title, description, price, location, user_email, photo_urls, category, created_at, updated_at 
        FROM ads WHERE id = ${adId}
    `);
    return ad;
}

public function getAllAds() returns Ad[]|error {
    stream<Ad, sql:Error?> adStream = dbClient->query(`
        SELECT id, title, description, price, location, user_email, photo_urls, category, created_at, updated_at 
        FROM ads ORDER BY created_at DESC
    `);
    
    Ad[] ads = [];
    check from Ad ad in adStream
        do {
            ads.push(ad);
        };
    
    return ads;
}

public function getAdsByUserEmail(string userEmail) returns Ad[]|error {
    stream<Ad, sql:Error?> adStream = dbClient->query(`
        SELECT id, title, description, price, location, user_email, photo_urls, category, created_at, updated_at 
        FROM ads WHERE user_email = ${userEmail} ORDER BY created_at DESC
    `);
    
    Ad[] ads = [];
    check from Ad ad in adStream
        do {
            ads.push(ad);
        };
    
    return ads;
}

public function deleteAd(int adId, string userEmail) returns error? {
    // First verify the ad exists and belongs to the user
    Ad|error existingAd = getAdById(adId);
    if existingAd is error {
        return error("Ad not found");
    }
    
    if existingAd.user_email != userEmail {
        return error("Unauthorized: You can only delete your own ads");
    }

    sql:ExecutionResult result = check dbClient->execute(`
        DELETE FROM ads WHERE id = ${adId}
    `);
    
    if result.affectedRowCount == 0 {
        return error("Failed to delete ad");
    }
}

public function deleteAdFromDb(int adId) returns error? {
    sql:ExecutionResult result = check dbClient->execute(`
        DELETE FROM ads WHERE id = ${adId}
    `);
    
    if result.affectedRowCount == 0 {
        return error("Failed to delete ad or ad not found");
    }
}

public function updateAd(int adId, string userEmail, UpdateAdRequest updateRequest) returns error? {
    // First verify the ad exists and belongs to the user
    Ad|error existingAd = getAdById(adId);
    if existingAd is error {
        return error("Ad not found");
    }
    
    if existingAd.user_email != userEmail {
        return error("Unauthorized: You can only update your own ads");
    }

    // Build dynamic update query based on provided fields
    string[] updateFields = [];
    sql:ParameterizedQuery updateQuery = `UPDATE ads SET updated_at = CURRENT_TIMESTAMP`;
    
    if updateRequest.title is string {
        string title = updateRequest.title ?: "";
        updateQuery = sql:queryConcat(updateQuery, `, title = ${title}`);
    }
    
    if updateRequest.description is string {
        string description = updateRequest.description ?: "";
        updateQuery = sql:queryConcat(updateQuery, `, description = ${description}`);
    }
    
    if updateRequest.price is string {
        string priceStr = updateRequest.price ?: "";
        decimal|error priceDecimal = decimal:fromString(priceStr);
        if priceDecimal is error {
            return error("Invalid price format");
        }
        updateQuery = sql:queryConcat(updateQuery, `, price = ${priceDecimal}`);
    }
    
    if updateRequest.location is Location {
        Location location = updateRequest.location ?: {name: "", lat: 0.0, lng: 0.0, geohash: ""};
        string locationJson = location.toJsonString();
        updateQuery = sql:queryConcat(updateQuery, `, location = ${locationJson}::jsonb`);
    }
    
    if updateRequest.category is string {
        string category = updateRequest.category ?: "";
        updateQuery = sql:queryConcat(updateQuery, `, category = ${category}`);
    }
    
    if updateRequest.photoUrls is string[] {
        string[] photoUrls = updateRequest.photoUrls ?: [];
        string photoUrlsJson = photoUrls.toJsonString();
        updateQuery = sql:queryConcat(updateQuery, `, photo_urls = ${photoUrlsJson}::jsonb`);
    }
    
    updateQuery = sql:queryConcat(updateQuery, ` WHERE id = ${adId}`);
    
    sql:ExecutionResult result = check dbClient->execute(updateQuery);
    
    if result.affectedRowCount == 0 {
        return error("Failed to update ad");
    }
}


// Comment operations
public function createComment(string userEmail, int adId, string sentiment, string description) returns int|error {
    sql:ExecutionResult result = check dbClient->execute(`
        INSERT INTO comments (user_email, ad_id, sentiment, description) 
        VALUES (${userEmail}, ${adId}, ${sentiment}, ${description})
    `);

    if result.lastInsertId is int {
        return <int>result.lastInsertId;
    }
    return error("Failed to create comment");
}

public function getCommentById(int commentId) returns Comment|error {
    Comment comment = check dbClient->queryRow(`
        SELECT id, user_email, ad_id, sentiment, description, created_at 
        FROM comments WHERE id = ${commentId}
    `);
    return comment;
}

public function getCommentsByAdId(int adId) returns Comment[]|error {
    stream<Comment, sql:Error?> commentStream = dbClient->query(`
        SELECT id, user_email, ad_id, sentiment, description, created_at 
        FROM comments WHERE ad_id = ${adId} ORDER BY created_at DESC
    `);
    
    Comment[] comments = [];
    check from Comment comment in commentStream
        do {
            comments.push(comment);
        };
    
    return comments;
}

public function getAllComments() returns Comment[]|error {
    stream<Comment, sql:Error?> commentStream = dbClient->query(`
        SELECT id, user_email, ad_id, sentiment, description, created_at 
        FROM comments ORDER BY created_at DESC
    `);
    
    Comment[] comments = [];
    check from Comment comment in commentStream
        do {
            comments.push(comment);
        };
    
    return comments;
}

public function deleteComment(int commentId, string userEmail) returns error? {
    // First verify the comment exists and belongs to the user
    Comment|error existingComment = getCommentById(commentId);
    if existingComment is error {
        return error("Comment not found");
    }
    
    if existingComment.user_email != userEmail {
        return error("Unauthorized: You can only delete your own comments");
    }

    sql:ExecutionResult result = check dbClient->execute(`
        DELETE FROM comments WHERE id = ${commentId}
    `);
    
    if result.affectedRowCount == 0 {
        return error("Failed to delete comment");
    }
}

public function deleteCommentFromDb(int commentId) returns error? {
    sql:ExecutionResult result = check dbClient->execute(`
        DELETE FROM comments WHERE id = ${commentId}
    `);
    
    if result.affectedRowCount == 0 {
        return error("Failed to delete comment or comment not found");
    }
}

public function runGeminiGeneratedQuery(string queryString) returns json|error {
    string cleanQuery = queryString.trim();
    if cleanQuery.startsWith("```sql") {
        cleanQuery = cleanQuery.substring(6);
    }
    if cleanQuery.startsWith("```") {
        cleanQuery = cleanQuery.substring(3);
    }
    if cleanQuery.endsWith("```") {
        cleanQuery = cleanQuery.substring(0, cleanQuery.length() - 3);
    }
    cleanQuery = cleanQuery.trim();
    
    // Validate that the query is not empty
    if cleanQuery.length() == 0 {
        return error("Empty SQL query provided");
    }
    
    // Basic security check - only allow SELECT statements
    string upperQuery = cleanQuery.toUpperAscii();
    if !upperQuery.startsWith("SELECT") {
        return error("Only SELECT queries are allowed for security reasons");
    }
    // If it's not a common pattern, return an error with suggestion
    return error("Complex dynamic queries are not supported. Please use predefined query patterns.");
}

// Fixed searchAdsByKeywords function to execute query directly
public function searchAdsByKeywords(string[] keywords) returns json|error {
    if keywords.length() == 0 {
        return [];
    }

    // Build parameterized query for security
    sql:ParameterizedQuery searchQuery = `SELECT id, title, description, price, location, user_email, photo_urls, category, created_at, updated_at FROM ads WHERE `;
    
    // Add first keyword condition
    string firstKeyword = "%" + keywords[0] + "%";
    searchQuery = sql:queryConcat(searchQuery, `(title ILIKE ${firstKeyword} OR description ILIKE ${firstKeyword} OR category ILIKE ${firstKeyword})`);
    
    // Add remaining keywords with OR conditions
    foreach int i in 1 ..< keywords.length() {
        string keyword = "%" + keywords[i] + "%";
        searchQuery = sql:queryConcat(searchQuery, ` OR (title ILIKE ${keyword} OR description ILIKE ${keyword} OR category ILIKE ${keyword})`);
    }
    
    // Add limit and order
    searchQuery = sql:queryConcat(searchQuery, ` ORDER BY created_at DESC LIMIT 20`);

    // Execute the query directly using the database client
    stream<Ad, sql:Error?> adStream = dbClient->query(searchQuery);
    
    Ad[] matchingAds = [];
    check from Ad ad in adStream
        do {
            matchingAds.push(ad);
        };
    
    // Convert to JSON format expected by the chat service
    json[] results = [];
    foreach Ad ad in matchingAds {
        json adJson = {
            "id": ad.id,
            "title": ad.title,
            "description": ad.description,
            "price": ad.price,
            "location": ad.location,
            "user_email": ad.user_email,
            "photo_urls": ad.photo_urls,
            "category": ad.category,
            "created_at": ad.created_at
        };
        results.push(adJson);
    }
    
    return results;
}

public function addWhatsAppAdId(string adId) returns error? {
    sql:ExecutionResult result = check dbClient->execute(`
        INSERT INTO whatsapp (id, boosted, created_at, updated_at) 
        VALUES (${adId}, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (id) 
        DO UPDATE SET updated_at = EXCLUDED.updated_at
    `);

    if result.affectedRowCount == 0 {
        return error("Failed to add WhatsApp ad ID");
    }
}


public function boostWhatsAppAd(string adId) returns error? {
    sql:ExecutionResult result = check dbClient->execute(`
        UPDATE whatsapp SET boosted = TRUE, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ${adId}
    `);
    
    if result.affectedRowCount == 0 {
        return error("Failed to boost WhatsApp ad or ad not found");
    }
}

public function getWhatsAppAdDetails() returns WhatsAppAdDetails[]|error {
    stream<WhatsApp, sql:Error?> whatsAppStream = dbClient->query(`
        SELECT id, boosted, created_at, updated_at 
        FROM whatsapp 
        ORDER BY created_at DESC
    `);

    WhatsAppAdDetails[] whatsAppAdDetailsList = [];
    check from WhatsApp whatsAppRecord in whatsAppStream
        do {
            WhatsAppAdDetails details = {
                whatsAppId: whatsAppRecord.id,
                boosted: whatsAppRecord.boosted,
                whatsAppCreatedAt: whatsAppRecord.created_at,
                whatsAppUpdatedAt: whatsAppRecord.updated_at
            };
            whatsAppAdDetailsList.push(details);
        };
    
    return whatsAppAdDetailsList;
}

// Cleanup function
public function closeDatabase() returns error? {
    return dbClient.close();
}
public type WhatsAppAdDetails record {|
    string whatsAppId;
    boolean boosted;
    string? whatsAppCreatedAt;
    string? whatsAppUpdatedAt;
    AdInfo adDetails;
|};

// WhatsApp record type
public type WhatsApp record {|
    string id;
    boolean boosted;
    string created_at?;
    string updated_at?;
|};

// Location record type
public type Location record {|
    string name;
    decimal lat;
    decimal lng;
    string geohash;
|};

// JWT payload type
public type JWTPayload record {|
    int userId;
    string username;
    string email;
    int exp;
    int iat;
    string iss;
    string[] aud;
|};

// User record type
public type User record {|
    int id?;
    string username;
    string email;
    string password_hash;
    string user_location?;
    string whatsapp_number?;
    string created_at?;
    string updated_at?;
|};

// Ad record type
public type Ad record {|
    int id?;
    string title;
    string description;
    decimal price;
    string location?;
    string user_email;
    string photo_urls?;
    string category?;
    string created_at?;
    string updated_at?;
|};

// Comment record type
public type Comment record {|
    int id?;
    string user_email;
    int ad_id;
    string sentiment;
    string description?;
    string created_at?;
|};

// Request/Response types
public type LoginRequest record {|
    string email;
    string password;
    Location location;
|};

public type RegisterRequest record {|
    string username;
    string email;
    string password;
    Location location;
    string phone;
|};

public type CreateAdRequest record {|
    string title;
    string description;
    string price;
    Location location;
    string category;
    string userEmail;
    string[] photoUrls;
|};

public type UpdateAdRequest record {|
    string? title;
    string? description;
    string? price;
    Location? location;
    string? category;
    string[]? photoUrls;
    string? userEmail;
|};

public type CreateCommentRequest record {|
    int ad_id;
    string sentiment;
    string description;
|};

public type LoginResponse record {|
    string message;
    string token;
    UserInfo user;
|};

public type RegisterResponse record {|
    string message;
    string userId;
    UserInfo user;
|};

public type CreateAdResponse record {|
    string message;
    string adId;
    AdInfo ad;
|};

public type CreateCommentResponse record {|
    string message;
    string commentId;
    CommentInfo comment;
|};

public type UserInfo record {|
    int id;
    string username;
    string email;
|};

// Updated AdInfo record to include seller phone number
public type AdInfo record {|
    int id;
    string title;
    string description;
    string price;
    Location location;
    string category;
    string userEmail;
    string? sellerPhone;
    string[] photoUrls;
    string? date;
    CommentInfo[]? comments;
|};

public type AdminUserInfo record {|
    int id;
    string username;
    string email;
    Location? location;
    string whatsappNumber;
    string createdAt;
    string updatedAt;
|};

public type CommentInfo record {|
    int id;
    string userEmail;
    int adId;
    string sentiment;
    string description;
    string createdAt;
|};

// Chat message type for conversation history
public type ChatMessage record {|
    string role; // "user" or "assistant"
    string content;
    string? timestamp;
|};

// Updated chat request type with conversation history
public type ChatRequest record {|
    string message;
    ChatMessage[]? conversationHistory;
|};

// Chat response type with updated conversation
public type ChatResponse record {|
    string reply;
    string status;
    boolean messageProcessed;
    ChatMessage[] conversationHistory;
|};

// Gemini API response types
public type GeminiResponse record {|
    GeminiCandidate[] candidates;
|};

public type GeminiCandidate record {|
    GeminiContent content;
|};

public type GeminiContent record {|
    GeminiPart[] parts;
|};

public type GeminiPart record {|
    string text;
|};
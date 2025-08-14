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
    string created_at?;
    string updated_at?;
|};

// Request/Response types
public type LoginRequest record {|
    string email;
    string password;
|};

public type RegisterRequest record {|
    string username;
    string email;
    string password;
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

public type UserInfo record {|
    int id;
    string username;
    string email;
|};
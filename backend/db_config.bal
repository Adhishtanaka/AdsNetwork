import ballerina/sql;
import ballerinax/postgresql;
import ballerinax/postgresql.driver as _;

// Configurable values - no default values to force external configuration
configurable string dbHost = ?;
configurable int dbPort = ?;
configurable string dbName = ?;
configurable string dbUser = ?;
configurable string dbPassword = ?;

// PostgreSQL client
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
    }
);

// Database initialization
public  function initDatabase() returns error? {
    // Create users table
    sql:ExecutionResult|sql:Error result = dbClient->execute(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    if result is sql:Error {
        return result;
    }
}

// User operations
public  function createUser(string username, string email, string passwordHash) returns int|error {
    sql:ExecutionResult result = check dbClient->execute(`
        INSERT INTO users (username, email, password_hash) 
        VALUES (${username}, ${email}, ${passwordHash})
    `);
    
    if result.lastInsertId is int {
        return <int>result.lastInsertId;
    }
    return error("Failed to create user");
}

public  function getUserByEmail(string email) returns User|error {
    User user = check dbClient->queryRow(`
        SELECT id, username, email, password_hash, created_at, updated_at 
        FROM users WHERE email = ${email}
    `);
    return user;
}

public  function getUserById(int userId) returns User|error {
    User user = check dbClient->queryRow(`
        SELECT id, username, email, password_hash, created_at, updated_at 
        FROM users WHERE id = ${userId}
    `);
    return user;
}

// Cleanup function
public  function closeDatabase() returns error? {
    return dbClient.close();
}
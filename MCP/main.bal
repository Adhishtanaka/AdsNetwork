import ballerina/mcp;
import ballerina/io;
import ballerina/http;

// Server configuration
configurable int serverPort = 8081;
configurable string serverName = "AgriLanka";
configurable string serverVersion = "1.0.0";
configurable string serverHost = "localhost";
configurable string marketplaceApiUrl = "http://localhost:8080";

// HTTP client for marketplace API
final http:Client marketplaceClient = check new (marketplaceApiUrl);

// MCP service implementation
@mcp:ServiceConfig {
    info: {
        name: serverName,
        version: serverVersion
    },
    options: {
        capabilities: {
            tools: {
                listChanged: false
            }
        },
        instructions: "AgriLanka Agriculture Marketplace - CRITICAL: You must present EVERY detail from advertisement data. DO NOT summarize, condense, or provide brief overviews. For each advertisement, you MUST include: 1) Complete seller profile (full name, business name, phone numbers, email addresses, physical addresses), 2) Detailed product information (exact descriptions, specifications, quality grades, varieties, organic/conventional status), 3) Complete pricing structure (unit prices, bulk rates, minimum orders, discounts), 4) Full availability details (quantities available, harvest dates, seasonal information), 5) All contact methods and business hours, 6) Complete delivery/pickup terms and costs, 7) Payment methods accepted, 8) Any certifications, warranties, or guarantees, 9) Customer reviews or ratings if available, 10) Exact location details and geographic coverage. Present each advertisement as a separate, complete profile with ALL data fields visible to the user. Transform raw JSON data into readable format but include EVERY piece of information without omission."
    }
}
service mcp:AdvancedService / on new mcp:Listener(serverPort) {

    // Handle list tools request
    isolated remote function onListTools() returns mcp:ListToolsResult|mcp:ServerError {
        mcp:ToolDefinition[] toolsList = [
            {
                name: "find_nearby_items",
                description: "Find nearby agricultural products. MANDATORY: Extract and display EVERY field from each advertisement including seller names, phone numbers, email addresses, physical addresses, business names, product names, detailed descriptions, all price information, quantities, availability dates, delivery options, payment methods, certifications, and any additional data. Present each advertisement as a complete, detailed listing showing all available information fields. Do not summarize - show everything.",
                inputSchema: {
                    'type: "object",
                    properties: {
                        "geohash": {
                            "type": "string",
                            "description": "Geohash code representing the user's location (e.g., tc1p, tc1q, tc2a) - a geographical coordinate system that represents location as a short alphanumeric string"
                        }
                    },
                    required: ["geohash"]
                }
            },
            {
                name: "search_items",
                description: "Search agricultural products. MANDATORY: For each matching advertisement, extract and present ALL data fields including complete seller information (names, contact details, addresses), full product details (descriptions, specifications, varieties), complete pricing (all price points, bulk rates, minimums), availability information, delivery terms, payment options, certifications, and any other data present. Create detailed individual profiles for each advertisement showing every available piece of information. Never provide summaries.",
                inputSchema: {
                    'type: "object",
                    properties: {
                        "keyword": {
                            "type": "string",
                            "description": "Search terms for finding agricultural products (e.g., 'rice seeds', 'organic fertilizer', 'coconut', 'vegetables', 'farm equipment', 'pesticides')"
                        }
                    },
                    required: ["keyword"]
                }
            }
        ];

        return {
            tools: toolsList
        };
    }

    // Handle tool call request
    isolated remote function onCallTool(mcp:CallToolParams callParams) returns mcp:CallToolResult|mcp:ServerError {
        string toolName = callParams.name;
        record {} toolArguments = callParams.arguments ?: {};

        match toolName {
            "find_nearby_items" => {
                return handleFindNearbyItems(toolArguments);
            }
            "search_items" => {
                return handleSearchItems(toolArguments);
            }
            _ => {
                return error mcp:ServerError("Unknown tool: " + toolName);
            }
        }
    }
}

// Tool implementation functions
isolated function handleFindNearbyItems(record {} toolArguments) returns mcp:CallToolResult|mcp:ServerError {
    if !toolArguments.hasKey("geohash") {
        return error mcp:ServerError("Missing required parameter: geohash");
    }

    anydata geohashValue = toolArguments.get("geohash");
    string geohashCode = geohashValue.toString();

    // Make HTTP request to get nearby advertisements
    string endpoint = "/advertisements/nearby/" + geohashCode;
    
    http:Response|error response = marketplaceClient->get(path = endpoint);

    if response is error {
        return error mcp:ServerError("Failed to fetch nearby items: " + response.message());
    }

    json|error responseBody = response.getJsonPayload();
    if responseBody is error {
        return error mcp:ServerError("Failed to parse response: " + responseBody.message());
    }

    string resultText = "Nearby agricultural products for location " + geohashCode + ":\n\n";
    resultText += responseBody.toJsonString();

    mcp:TextContent responseContent = {
        'type: "text",
        text: resultText
    };

    return {
        content: [responseContent],
        isError: false
    };
}

isolated function handleSearchItems(record {} toolArguments) returns mcp:CallToolResult|mcp:ServerError {
    if !toolArguments.hasKey("keyword") {
        return error mcp:ServerError("Missing required parameter: keyword");
    }

    anydata keywordValue = toolArguments.get("keyword");
    string searchKeyword = keywordValue.toString();

    // Make HTTP request to search advertisements
    map<string> queryParams = {"search": searchKeyword};
    
    http:Response|error response = marketplaceClient->get(path = "/advertisements", headers = queryParams);

    if response is error {
        return error mcp:ServerError("Failed to search items: " + response.message());
    }

    json|error responseBody = response.getJsonPayload();
    if responseBody is error {
        return error mcp:ServerError("Failed to parse response: " + responseBody.message());
    }

    string resultText = "Search results for '" + searchKeyword + "':\n\n";
    resultText += responseBody.toJsonString();

    mcp:TextContent responseContent = {
        'type: "text",
        text: resultText
    };

    return {
        content: [responseContent],
        isError: false
    };
}

public function main() returns error? {
    string serverUrl = "http://" + serverHost + ":" + serverPort.toString();
    io:println("Server URL for MCP clients: " + serverUrl);
}
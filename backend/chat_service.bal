import ballerina/http;

configurable string geminiApiKey = ?;

final http:Client geminiClient = check new ("https://generativelanguage.googleapis.com");

public function processChatMessageWithHistory(string userMessage, ChatMessage[]? conversationHistory) returns string|error {
    // Step 1: Classify if SQL needed
    string classifyPrompt = "You are a classifier.\nUser message: \"" + userMessage + "\"\n\nDecide:\n" +
        "- If the question is about greetings, casual chat, or unrelated to ads/marketplace → return ONLY \"NO_SQL\".\n" +
        "- If the question is about ads, products, categories, prices, or marketplace info → return ONLY \"SQL_NEEDED\".";

    string|error classifyResp = callGeminiApi(classifyPrompt);
    if classifyResp is error {
        return error("Classification failed: " + classifyResp.message());
    }

    string normalizedClassification = classifyResp.trim().toUpperAscii();

    if normalizedClassification == "NO_SQL" {
        // Casual conversation
        string friendlyPrompt = createChatPromptWithHistory("", userMessage, conversationHistory);
        string|error friendlyResponse = callGeminiApi(friendlyPrompt);
        if friendlyResponse is error {
            return error("Friendly chat failed: " + friendlyResponse.message());
        }
        return friendlyResponse;
    }

    // Step 2: Extract keywords instead of SQL
    string keywordPrompt = "You are a keyword extractor.\n" +
        "User message: \"" + userMessage + "\"\n\n" +
        "Extract 1–2 most relevant keywords that can be used to search in ads (title, description, category, location).\n" +
        "Return ONLY a JSON array of keywords. Example: [\"laptop\", \"colombo\"].";

    string|error keywordResp = callGeminiApi(keywordPrompt);
    if keywordResp is error {
        return error("Keyword extraction failed: " + keywordResp.message());
    }

    // Clean the response to remove markdown code blocks
    string cleanedKeywordResp = cleanJsonResponse(keywordResp);

    // Parse keywords - Fixed the type conversion issue
    string[] keywords = [];
    json|error keywordJson = cleanedKeywordResp.fromJsonString();
    if keywordJson is error {
        return error("Invalid JSON keyword response: " + cleanedKeywordResp);
    }
    
    // Fix: Use cloneWithType with explicit type parameter
    string[]|error kwArray = keywordJson.cloneWithType();
    if kwArray is error {
        return error("Keywords not in array format: " + cleanedKeywordResp + " - Error: " + kwArray.message());
    }
    keywords = kwArray;

    // Step 3: Search DB with LIKE
    json|error queryResults = searchAdsByKeywords(keywords);
    if queryResults is error {
        return error("DB query failed: " + queryResults.message());
    }

    // Step 4: Summarize results with Gemini
    string finalPrompt = "User asked: \"" + userMessage + "\".\n" +
        "Here are query results from the database: " + queryResults.toJsonString() +
        ".\n\nPlease answer in natural language, presenting ads clearly.";

    string|error finalResponse = callGeminiApi(finalPrompt);
    if finalResponse is error {
        return error("Final response generation failed: " + finalResponse.message());
    }

    return finalResponse;
}

// Helper function to clean JSON responses that might be wrapped in markdown code blocks
function cleanJsonResponse(string response) returns string {
    string cleanedResponse = response.trim();
    
    // Remove markdown code blocks if present
    if cleanedResponse.startsWith("```json") {
        cleanedResponse = cleanedResponse.substring(7);
    } else if cleanedResponse.startsWith("```") {
        cleanedResponse = cleanedResponse.substring(3);
    }
    
    if cleanedResponse.endsWith("```") {
        cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length() - 3);
    }
    
    return cleanedResponse.trim();
}

// Create chat prompt with history
function createChatPromptWithHistory(string adsContext, string userMessage, ChatMessage[]? conversationHistory) returns string {
    string prompt = "You are Agriලංකා Assistant, a helpful AI for an agriculture marketplace platform.\n\n";

    if adsContext.length() > 0 {
        prompt += adsContext + "\n\n";
    }

    if conversationHistory is ChatMessage[] && conversationHistory.length() > 0 {
        prompt += "Previous conversation:\n";
        foreach ChatMessage msg in conversationHistory {
            prompt += msg.role + ": " + msg.content + "\n";
        }
        prompt += "\n";
    }

    prompt += "Current user message: \"" + userMessage + "\"\n\n";
    prompt += "Please respond helpfully and naturally. If this is a greeting or casual conversation, respond appropriately without using database information.";

    return prompt;
}

// Gemini API call - Fixed URL construction
function callGeminiApi(string prompt) returns string|error {
    json requestPayload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.7,
            "topK": 40,
            "topP": 0.95,
            "maxOutputTokens": 512
        }
    };

    // Fixed: Use query parameter for API key instead of concatenating to path
    string apiUrl = "/v1beta/models/gemini-2.0-flash:generateContent?key=" + geminiApiKey;
    json|http:ClientError response = geminiClient->post(apiUrl, requestPayload);

    if response is http:ClientError {
        return error("Gemini API call failed: " + response.message());
    }

    return extractTextFromGeminiResponse(response);
}

// Format advertisements as context string
function formatAdsAsContext(AdInfo[] ads) returns string {
    if ads.length() == 0 {
        return "No advertisements are currently available.";
    }
    
    string context = "Available Advertisements:\n\n";
    
    foreach AdInfo ad in ads {
        context += "ID: " + ad.id.toString() + "\nTitle: " + ad.title + "\nDescription: " + ad.description + "\nPrice: $" + ad.price + "\nCategory: " + ad.category + "\nLocation: " + ad.location.name + "\nSeller Email: " + ad.userEmail;
        
        string? sellerPhone = ad.sellerPhone;
        if sellerPhone is string {
            context += "\nSeller Phone: " + sellerPhone;
        }
        
        context += "\n\n";
    }
    
    return context;
}

// Extract text from Gemini API response
function extractTextFromGeminiResponse(json response) returns string|error {
    // Check if response has candidates
    json|error candidatesJson = response.candidates;
    if candidatesJson is error {
        return error("No candidates found in response");
    }
    
    json[]|error candidatesArray = candidatesJson.ensureType();
    if candidatesArray is error {
        return error("Invalid candidates format in response");
    }
    
    if candidatesArray.length() == 0 {
        return error("No content");
    }
    
    json firstCandidate = candidatesArray[0];
    
    // Extract content from first candidate
    json|error contentJson = firstCandidate.content;
    if contentJson is error {
        return error("No content found in candidate");
    }
    
    // Extract parts from content
    json|error partsJson = contentJson.parts;
    if partsJson is error {
        return error("No parts found in content");
    }
    
    json[]|error partsArray = partsJson.ensureType();
    if partsArray is error {
        return error("Invalid parts format in content");
    }
    
    if partsArray.length() == 0 {
        return error("No content");
    }
    
    json firstPart = partsArray[0];
    
    // Extract text from first part
    json|error textJson = firstPart.text;
    if textJson is error {
        return error("No text found in part");
    }
    
    string|error textString = textJson.ensureType();
    if textString is error {
        return error("Invalid text format in part");
    }
    
    return textString;
}
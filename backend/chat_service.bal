import ballerina/http;

// Configurable Gemini API values
configurable string geminiApiKey = ?;

// HTTP client for Gemini API - use base URL only
final http:Client geminiClient = check new ("https://generativelanguage.googleapis.com");

// Process chat message with conversation history
public function processChatMessageWithHistory(string userMessage, ChatMessage[]? conversationHistory) returns string|error {
    // Get all advertisements from database
    AdInfo[]|error ads = getAllAdsList();
    if ads is error {
        return error("Failed to retrieve advertisements: " + ads.message());
    }
    
    // Format advertisements as context
    string adsContext = formatAdsAsContext(ads);
    
    // Create prompt with context, conversation history, and user message
    string prompt = createChatPromptWithHistory(adsContext, userMessage, conversationHistory);
    
    // Call Gemini API
    string|error geminiResponse = callGeminiApi(prompt);
    if geminiResponse is error {
        return error("Failed to get response from Gemini API: " + geminiResponse.message());
    }
    
    return geminiResponse;
}

// Format advertisements as context string
function formatAdsAsContext(AdInfo[] ads) returns string {
    if ads.length() == 0 {
        return "No advertisements are currently available.";
    }
    
    string context = "Available Advertisements:\n\n";
    
    foreach AdInfo ad in ads {
        context += string `ID: ${ad.id}
Title: ${ad.title}
Description: ${ad.description}
Price: $${ad.price}
Category: ${ad.category}
Location: ${ad.location.name}
Seller Email: ${ad.userEmail}`;
        
        string? sellerPhone = ad.sellerPhone;
        if sellerPhone is string {
            context += string `
Seller Phone: ${sellerPhone}`;
        }
        
        context += "\n\n";
    }
    
    return context;
}

// Create chat prompt with context, conversation history, and user message
function createChatPromptWithHistory(string adsContext, string userMessage, ChatMessage[]? conversationHistory) returns string {
    string basePrompt = string `You are an AI assistant for AdsNetwork, a classified ads platform created by TetraNeuron. Our team members are Adhishtanaka Kulasooriya, Kavindu Shehan, Isara Madunika, and Samsudeen Ashad.

IMPORTANT INSTRUCTIONS:
1. ONLY respond to questions related to classified ads, products, services, buying, selling, or marketplace inquiries
2. If asked about anything unrelated to ads/marketplace (like general questions, other topics, personal advice, etc.), politely redirect: "I'm here to help you find ads and products on AdsNetwork. What can I help you find today?"
3. When showing ad information to users, DO NOT mention or display the ad ID numbers
4. For each relevant ad, provide a clickable link using this format: <a href="/browse-ads/{ad_id}" target="_blank" style="color: #22c55e; font-weight: bold; text-decoration: underline;">🔗 View Ad</a>
5. Keep responses concise and focused on helping users find what they're looking for
6. Always be helpful and professional when discussing our available ads and services
7. Remember previous conversation context to provide coherent multi-turn responses
8. Reference previous messages when relevant to maintain conversation flow

${adsContext}`;

    // Add conversation history if available
    if conversationHistory is ChatMessage[] {
        basePrompt += "\n\nConversation History:\n";
        foreach ChatMessage msg in conversationHistory {
            string role = msg.role == "user" ? "User" : "Assistant";
            basePrompt += string `${role}: ${msg.content}\n`;
        }
        basePrompt += "\n";
    }

    basePrompt += string `Current User Question: ${userMessage}

Please provide a helpful response based only on marketplace-related queries. Consider the conversation history to maintain context and provide coherent responses. If the question is about available products, categories, or locations, reference the relevant ads with clickable links. If no relevant ads are found, politely inform the user and suggest they check back later or post their own ad. Remember to exclude ad IDs from user-facing information and include clickable links for each recommended ad.`;

    return basePrompt;
}

// Call Gemini API
function callGeminiApi(string prompt) returns string|error {
    // Create request payload for Gemini API
    json requestPayload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt
                    }
                ]
            }
        ]
    };
    
    // Make API call to Gemini with correct endpoint and API key
    http:Response|error response = geminiClient->post(string `/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, requestPayload);
    
    if response is error {
        return error("Failed to call Gemini API: " + response.message());
    }
    
    // Check response status
    if response.statusCode != 200 {
        json|error errorPayload = response.getJsonPayload();
        string errorMessage = "HTTP " + response.statusCode.toString();
        if errorPayload is json {
            errorMessage += ": " + errorPayload.toString();
        }
        return error("Gemini API error: " + errorMessage);
    }
    
    // Get response payload
    json|error responsePayload = response.getJsonPayload();
    if responsePayload is error {
        return error("Failed to parse Gemini API response: " + responsePayload.message());
    }
    
    
    // Extract text from Gemini response
    string|error extractedText = extractTextFromGeminiResponse(responsePayload);
    if extractedText is error {
        return error("Failed to extract text from Gemini response: " + extractedText.message());
    }
    
    return extractedText;
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
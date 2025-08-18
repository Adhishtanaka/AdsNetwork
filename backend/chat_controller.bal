import ballerina/http;
import ballerina/time;

@http:ServiceConfig {
    cors: {
        allowOrigins: ["*"],
        allowHeaders: ["Content-Type"],
        allowMethods: ["POST", "OPTIONS", "GET"],
        maxAge: 3600
    }
}

service /chat on httpListener {

   resource function post .(http:Request request) returns json|http:BadRequest|http:InternalServerError {
        
        json|http:ClientError jsonPayload = request.getJsonPayload();
        if jsonPayload is http:ClientError {
            return <http:BadRequest>{
                body: {
                    message: "Request contains invalid JSON format. Please ensure your request body is properly formatted JSON.",
                    errorCode: "INVALID_JSON_FORMAT",
                    suggestion: "Verify that your JSON structure is valid and all quotes are properly escaped"
                }
            };
        }

        ChatRequest|error chatRequest = jsonPayload.cloneWithType(ChatRequest);
        if chatRequest is error {
            return <http:BadRequest>{
                body: {
                    message: "Request is missing required fields or contains invalid data structure.",
                    errorCode: "INVALID_REQUEST_STRUCTURE",
                    requiredFields: ["message"],
                    optionalFields: ["conversationHistory"],
                    suggestion: "Ensure your request includes a 'message' field with a valid string value"
                }
            };
        }
        
        // Log conversation history if present
        ChatMessage[]? conversationHistory = chatRequest.conversationHistory;
        
        time:Utc currentTime = time:utcNow();
        string timestamp = time:utcToString(currentTime);
        
        string|error chatResponse = processChatMessageWithHistory(chatRequest.message, chatRequest.conversationHistory);
        if chatResponse is error {
            return <http:InternalServerError>{
                body: {
                    message: "We encountered an issue while processing your message. Our team has been notified.",
                    errorCode: "CHAT_PROCESSING_ERROR",
                    suggestion: "Please try again in a moment. If the issue persists, consider rephrasing your message.",
                    supportInfo: "Contact support if this error continues to occur",
                    debugInfo: chatResponse.message()
                }
            };
        }
        
        ChatMessage[] updatedHistory = [];
        
        // Add previous conversation history if provided
        if conversationHistory is ChatMessage[] {
            foreach ChatMessage msg in conversationHistory {
                updatedHistory.push(msg);
            }
        }
        
        // Add current user message
        ChatMessage userMessage = {
            role: "user",
            content: chatRequest.message,
            timestamp: timestamp
        };
        updatedHistory.push(userMessage);
        
        // Add assistant response
        ChatMessage assistantMessage = {
            role: "assistant",
            content: chatResponse,
            timestamp: timestamp
        };
        updatedHistory.push(assistantMessage);
        
        return {
            reply: chatResponse,
            status: "success",
            messageProcessed: true,
            conversationHistory: updatedHistory
        };
    }
}
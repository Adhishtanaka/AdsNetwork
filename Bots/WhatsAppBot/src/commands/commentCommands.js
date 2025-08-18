// src/commands/commentCommands.js

const { ensureAuth, formatCommentDetails } = require('../utils/helpers');

/**
 * Handles the `!add_comment` command.
 * Allows an authenticated user to add a comment to an advertisement.
 * @param {string} whatsappId - The WhatsApp ID of the user.
 * @param {string[]} args - Command arguments: [adId, sentiment, description].
 * @param {object} sessionManager - The `userSessions` object.
 * @param {object} adsService - The `AdsNetworkService` instance.
 * @param {function(string): Promise<void>} replyCallback - Function to send a reply message.
 */
const handleAddComment = async (whatsappId, args, sessionManager, adsService, replyCallback) => {
    const session = sessionManager.getSession(whatsappId);
    if (!(await ensureAuth(session, replyCallback))) return;

    if (args.length < 3) {
        await replyCallback('Usage: `!add_comment <adId> <sentiment> <description>`\n_Sentiment must be: good, bad, or neutral. Description replaces spaces with underscores._');
        return;
    }
    const [adId_comment, sentiment_comment, ...desc_comment_parts] = args;
    const desc_comment = desc_comment_parts.join(' ').replace(/_/g, ' ');

    const parsedAdId = parseInt(adId_comment);
    if (isNaN(parsedAdId)) {
        await replyCallback('Invalid Ad ID. Please provide a number.');
        return;
    }

    const validSentiments = ['good', 'bad', 'neutral'];
    if (!validSentiments.includes(sentiment_comment.toLowerCase())) {
        await replyCallback(`Invalid sentiment: ${sentiment_comment}. Must be one of: ${validSentiments.join(', ')}.`);
        return;
    }

    const commentData = {
        ad_id: parsedAdId,
        sentiment: sentiment_comment.toLowerCase(),
        description: desc_comment
    };

    try {
        const response = await adsService.addCommentToAdvertisement(commentData, session.jwtToken);
        
        // Handle different possible response formats
        let newComment;
        if (response && (response.id || response._id)) {
            newComment = response;
        } else if (response && response.data) {
            newComment = response.data;
        } else if (response && response.comment) {
            newComment = response.comment;
        } else {
            console.error('[ERROR] Unexpected API response format:', response);
            await replyCallback(`Comment was submitted but received unexpected response format.`);
            return;
        }
        
        await replyCallback(`Comment for Ad ${newComment.ad_id} created successfully (ID: ${newComment.id || newComment._id}).`);
    } catch (error) {
        console.error('[ERROR] handleAddComment:', error);
        await replyCallback(`Failed to add comment: ${error.message}`);
    }
};

/**
 * Handles the `!view_comments` command.
 * Retrieves and displays comments for a specific advertisement.
 * @param {string[]} args - Command arguments: [adId].
 * @param {object} adsService - The `AdsNetworkService` instance.
 * @param {function(string): Promise<void>} replyCallback - Function to send a reply message.
 */
const handleViewComments = async (args, adsService, replyCallback) => {
    if (args.length < 1) {
        await replyCallback('Usage: `!view_comments <adId>`');
        return;
    }
    const adId_comments_view = args[0];
    try {
        const response = await adsService.getCommentsForAdvertisement(adId_comments_view);
        
        // Handle different possible response formats
        let comments;
        if (Array.isArray(response)) {
            comments = response;
        } else if (response && Array.isArray(response.data)) {
            comments = response.data;
        } else if (response && Array.isArray(response.comments)) {
            comments = response.comments;
        } else {
            console.error('[ERROR] Unexpected API response format:', response);
            await replyCallback(`Unexpected API response format for comments on Ad ID: ${adId_comments_view}`);
            return;
        }
        
        if (!comments || comments.length === 0) {
            await replyCallback(`No comments found for Ad ID ${adId_comments_view}.`);
        } else {
            let reply = `*Comments for Ad ID ${adId_comments_view}:*\n\n`;
            comments.forEach(c => {
                reply += `${formatCommentDetails(c)}\n\n---\n\n`;
            });
            await replyCallback(reply);
        }
    } catch (error) {
        console.error('[ERROR] handleViewComments:', error);
        await replyCallback(`Failed to retrieve comments: ${error.message}`);
    }
};

/**
 * Handles the `!all_comments` command.
 * Retrieves and displays all comments across all advertisements.
 * @param {object} adsService - The `AdsNetworkService` instance.
 * @param {function(string): Promise<void>} replyCallback - Function to send a reply message.
 */
const handleAllComments = async (adsService, replyCallback) => {
    try {
        const response = await adsService.getAllComments();
        
        // Handle different possible response formats
        let allComments;
        if (Array.isArray(response)) {
            allComments = response;
        } else if (response && Array.isArray(response.data)) {
            allComments = response.data;
        } else if (response && Array.isArray(response.comments)) {
            allComments = response.comments;
        } else {
            console.error('[ERROR] Unexpected API response format:', response);
            await replyCallback(`Unexpected API response format. Expected array of comments.`);
            return;
        }
        
        if (!allComments || allComments.length === 0) {
            await replyCallback('No comments available yet.');
        } else {
            let reply = '*All Comments:*\n\n';
            allComments.forEach(comment => {
                reply += `*Ad ID:* ${comment.ad_id}\n${formatCommentDetails(comment)}\n\n---\n\n`;
            });
            await replyCallback(reply);
        }
    } catch (error) {
        console.error('[ERROR] handleAllComments:', error);
        await replyCallback(`Failed to retrieve all comments: ${error.message}`);
    }
};

module.exports = {
    handleAddComment,
    handleViewComments,
    handleAllComments,
};
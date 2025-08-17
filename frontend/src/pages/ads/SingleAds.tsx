import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Comment, Ad, SentimentType, CreateCommentRequest } from "../../constants/types"
import { apiService } from "../../services/api";
import { useNavigate, useParams } from 'react-router';

export default function SingleAdPage() {
  const [ad, setAd] = useState<Ad | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [selectedSentiment, setSelectedSentiment] = useState<SentimentType>('neutral');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) {
      navigate(-1);
    }
  }, [id, navigate]);

  // Get current user email from JWT token
  useEffect(() => {
    const getCurrentUserEmail = () => {
      try {
        const token = localStorage.getItem('jwt');
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setCurrentUserEmail(payload.email || "");
        }
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    };

    getCurrentUserEmail();
  }, []);

  const fetchAds = async () => {
    try {
      const response = await apiService.getAdvertisement(id);
      setAd(response.data.ad);
      setComments(response.data.ad.comments)
    } catch (error) {
      console.error("Error fetching ads:", error);
      setAd(null);
      setComments([])
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  if (!ad) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-100">
        <div className="animate-pulse text-gray-400">Loading ad...</div>
      </div>
    );
  }

  const formatPrice = (price: string) => {
    return `LKR ${parseInt(price).toLocaleString()}`;
  };

  const handleAddComment = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newComment.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);

    try {
      const commentRequest: CreateCommentRequest = {
        ad_id: parseInt(id!),
        sentiment: selectedSentiment,
        description: newComment.trim()
      };

      // Make API call to create comment
      await apiService.createComment(commentRequest);
      setNewComment("");
      setSelectedSentiment('neutral');
      await fetchAds();

    } catch (error) {
      console.error("Error creating comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!commentId || deletingCommentId === commentId) return;

    setDeletingCommentId(commentId);

    try {
      await apiService.deleteComment(String(commentId));
      await fetchAds();
    } catch (error) {
      console.error("Error deleting comment:", error);
    } finally {
      setDeletingCommentId(null);
    }
  };

  const canDeleteComment = (comment: Comment) => {
    return currentUserEmail && comment.userEmail === currentUserEmail;
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % ad.photoUrls.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + ad.photoUrls.length) % ad.photoUrls.length);
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  const getUsernameFromEmail = (email: string) => {
    return email.split('@')[0];
  };

  const getSentimentIcon = (sentiment: SentimentType) => {
    switch (sentiment) {
      case 'good':
        return '👍';
      case 'bad':
        return '👎';
      case 'neutral':
        return '😐';
      default:
        return '😐';
    }
  };

  const getSentimentColor = (sentiment: SentimentType) => {
    switch (sentiment) {
      case 'good':
        return 'text-green-400';
      case 'bad':
        return 'text-red-400';
      case 'neutral':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Navbar />
      <div className="max-w-6xl mx-auto py-4 px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-100">{ad.title}</h1>
              <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                <span className="inline-flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {ad.location.name}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-gray-700 text-xs text-gray-300">
                  {ad.category}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="text-center md:text-right">
              <div className="text-2xl md:text-3xl font-extrabold text-gray-200">
                {formatPrice(ad.price)}
              </div>
            </div>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Gallery */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl overflow-hidden border border-gray-700 shadow-lg">
              {/* Main image */}
              <div className="relative h-96 md:h-[420px] bg-black">
                <img
                  src={ad.photoUrls[currentImageIndex] || "https://via.placeholder.com/900x600?text=No+Image"}
                  alt={`${ad.title} - Photo ${currentImageIndex + 1}`}
                  onError={(e) => {
                    e.currentTarget.src = "https://via.placeholder.com/900x600?text=No+Image";
                  }}
                  className="w-full h-full object-cover"
                />

                {/* Navigation arrows */}
                {ad.photoUrls.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 text-white transition-all"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 text-white transition-all"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                {/* Image counter */}
                <div className="absolute top-4 right-4 bg-black bg-opacity-60 px-3 py-1 rounded-full text-white text-sm">
                  {currentImageIndex + 1} / {ad.photoUrls.length}
                </div>

                {/* Dots indicator */}
                {ad.photoUrls.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {ad.photoUrls.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToImage(index)}
                        className={`w-2 h-2 rounded-full transition-all ${index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                          }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {ad.photoUrls.length > 1 && (
                <div className="p-3 bg-gray-900 border-t border-gray-800">
                  <div className="grid grid-cols-4 gap-3">
                    {ad.photoUrls.map((photo, index) => (
                      <button
                        key={index}
                        onClick={() => goToImage(index)}
                        className={`rounded-lg overflow-hidden border-2 hover:scale-105 transform transition-all ${index === currentImageIndex ? 'border-gray-500' : 'border-gray-700'
                          }`}
                      >
                        <img
                          src={photo}
                          alt={`Thumbnail ${index + 1}`}
                          onError={(e) => {
                            e.currentTarget.src = "https://via.placeholder.com/400x300?text=No+Image";
                          }}
                          className="w-full h-20 object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Description card */}
            <div className="mt-6 bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50 shadow-sm">
              <h2 className="text-lg font-semibold text-white mb-3">Description</h2>
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">{ad.description}</p>

              <div className="mt-4 flex items-center gap-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-700 text-sm text-gray-300">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {ad.category}
                </div>

                <div className="text-sm text-gray-400">{comments.length} comments</div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Seller card */}
            <div className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm text-gray-400">Seller</div>
                  <div className="text-gray-100 font-semibold">
                    {getUsernameFromEmail(ad.userEmail)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {ad.userEmail}
                  </div>
                </div>
                <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-lg font-semibold text-gray-300">
                    {getUsernameFromEmail(ad.userEmail).charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  className="flex-1 px-3 py-2 rounded-xl bg-gray-600 hover:bg-gray-700 text-sm font-medium text-white transition-colors"
                  onClick={() => {
                    const phoneNumber = ad.sellerPhone;
                    const whatsappURL = `https://wa.me/${phoneNumber}`;
                    window.open(whatsappURL, '_blank');
                  }}
                >
                  Message
                </button>
              </div>
            </div>

            {/* Details card */}
            <div className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50 shadow-sm">
              <h3 className="text-lg font-semibold text-white mb-3">Details</h3>
              <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
  <span className="text-gray-400">Price per kg</span>
  <span className="text-gray-200 font-semibold">{formatPrice(ad.price)}</span>
</div>

                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Location</span>
                  <span className="text-gray-200">{ad.location.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Category</span>
                  <span className="text-gray-200">{ad.category}</span>
                </div>
                {ad.date && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Posted</span>
                    <span className="text-gray-200">
                      {new Date(ad.date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Photos</span>
                  <span className="text-gray-200">{ad.photoUrls.length}</span>
                </div>
              </div>
            </div>

            {/* Map preview */}
            <div className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50 shadow-sm flex flex-col">
              <h3 className="text-lg font-semibold text-white mb-3">Location</h3>
              <div className="bg-gray-700 rounded-lg flex-1 overflow-hidden">
                <MapContainer
                  center={[ad.location.lat, ad.location.lng]}
                  zoom={13}
                  className="w-full h-full"
                  style={{ minHeight: "200px" }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[ad.location.lat, ad.location.lng]}>
                    <Popup>{ad.location.name}</Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>
          </aside>
        </div>

        {/* Enhanced Comments Section */}
        <div className="bg-gray-800/50 rounded-2xl my-4 p-5 border border-gray-700/50 shadow-sm">
          <h3 className="text-lg font-semibold text-white mb-3">
            Comments ({comments.length})
          </h3>

          {/* Comment Form with Sentiment Selection */}
          <form onSubmit={handleAddComment} className="mb-6 space-y-3">
            {/* Sentiment Selection */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400 mr-2">How do you feel about this ad?</span>
              <div className="flex gap-2">
                {(['good', 'neutral', 'bad'] as SentimentType[]).map((sentiment) => (
                  <button
                    key={sentiment}
                    type="button"
                    onClick={() => setSelectedSentiment(sentiment)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${selectedSentiment === sentiment
                      ? sentiment === 'good'
                        ? 'bg-green-600 text-white'
                        : sentiment === 'bad'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                  >
                    <span className="mr-1">{getSentimentIcon(sentiment)}</span>
                    {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Comment Input */}
            <div className="flex gap-2">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write your comment..."
                disabled={isSubmittingComment}
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gray-600 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isSubmittingComment || !newComment.trim()}
                className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingComment ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                    Sending
                  </div>
                ) : (
                  'Send'
                )}
              </button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
            {comments.length > 0 ? (
              comments.map((comment) => {
                console.log(comment);
                return (
                  <div key={comment.id} className="bg-gray-900/70 p-3 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-gray-100">{comment.userEmail}</div>
                        {comment.sentiment && (
                          <span className={`text-lg ${getSentimentColor(comment.sentiment as SentimentType)}`}>
                            {getSentimentIcon(comment.sentiment as SentimentType)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </div>
                        {/* Delete button - only show for comment owner */}
                        {canDeleteComment(comment) && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            disabled={deletingCommentId === comment.id}
                            className="p-1 rounded-md text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete comment"
                          >
                            {deletingCommentId === comment.id ? (
                              <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm">{comment.description}</p>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-gray-500 py-4">
                No comments yet. Be the first to comment!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
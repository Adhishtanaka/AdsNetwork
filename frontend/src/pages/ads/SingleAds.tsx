import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type {Comment,Ad} from "../../constants/types"

export default function SingleAdPage() {
  const [ad, setAd] = useState<Ad | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    // Mock fetch using your data structure
    const mockAd: Ad = {
      title: "Japan Badu",
      description: "asdfghjk - This is a great product in excellent condition. Perfect for daily use and comes with original accessories.",
      price: "1200000",
      location: {
        name: "Colombo",
        lat: 7.253391265869141,
        lng: 80.34537506103516,
        geohash: "tc31k23wn"
      },
      category: "Electronics & Technology",
      userEmail: "seller@example.com",
      photoUrls: [
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1400&q=80",
        "https://images.unsplash.com/photo-1518773553398-650c184e0bb3?auto=format&fit=crop&w=1400&q=80",
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1400&q=80"
      ],
      date: "2025-08-15",
      comments: [
        { id: "c1", user: "buyer1", text: "Is this still available?", date: "2025-08-14" },
        { id: "c2", user: "interested_buyer", text: "What's the condition like?", date: "2025-08-15" }
      ]
    };

    setAd(mockAd);
    setComments(mockAd.comments || []);
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

  const handleAddComment = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newComment.trim()) return;
    
    const comment: Comment = {
      id: `c_${Date.now()}`,
      user: "You",
      text: newComment.trim(),
      date: new Date().toISOString().slice(0, 10)
    };
    setComments(prev => [comment, ...prev]);
    setNewComment("");
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

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
           <Navbar/>
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
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
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
                        className={`rounded-lg overflow-hidden border-2 hover:scale-105 transform transition-all ${
                          index === currentImageIndex ? 'border-gray-500' : 'border-gray-700'
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
                <button className="flex-1 px-3 py-2 rounded-xl bg-gray-600 hover:bg-gray-700 text-sm font-medium text-white transition-colors">
                  Message
                </button>
              </div>
            </div>

            {/* Details card */}
            <div className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50 shadow-sm">
              <h3 className="text-lg font-semibold text-white mb-3">Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Price</span>
                  <span className="text-gray-200 font-semibold">{formatPrice(ad.price)}</span>
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

            {/* Map preview (placeholder) */}
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

             {/* Comments */}
            <div className="bg-gray-800/50 rounded-2xl my-4 p-5 border border-gray-700/50 shadow-sm">
              <h3 className="text-lg font-semibold text-white mb-3">
                Comments ({comments.length})
              </h3>

              <form onSubmit={handleAddComment} className="flex gap-2 mb-4">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gray-600"
                />
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white transition-colors"
                >
                  Send
                </button>
              </form>
             
              <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="bg-gray-900/70 p-3 rounded-lg border border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold text-gray-100">{comment.user}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(comment.date).toLocaleDateString()}
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm">{comment.text}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    No comments yet. Be the first to comment!
                  </div>
                )}
              </div>
            </div></div>
    </div>
  );
}
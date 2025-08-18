import { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  MegaphoneIcon,
  ChatBubbleLeftRightIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  PhoneIcon,
  CalendarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { apiService } from '../../services/api';
import Footer from '../../components/Footer';
import Navbar from '../../components/Navbar';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [adminProfile, setAdminProfile] = useState(null);
  const [users, setUsers] = useState([]);
  const [ads, setAds] = useState([]);
  const [comments, setComments] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalAds: 0, totalComments: 0 });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: '', id: null, name: '' });
  const [selectedAd, setSelectedAd] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profileRes, usersRes, adsRes, commentsRes] = await Promise.all([
        apiService.getProfile(),
        apiService.getAllUsersAdmin(),
        apiService.getAllAdsAdmin(),
        apiService.getAllCommentsAdmin()
      ]);

      if (profileRes.success) setAdminProfile(profileRes.data);
      if (usersRes.success) {
        setUsers(usersRes.data.users);
        setStats(prev => ({ ...prev, totalUsers: usersRes.data.totalUsers }));
      }
      if (adsRes.success) {
        setAds(adsRes.data.ads);
        setStats(prev => ({ ...prev, totalAds: adsRes.data.totalAds }));
      }
      if (commentsRes.success) {
        setComments(commentsRes.data.comments);
        setStats(prev => ({ ...prev, totalComments: commentsRes.data.totalComments }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const { type, id } = deleteModal;
    try {
      let result;
      if (type === 'user') {
        result = await apiService.deleteUser(id);
        if (result.success) {
          setUsers(users.filter(user => user.id !== id));
          setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
        }
      } else if (type === 'ad') {
        result = await apiService.deleteAd(id);
        if (result.success) {
          setAds(ads.filter(ad => ad.id !== id));
          setStats(prev => ({ ...prev, totalAds: prev.totalAds - 1 }));
        }
      } else if (type === 'comment') {
        result = await apiService.deleteComment(id);
        if (result.success) {
          setComments(comments.filter(comment => comment.id !== id));
          setStats(prev => ({ ...prev, totalComments: prev.totalComments - 1 }));
        }
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    } finally {
      setDeleteModal({ isOpen: false, type: '', id: null, name: '' });
    }
  };

  const getScoreColor = (score) => {
    if (score > 0) return 'text-green-400';
    if (score < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getScoreIcon = (score) => {
    if (score > 0) return '👍';
    if (score < 0) return '👎';
    return '😐';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-400 mx-auto mb-4"></div>
          <p className="text-xl text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gray-700/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gray-600/10 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
      </div>
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-100 mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Manage users, advertisements, and comments</p>
        </div>

        {/* Admin Profile Card */}
        {adminProfile && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
                <UserGroupIcon className="w-8 h-8 text-gray-300" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-100">{adminProfile.username}</h2>
                <p className="text-gray-400">{adminProfile.email}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center">
                    <MapPinIcon className="w-4 h-4 mr-1" />
                    {adminProfile.location.name}
                  </span>
                  <span className="flex items-center">
                    <PhoneIcon className="w-4 h-4 mr-1" />
                    {adminProfile.whatsappNumber}
                  </span>
                  <span className="flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-1" />
                    Joined {formatDate(adminProfile.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center">
              <UserGroupIcon className="w-8 h-8 text-blue-400 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-100">{stats.totalUsers}</p>
                <p className="text-gray-400">Total Users</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center">
              <MegaphoneIcon className="w-8 h-8 text-green-400 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-100">{stats.totalAds}</p>
                <p className="text-gray-400">Total Advertisements</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center">
              <ChatBubbleLeftRightIcon className="w-8 h-8 text-yellow-400 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-100">{stats.totalComments}</p>
                <p className="text-gray-400">Total Comments</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-700 mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-gray-400 text-gray-100'
                  : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              <UserGroupIcon className="w-5 h-5 inline mr-2" />
              Users
            </button>
            <button
              onClick={() => setActiveTab('ads')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'ads'
                  ? 'border-gray-400 text-gray-100'
                  : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              <MegaphoneIcon className="w-5 h-5 inline mr-2" />
              Advertisements
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'comments'
                  ? 'border-gray-400 text-gray-100'
                  : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5 inline mr-2" />
              Comments
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {users.map(user => (
              <div key={user.id} className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                      <UserGroupIcon className="w-6 h-6 text-gray-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-100">{user.username}</h3>
                      <p className="text-gray-400">{user.email}</p>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center">
                          <MapPinIcon className="w-4 h-4 mr-1" />
                          {user.location.name}
                        </span>
                        <span className="flex items-center">
                          <PhoneIcon className="w-4 h-4 mr-1" />
                          {user.whatsappNumber}
                        </span>
                        <span className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          {formatDate(user.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteModal({ 
                      isOpen: true, 
                      type: 'user', 
                      id: user.id, 
                      name: user.username 
                    })}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'ads' && (
          <div className="space-y-4">
            {ads.map(ad => (
              <div key={ad.id} className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-100">{ad.title}</h3>
                      <span className={`text-xl ${getScoreColor(ad.score)}`}>
                        {getScoreIcon(ad.score)} {ad.score}
                      </span>
                    </div>
                    <p className="text-gray-400 mb-2">{ad.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                      <span className="bg-gray-700 px-2 py-1 rounded">{ad.category}</span>
                      <span className="text-green-400">Rs. {ad.price}</span>
                      <span className="flex items-center">
                        <MapPinIcon className="w-4 h-4 mr-1" />
                        {ad.location.name}
                      </span>
                      <span>By: {ad.userName}</span>
                      <span>{formatDate(ad.createdAt)}</span>
                    </div>
                    {ad.photoUrls && ad.photoUrls.length > 0 && (
                      <img 
                        src={ad.photoUrls[0]} 
                        alt={ad.title}
                        className="w-24 h-16 object-cover rounded border border-gray-600"
                      />
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedAd(ad)}
                      className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-colors"
                    >
                      <ChatBubbleLeftRightIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setDeleteModal({ 
                        isOpen: true, 
                        type: 'ad', 
                        id: ad.id, 
                        name: ad.title 
                      })}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Comments for this ad */}
                <div className="border-t border-gray-700 pt-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Comments on this ad:</h4>
                  {comments.filter(comment => comment.adId === ad.id).length === 0 ? (
                    <p className="text-gray-500 text-sm">No comments yet</p>
                  ) : (
                    <div className="space-y-2">
                      {comments.filter(comment => comment.adId === ad.id).map(comment => (
                        <div key={comment.id} className="bg-gray-700/50 rounded p-3 text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-gray-300">{comment.userName}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500">{formatDate(comment.createdAt)}</span>
                              <button
                                onClick={() => setDeleteModal({ 
                                  isOpen: true, 
                                  type: 'comment', 
                                  id: comment.id, 
                                  name: `comment by ${comment.userName}` 
                                })}
                                className="p-1 text-red-400 hover:text-red-300 rounded"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <p className="text-gray-400">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="space-y-4">
            {comments.map(comment => (
              <div key={comment.id} className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-100">{comment.userName}</h3>
                      <span className="text-sm text-gray-500">on "{comment.adTitle}"</span>
                    </div>
                    <p className="text-gray-400 mb-2">{comment.content}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{comment.userEmail}</span>
                      <span>{formatDate(comment.createdAt)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteModal({ 
                      isOpen: true, 
                      type: 'comment', 
                      id: comment.id, 
                      name: `comment by ${comment.userName}` 
                    })}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModal.isOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-md w-full mx-4">
              <div className="flex items-center space-x-3 mb-4">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
                <h3 className="text-lg font-semibold text-gray-100">Confirm Deletion</h3>
              </div>
              <p className="text-gray-400 mb-6">
                Are you sure you want to delete this {deleteModal.type}: "{deleteModal.name}"? 
                This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeleteModal({ isOpen: false, type: '', id: null, name: '' })}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-100 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ad Details Modal */}
        {selectedAd && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-2xl w-full mx-4 my-8">
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h3 className="text-xl font-semibold text-gray-100">{selectedAd.title}</h3>
                <button
                  onClick={() => setSelectedAd(null)}
                  className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-lg"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <span className={`text-2xl ${getScoreColor(selectedAd.score)}`}>
                    {getScoreIcon(selectedAd.score)}
                  </span>
                  <div>
                    <span className={`text-lg font-semibold ${getScoreColor(selectedAd.score)}`}>
                      Score: {selectedAd.score}
                    </span>
                    <p className="text-sm text-gray-400">
                      {selectedAd.score > 0 ? 'Positive feedback' : 
                       selectedAd.score < 0 ? 'Negative feedback' : 'Neutral feedback'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-400">Category:</span>
                    <span className="ml-2 text-gray-100">{selectedAd.category}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Price:</span>
                    <span className="ml-2 text-green-400">Rs. {selectedAd.price}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Location:</span>
                    <span className="ml-2 text-gray-100">{selectedAd.location.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Posted by:</span>
                    <span className="ml-2 text-gray-100">{selectedAd.userName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Posted on:</span>
                    <span className="ml-2 text-gray-100">{formatDate(selectedAd.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Last updated:</span>
                    <span className="ml-2 text-gray-100">{formatDate(selectedAd.updatedAt)}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-gray-400 block mb-2">Description:</span>
                  <p className="text-gray-100 bg-gray-700/50 p-3 rounded">{selectedAd.description}</p>
                </div>

                {selectedAd.photoUrls && selectedAd.photoUrls.length > 0 && (
                  <div className="mb-6">
                    <span className="text-gray-400 block mb-2">Photos:</span>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedAd.photoUrls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`${selectedAd.title} ${index + 1}`}
                          className="w-full h-32 object-cover rounded border border-gray-600"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments for selected ad */}
                <div className="border-t border-gray-700 pt-4">
                  <h4 className="text-lg font-medium text-gray-100 mb-4 flex items-center">
                    <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
                    Comments ({comments.filter(comment => comment.adId === selectedAd.id).length})
                  </h4>
                  
                  {comments.filter(comment => comment.adId === selectedAd.id).length === 0 ? (
                    <div className="text-center py-8">
                      <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500">No comments on this advertisement yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-64 overflow-y-auto">
                      {comments.filter(comment => comment.adId === selectedAd.id).map(comment => (
                        <div key={comment.id} className="bg-gray-700/50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-200">
                                  {comment.userName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-200">{comment.userName}</span>
                                <span className="text-sm text-gray-400 ml-2">
                                  {formatDate(comment.createdAt)}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => setDeleteModal({ 
                                isOpen: true, 
                                type: 'comment', 
                                id: comment.id, 
                                name: `comment by ${comment.userName}` 
                              })}
                              className="p-1 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded transition-colors"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-gray-300 pl-11">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
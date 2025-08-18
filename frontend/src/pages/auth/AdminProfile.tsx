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
  StarIcon
} from '@heroicons/react/24/outline';
import { Dialog, Disclosure } from '@headlessui/react';
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
        result = await apiService.deleteUserAdmin(id);
        if (result.success) {
          setUsers(users.filter(user => user.id !== id));
          setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
        }
      } else if (type === 'ad') {
        result = await apiService.deleteAdAdmin(id);
        if (result.success) {
          setAds(ads.filter(ad => ad.id !== id));
          setStats(prev => ({ ...prev, totalAds: prev.totalAds - 1 }));
        }
      } else if (type === 'comment') {
        result = await apiService.deleteCommentAdmin(id);
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

  const getUserRating = (userId) => {
    const userAds = ads.filter(ad => ad.userId === userId);
    if (userAds.length === 0) return 0;
    const totalScore = userAds.reduce((sum, ad) => sum + ad.score, 0);
    return Math.max(0, Math.min(5, 3 + (totalScore / userAds.length)));
  };

  const getUserStats = (userId) => {
    const userAds = ads.filter(ad => ad.userId === userId);
    const userComments = comments.filter(comment => comment.userId === userId);
    return {
      totalAds: userAds.length,
      totalComments: userComments.length,
      rating: getUserRating(userId)
    };
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <StarIcon
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-600'
        }`}
      />
    ));
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
    <div className="min-h-screen bg-gray-900 text-gray-100 px-10">
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
          <p className="text-gray-400">Manage users and advertisements</p>
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
                    {adminProfile.location.name || 'Location not set'}
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
          </nav>
        </div>

        {/* Users Table */}
        {activeTab === 'users' && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-700 border-b border-gray-600">
                    <th className="text-left p-4 font-medium text-gray-200">User</th>
                    <th className="text-left p-4 font-medium text-gray-200">Contact</th>
                    <th className="text-left p-4 font-medium text-gray-200">Joined</th>
                    <th className="text-left p-4 font-medium text-gray-200">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => {
                    return (
                      <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700/20">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                              <span className="text-gray-200 font-medium">{user.username.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-100">{user.username}</div>
                              <div className="text-sm text-gray-400">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm">
                          <div className="flex items-center text-gray-300 mb-1">
                            <PhoneIcon className="w-4 h-4 mr-1" />
                            {user.whatsappNumber}
                          </div>
                        </td>
                        
                        <td className="p-4 text-sm text-gray-300">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="p-4">
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
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

{/* Ads Table */}
{activeTab === 'ads' && (
  <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr className="bg-gray-700 border-b border-gray-600">
            <th className="text-left p-4 font-medium text-gray-200 w-1/3">Advertisement</th>
            <th className="text-left p-4 font-medium text-gray-200 w-1/4">Seller</th>
            <th className="text-left p-4 font-medium text-gray-200 w-1/4">Price & Location</th>
            <th className="text-left p-4 font-medium text-gray-200 w-1/6">Actions</th>
          </tr>
        </thead>
        <tbody>
          {ads.map(ad => (
            <Disclosure key={ad.id}>
              {({ open }) => (
                <>
                  {/* Main Row */}
                  <tr className="border-b border-gray-700 hover:bg-gray-700/20 align-top">
                    {/* Advertisement */}
                    <td className="p-4">
                      <div className="flex items-start space-x-3">
                        {ad.photoUrls?.[0] && (
                          <img
                            src={ad.photoUrls[0]}
                            alt={ad.title}
                            className="w-16 h-12 object-cover rounded border border-gray-600"
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-gray-100">{ad.title}</div>
                          <div className="text-sm text-gray-400 line-clamp-2">
                            {ad.description}
                          </div>
                          <span className="inline-block bg-gray-700 text-gray-300 px-2 py-1 rounded-sm text-xs mt-1">
                            {ad.category}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Seller */}
                    <td className="p-4 text-sm align-top">
                      <div className="text-gray-300 font-medium">{ad.userName}</div>
                      <div className="text-gray-400">{ad.userEmail}</div>
                    </td>

                    {/* Price & Location */}
                    <td className="p-4 text-sm align-top">
                      <div className="text-green-400 font-medium">
                        Rs. {ad.price} per kg
                      </div>
                      <div className="flex items-center text-gray-400">
                        <MapPinIcon className="w-4 h-4 mr-1" />
                        {ad.location.name}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-4 align-top">
                      <div className="flex items-center space-x-2">
                        <Disclosure.Button className="relative p-2 rounded hover:bg-gray-700/50 transition-colors">
                          <ChatBubbleLeftRightIcon
                            className={`w-5 h-5 text-blue-400 transform transition-transform ${
                              open ? "rotate-180" : ""
                            }`}
                          />
                          <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-semibold w-4 h-4 flex items-center justify-center rounded-full">
                            {comments.filter(c => c.adId === ad.id).length}
                          </span>
                        </Disclosure.Button>

                        <button
                          onClick={() =>
                            setDeleteModal({
                              isOpen: true,
                              type: "ad",
                              id: ad.id,
                              name: ad.title,
                            })
                          }
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expandable Comments Row */}
                  <Disclosure.Panel as="tr">
                    <td colSpan={4} className="bg-gray-700/50 p-4">
                      {comments.filter(c => c.adId === ad.id).length === 0 ? (
                        <div className="text-gray-400 italic text-sm">
                          No comments yet
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {comments
                            .filter(c => c.adId === ad.id)
                            .map(comment => (
                              <div
                                key={comment.id}
                                className="bg-gray-800 rounded p-2 text-xs"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-gray-300 font-medium">
                                    {comment.userEmail}{" "}
                                    {comment.sentiment === "good" && (
                                      <span className="text-green-400">👍</span>
                                    )}
                                    {comment.sentiment === "bad" && (
                                      <span className="text-red-400">👎</span>
                                    )}
                                    {comment.sentiment === "neutral" && (
                                      <span className="text-gray-400">😐</span>
                                    )}
                                  </span>
                                  <button
                                    onClick={() =>
                                      setDeleteModal({
                                        isOpen: true,
                                        type: "comment",
                                        id: comment.id,
                                        name: `comment by ${comment.userEmail}`,
                                      })
                                    }
                                    className="p-1 text-red-400 hover:text-red-300 rounded"
                                  >
                                    <TrashIcon className="w-3 h-3" />
                                  </button>
                                </div>
                                <p className="text-gray-400">{comment.description}</p>
                              </div>
                            ))}
                        </div>
                      )}
                    </td>
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}





        {/* Delete Confirmation Modal */}
        <Dialog open={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, type: '', id: null, name: '' })}>
          <div className="fixed inset-0 bg-black/50 z-50" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Dialog.Panel className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-md w-full mx-4">
              <div className="flex items-center space-x-3 mb-4">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
                <Dialog.Title className="text-lg font-semibold text-gray-100">
                  Confirm Deletion
                </Dialog.Title>
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
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-100 px-4 py-2 rounded-lg font-medium transition-colors">
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </div>
      <Footer />
    </div>
  );
}
import { useEffect, useState, Fragment } from "react";
import { useNavigate } from "react-router";
import { apiService } from "../../services/api";
import { 
  MapPinIcon, 
  PhoneIcon, 
  EnvelopeIcon,
  PencilIcon,
  TrashIcon,
  RocketLaunchIcon,
  EllipsisVerticalIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  TagIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import { Dialog, Transition, Menu } from "@headlessui/react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { AdData } from "../../constants/types";
import "leaflet/dist/leaflet.css";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

interface User {
  id: number;
  username: string;
  email: string;
  userLocation?: string;
  whatsappNumber?: string;
}

interface Comment {
  id: number;
  userEmail: string;
  adId: number;
  sentiment: 'positive' | 'negative' | 'neutral' | 'good' | 'bad';
  description: string;
  createdAt: string;
}

interface AdWithComments extends AdData {
  comments: Comment[];
}

interface UserAdsResponse {
  message: string;
  userEmail: string;
  totalAds: number;
  ads: AdWithComments[];
}

const COLORS = {
  positive: '#1e40af',
  negative: '#dc2626',
  neutral: '#6b7280'
};

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userAds, setUserAds] = useState<AdWithComments[]>([]);
  const [selectedAd, setSelectedAd] = useState<AdData | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchProfile() {
      try {
        const userResponse = await apiService.getProfile();
        setUser(userResponse);
        
        const adsResponse: UserAdsResponse = await apiService.getUserAdvertisements();
        if (adsResponse.data.ads) {
          setUserAds(adsResponse.data.ads);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        navigate("/signin");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [navigate]);

  // Analytics calculations
  const analytics = {
    totalComments: userAds.reduce((acc, ad) => acc + (ad.comments?.length || 0), 0),
    sentimentCounts: userAds.reduce((acc, ad) => {
      ad.comments?.forEach(comment => {
        const sentiment = comment.sentiment === 'good' ? 'positive' : 
                         comment.sentiment === 'bad' ? 'negative' : 
                         comment.sentiment || 'neutral';
        acc[sentiment] = (acc[sentiment] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>),
    adsByCategory: userAds.reduce((acc, ad) => {
      acc[ad.category] = (acc[ad.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    avgPrice: userAds.length > 0 ? 
      userAds.reduce((acc, ad) => acc + parseFloat(ad.price), 0) / userAds.length : 0,
    totalValue: userAds.reduce((acc, ad) => acc + parseFloat(ad.price), 0)
  };

  const sentimentData = Object.entries(analytics.sentimentCounts).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value,
    color: COLORS[key as keyof typeof COLORS] || COLORS.neutral
  }));

  const categoryData = Object.entries(analytics.adsByCategory).map(([category, count]) => ({
    category,
    count
  }));

  const handleDeleteAd = async () => {
    if (!selectedAd) return;
    
    setActionLoading(true);
    try {
      const response = await apiService.deleteAdvertisement(selectedAd.id.toString());
      if (response.success) {
        setUserAds(prev => prev.filter(ad => ad.id !== selectedAd.id));
      }
      
      setShowDeleteModal(false);
      setSelectedAd(null);
    } catch (error) {
      console.error('Failed to delete advertisement:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBoostAd = async () => {
    if (!selectedAd) return;
    
    setActionLoading(true);
    try {
      const response = await apiService.boostAdvertisement(selectedAd.id.toString());
      if (response.success) {
        console.log('Advertisement boosted successfully:', response.data);
      }
      setShowBoostModal(false);
      setSelectedAd(null);
    } catch (error) {
      console.error('Failed to boost advertisement:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateAd = (ad: AdData) => {
    navigate(`/ads/update/${ad.id}`, { state: { adData: ad } });
  };

  const formatPrice = (price: string | number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0
    }).format(typeof price === 'string' ? parseFloat(price) : price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <div className="text-gray-400 text-lg">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    user.username || "user"
  )}&background=1e40af&color=ffffff&size=128&bold=true`;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 px-4 py-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-gray-400">Manage your advertisements and track performance</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">

            <div className="bg-gradient-to-r from-gray-600 to-gray-700 p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Active Ads</p>
                  <p className="text-3xl font-bold text-white">{userAds.length}</p>
                </div>
                <div className="p-3 bg-blue-500/30 rounded-lg">
                  <ChartBarIcon className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl shadow-lg hover:border-gray-600 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Total Comments</p>
                  <p className="text-3xl font-bold text-white">{analytics.totalComments}</p>
                </div>
                <div className="p-3 bg-gray-700 rounded-lg">
                  <ChatBubbleLeftRightIcon className="w-8 h-8 text-gray-300" />
                </div>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl shadow-lg hover:border-gray-600 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Portfolio Value</p>
                  <p className="text-2xl font-bold text-white">{formatPrice(analytics.totalValue)}</p>
                </div>
                <div className="p-3 bg-gray-700 rounded-lg">
                   <ArrowTrendingUpIcon className="w-8 h-8 text-gray-300" />
                </div>
              </div>
            </div>

           
          </div>

          <div className="grid gap-8 lg:grid-cols-12">
            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-8">
              
              {/* Profile Card */}
              <div className="bg-gray-800/60 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-gray-700/60">
                <div className="flex flex-col items-center space-y-6">
                  <img
                    src={avatarUrl}
                    alt="Profile Avatar"
                    className="w-24 h-24 rounded-full border-2 border-gray-600 bg-gray-700 shadow-lg"
                  />
                  <div className="text-center">
                    <h2 className="text-2xl font-bold">{user.username}</h2>
                    <p className="text-gray-400 text-sm">AdNetwork Member</p>
                  </div>
                  <div className="space-y-3 text-left w-full">
                    <div className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg">
                      <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-gray-300 text-sm font-medium">Email</p>
                        <p className="text-gray-400 text-xs">{user.email}</p>
                      </div>
                    </div>
                    {user.whatsappNumber && (
                      <div className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg">
                        <PhoneIcon className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-gray-300 text-sm font-medium">WhatsApp</p>
                          <p className="text-gray-400 text-xs">{user.whatsappNumber}</p>
                        </div>
                      </div>
                    )}
                    {user.userLocation && (
                      <div className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg">
                        <MapPinIcon className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-gray-300 text-sm font-medium">Location</p>
                          <p className="text-gray-400 text-xs">{user.userLocation}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sentiment Analysis Chart */}
              {sentimentData.length > 0 && (
                <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-6">Comment Sentiment</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sentimentData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                          labelStyle={{ fill: '#d1d5db', fontSize: '12px' }}
                        >
                          {sentimentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1f2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#d1d5db'
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {/* Main Content */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Category Distribution */}
              {categoryData.length > 0 && (
                <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-6">Ads by Category</h3>
                  <div className="h-51">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="category" 
                          stroke="#9ca3af" 
                          fontSize={12} 
                          tickLine={false}
                        />
                        <YAxis 
                          stroke="#9ca3af" 
                          fontSize={12} 
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip 
                          cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
                          contentStyle={{ 
                            backgroundColor: '#1f2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#d1d5db'
                          }} 
                        />
                        <Bar 
                          dataKey="count" 
                          fill="#3b82f6" 
                          radius={[4, 4, 0, 0]}
                          className="hover:opacity-80"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Advertisements Section */}
              <div className="bg-gray-800/60 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-gray-700/60">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-100">My Advertisements</h3>
                    <p className="text-gray-400 text-sm">{userAds.length} active listings</p>
                  </div>
                  <button
                    onClick={() => navigate('/ads/add')}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-lg transition-colors duration-200 text-sm font-medium"
                  >
                    + New Ad
                  </button>
                </div>

                {userAds.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MapPinIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-300 mb-2">No advertisements yet</h4>
                    <p className="text-gray-400 text-sm mb-4">Start selling by creating your first advertisement</p>
                    <button
                      onClick={() => navigate('/ads/add')}
                      className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-lg transition-colors duration-200"
                    >
                      Create Advertisement
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userAds.map((ad) => (
                      <div key={ad.id} className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <img
                              src={ad.photoUrls && ad.photoUrls.length > 0 ? ad.photoUrls[0] : '/placeholder-image.jpg'}
                              alt={ad.title}
                              className="w-16 h-16 object-cover rounded-lg bg-gray-600"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0yMCAyMEg0NFY0NEgyMFYyMFoiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+CjxjaXJjbGUgY3g9IjI2IiBjeT0iMjgiIHI9IjMiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTIwIDM2TDI4IDI4TDM2IDM2TDQ0IDI4VjQ0SDIwVjM2WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                              }}
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-100 truncate">{ad.title}</h4>
                                <p className="text-sm text-gray-400 mt-1 line-clamp-2">{ad.description}</p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <MapPinIcon className="w-3 h-3" />
                                    {ad.location?.name || 'Location not specified'}
                                  </span>
                                  <span>{ad.category}</span>
                                  {ad.comments && ad.comments.length > 0 && (
                                    <span className="flex items-center gap-1 text-blue-400">
                                      <ChatBubbleLeftRightIcon className="w-3 h-3" />
                                      {ad.comments.length} comments
                                    </span>
                                  )}
                                  {ad.date && <span>{formatDate(ad.date)}</span>}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 ml-4">
                                <div className="text-right">
                                  <div className="font-semibold text-gray-100">{formatPrice(ad.price)}</div>
                                  {ad.sellerPhone && (
                                    <div className="text-xs text-gray-400">{ad.sellerPhone}</div>
                                  )}
                                </div>
                                
                                <Menu as="div" className="relative">
                                  <Menu.Button className="p-1 text-gray-400 hover:text-gray-200 transition-colors">
                                    <EllipsisVerticalIcon className="w-5 h-5" />
                                  </Menu.Button>
                                  
                                  <Transition
                                    as={Fragment}
                                    enter="transition ease-out duration-100"
                                    enterFrom="transform opacity-0 scale-95"
                                    enterTo="transform opacity-100 scale-100"
                                    leave="transition ease-in duration-75"
                                    leaveFrom="transform opacity-100 scale-100"
                                    leaveTo="transform opacity-0 scale-95"
                                  >
                                    <Menu.Items className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-600 z-10">
                                      <div className="py-1">
                                        <Menu.Item>
                                          {({ active }) => (
                                            <button
                                              onClick={() => handleUpdateAd(ad)}
                                              className={`${active ? 'bg-gray-700' : ''} flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-300 hover:text-gray-100`}
                                            >
                                              <PencilIcon className="w-4 h-4" />
                                              Update
                                            </button>
                                          )}
                                        </Menu.Item>
                                        <Menu.Item>
                                          {({ active }) => (
                                            <button
                                              onClick={() => {
                                                setSelectedAd(ad);
                                                setShowBoostModal(true);
                                              }}
                                              className={`${active ? 'bg-gray-700' : ''} flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-300 hover:text-gray-100`}
                                            >
                                              <RocketLaunchIcon className="w-4 h-4" />
                                              Boost
                                            </button>
                                          )}
                                        </Menu.Item>
                                        <Menu.Item>
                                          {({ active }) => (
                                            <button
                                              onClick={() => {
                                                setSelectedAd(ad);
                                                setShowDeleteModal(true);
                                              }}
                                              className={`${active ? 'bg-gray-700' : ''} flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:text-red-300`}
                                            >
                                              <TrashIcon className="w-4 h-4" />
                                              Delete
                                            </button>
                                          )}
                                        </Menu.Item>
                                      </div>
                                    </Menu.Items>
                                  </Transition>
                                </Menu>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
      
      {/* Enhanced Delete Modal */}
      <Transition appear show={showDeleteModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowDeleteModal(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-gray-800 p-6 text-left shadow-2xl transition-all border border-gray-700">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex-shrink-0 p-3 bg-red-500/20 rounded-full">
                      <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <Dialog.Title as="h3" className="text-lg font-semibold text-white mb-1">
                        Delete Advertisement
                      </Dialog.Title>
                      <p className="text-sm text-gray-400">This action cannot be undone</p>
                    </div>
                  </div>

                  <div className="mb-6 p-4 bg-gray-700/50 rounded-lg">
                    <p className="text-sm text-gray-300 mb-2">
                      You're about to delete:
                    </p>
                    <p className="font-medium text-white">"{selectedAd?.title}"</p>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                      onClick={() => setShowDeleteModal(false)}
                      disabled={actionLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 shadow-lg hover:shadow-red-500/25"
                      onClick={handleDeleteAd}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Enhanced Boost Modal */}
      <Transition appear show={showBoostModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowBoostModal(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-gray-800 p-6 text-left shadow-2xl transition-all border border-gray-700">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex-shrink-0 p-3 bg-blue-500/20 rounded-full">
                      <RocketLaunchIcon className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <Dialog.Title as="h3" className="text-lg font-semibold text-white mb-1">
                        Boost Advertisement
                      </Dialog.Title>
                      <p className="text-sm text-gray-400">Increase your ad's visibility</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="p-4 bg-gray-700/50 rounded-lg mb-4">
                      <p className="font-medium text-white mb-1">"{selectedAd?.title}"</p>
                      <p className="text-sm text-gray-400">
                        Boost this ad to reach more potential buyers through WhatsApp.
                      </p>
                    </div>
                    
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
                         <ArrowTrendingUpIcon className="w-4 h-4" />
                        Boost Benefits
                      </h4>
                      <ul className="text-sm text-gray-300 space-y-2">
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                          Direct delivery to users via WhatsApp channel
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                          Increased visibility and engagement
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                          Faster inquiries from interested buyers
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                      onClick={() => setShowBoostModal(false)}
                      disabled={actionLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 shadow-lg hover:shadow-blue-500/25"
                      onClick={handleBoostAd}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Boosting...' : 'Boost Ad'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
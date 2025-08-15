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
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { Dialog, Transition, Menu } from "@headlessui/react";
import type { Ad, AdData } from "../../constants/types";
import "leaflet/dist/leaflet.css";
import Navbar from "../../components/Navbar";

interface User {
  id: number;
  username: string;
  email: string;
  userLocation?: string;
  whatsappNumber?: string;
}

interface UserAdsResponse {
  message: string;
  userEmail: string;
  totalAds: number;
  ads: Ad[];
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userAds, setUserAds] = useState<AdData[]>([]);
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




  const handleLogout = () => {
    localStorage.removeItem('jwt');
    navigate("/signin");
  };

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
    // Navigate to update page with ad ID
    navigate(`/ads/update/${ad.id}`, { state: { adData: ad } });
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0
    }).format(parseFloat(price));
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
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    user.username || "user"
  )}&background=374151&color=E5E7EB`;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans relative overflow-x-hidden">
      {/* Header */}
      <Navbar />

      {/* Main Content */}
      <div className="flex-1 p-4">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Profile Section */}
            <div className="lg:col-span-1">
              {/* Profile Card */}
              <div className="relative bg-gray-800/60 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-gray-700/60 mb-6">
                {/* Avatar & Info */}
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
            </div>

            {/* Advertisements Section */}
            <div className="lg:col-span-2">
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
                          {/* Image */}
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
                          
                          {/* Content */}
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
                                  {ad.date && (
                                    <span>{formatDate(ad.date)}</span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 ml-4">
                                <div className="text-right">
                                  <div className="font-semibold text-gray-100">{formatPrice(ad.price)}</div>
                                  {ad.sellerPhone && (
                                    <div className="text-xs text-gray-400">{ad.sellerPhone}</div>
                                  )}
                                </div>
                                
                                {/* Actions Menu */}
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

      {/* Delete Confirmation Modal */}
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
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-gray-800 p-6 text-left align-middle shadow-xl transition-all border border-gray-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-shrink-0">
                      <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
                    </div>
                    <Dialog.Title as="h3" className="text-lg font-medium text-gray-100">
                      Delete Advertisement
                    </Dialog.Title>
                  </div>

                  <div className="mb-6">
                    <p className="text-sm text-gray-400">
                      Are you sure you want to delete "{selectedAd?.title}"? This action cannot be undone and an email notification will be sent.
                    </p>
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
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
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

      {/* Boost Confirmation Modal */}
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
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-gray-800 p-6 text-left align-middle shadow-xl transition-all border border-gray-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-shrink-0">
                      <RocketLaunchIcon className="w-6 h-6 text-blue-400" />
                    </div>
                    <Dialog.Title as="h3" className="text-lg font-medium text-gray-100">
                      Boost Advertisement
                    </Dialog.Title>
                  </div>

                 <div className="mb-6">
  <p className="text-sm text-gray-400 mb-3">
    Boost "{selectedAd?.title}" to reach more potential buyers through WhatsApp.
  </p>
  <div className="bg-gray-700/50 rounded-lg p-3">
    <h4 className="text-sm font-medium text-gray-200 mb-2">Boost Benefits:</h4>
    <ul className="text-xs text-gray-400 space-y-1">
      <li>• Your ad is sent directly to users via our WhatsApp channel</li>
      <li>• Increased visibility through direct messaging</li>
      <li>• Higher chance of getting inquiries faster</li>
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
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
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
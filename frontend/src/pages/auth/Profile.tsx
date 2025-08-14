import { useEffect, useState, Fragment } from "react";
import { useNavigate } from "react-router";
import { apiService } from "../../services/api";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
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
import type { AdData } from "../../constants/types";
import "leaflet/dist/leaflet.css";

// Mock data for advertisements
const mockAds: AdData[] = [
  {
    title: "Japan Badu",
    description: "asdfghjk",
    price: "1200000",
    location: {
      name: "Colombo",
      lat: 7.253391265869141,
      lng: 80.34537506103516,
      geohash: "tc31k23wn"
    },
    category: "Electronics & Technology",
    userEmail: "user@example.com",
    photoUrls: [
      "https://fra.cloud.appwrite.io/v1/storage/buckets/689e169e00048e04c0be/files/689e2f1d003300b4ef55/view?project=689e16540020bd6ae70d",
      "https://fra.cloud.appwrite.io/v1/storage/buckets/689e169e00048e04c0be/files/689e2f1d00336abdae32/view?project=689e16540020bd6ae70d"
    ]
  },
  {
    title: "iPhone 15 Pro",
    description: "Brand new iPhone 15 Pro with 256GB storage",
    price: "450000",
    location: {
      name: "Kandy",
      lat: 7.2906,
      lng: 80.6337,
      geohash: "tc31k23wn"
    },
    category: "Electronics & Technology",
    userEmail: "user@example.com",
    photoUrls: [
      "https://fra.cloud.appwrite.io/v1/storage/buckets/689e169e00048e04c0be/files/689e2f1d003300b4ef55/view?project=689e16540020bd6ae70d"
    ]
  },
  {
    title: "Gaming Laptop",
    description: "High-performance gaming laptop with RTX 4070",
    price: "850000",
    location: {
      name: "Galle",
      lat: 6.0535,
      lng: 80.2210,
      geohash: "tc31k23wn"
    },
    category: "Electronics & Technology",
    userEmail: "user@example.com",
    photoUrls: [
      "https://fra.cloud.appwrite.io/v1/storage/buckets/689e169e00048e04c0be/files/689e2f1d003300b4ef55/view?project=689e16540020bd6ae70d"
    ]
  }
];

export default function Profile() {
  const [user, setUser] = useState<{
    username: string;
    email: string;
    userLocation?: string;
    whatsappNumber?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [userAds, setUserAds] = useState<AdData[]>(mockAds);
  const [selectedAd, setSelectedAd] = useState<AdData | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchProfile() {
      try {
        // Mock user data for now
        setUser({
          username: "John Doe",
          email: "john.doe@example.com",
          userLocation: "Colombo, Sri Lanka",
          whatsappNumber: "+94771234567"
        });
        // In real implementation:
        // const u = await apiService.getProfile();
        // setUser(u);
        // const adsResponse = await apiService.getUserAdvertisements();
        // if (adsResponse.success) setUserAds(adsResponse.data || []);
      } catch {
        navigate("/signin");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [navigate]);

  const getCoordinatesFromLocation = (location?: string): [number, number] => {
    if (!location) return [6.9271, 79.8612]; 
    return [6.9271, 79.8612]; 
  };

  const customIcon = L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: #374151; width: 20px; height: 20px; border-radius: 50%; border: 3px solid #9CA3AF; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  const SimpleMap = ({ location }: { location: string }) => {
    const coordinates = getCoordinatesFromLocation(location);

    return (
      <MapContainer
        center={coordinates}
        zoom={13}
        style={{ height: "192px", width: "100%", borderRadius: "8px" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={coordinates} icon={customIcon}>
          <Popup>Your Location</Popup>
        </Marker>
      </MapContainer>
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    navigate("/signin");
  };

  const handleDeleteAd = async () => {
    if (!selectedAd) return;
    
    setActionLoading(true);
    try {
      // In real implementation:
      // const response = await apiService.deleteAdvertisement(selectedAd.id);
      // if (response.success) {
      //   setUserAds(prev => prev.filter(ad => ad.id !== selectedAd.id));
      //   await sendEmailNotification('delete', selectedAd);
      // }
      
      // Mock implementation
      setUserAds(prev => prev.filter(ad => ad.title !== selectedAd.title));
      await mockSendEmail('delete', selectedAd);
      
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
      // In real implementation:
      // const response = await apiService.boostAdvertisement(selectedAd.id);
      // if (response.success) {
      //   await sendEmailNotification('boost', selectedAd);
      // }
      
      // Mock implementation
      await mockSendEmail('boost', selectedAd);
      
      setShowBoostModal(false);
      setSelectedAd(null);
    } catch (error) {
      console.error('Failed to boost advertisement:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateAd = (ad: AdData) => {
    // Navigate to edit page with ad data
    navigate(`/edit-ad/${ad.title}`, { state: { adData: ad } });
  };

  const mockSendEmail = async (action: 'delete' | 'boost', ad: AdData) => {
    // Mock email sending with JWT authentication
    const token = localStorage.getItem('jwt');
    console.log(`Sending ${action} email for ad: ${ad.title}`, {
      token,
      userEmail: user?.email,
      adTitle: ad.title
    });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0
    }).format(parseInt(price));
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
      <header className="flex justify-between items-center px-6 py-5 border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center border border-gray-600">
            <span className="text-gray-200 font-bold text-lg">A</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-100">AdNetwork</h1>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-gray-300 font-medium hover:text-gray-100 transition duration-200"
        >
          Logout
        </button>
      </header>

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

              {/* Map Card */}
              <div className="relative bg-gray-800/60 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-gray-700/60">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-gray-100">Your Location</h3>
                  <p className="text-gray-400 text-sm">This helps buyers find items near you</p>
                </div>
                {user.userLocation ? (
                  <SimpleMap location={user.userLocation} />
                ) : (
                  <div className="w-full h-48 bg-gray-700/50 rounded-lg flex flex-col items-center justify-center">
                    <MapPinIcon className="w-12 h-12 text-gray-500" />
                    <p className="text-gray-400 text-sm">No location set</p>
                  </div>
                )}
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
                    onClick={() => navigate('/create-ad')}
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
                      onClick={() => navigate('/create-ad')}
                      className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-lg transition-colors duration-200"
                    >
                      Create Advertisement
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userAds.map((ad, index) => (
                      <div key={index} className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
                        <div className="flex items-start gap-4">
                          {/* Image */}
                          <div className="flex-shrink-0">
                            <img
                              src={ad.photoUrls[0] || '/placeholder-image.jpg'}
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
                                    {ad.location.name}
                                  </span>
                                  <span>{ad.category}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 ml-4">
                                <div className="text-right">
                                  <div className="font-semibold text-gray-100">{formatPrice(ad.price)}</div>
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
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
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
                      Boost "{selectedAd?.title}" to increase its visibility and reach more potential buyers.
                    </p>
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-gray-200 mb-2">Boost Benefits:</h4>
                      <ul className="text-xs text-gray-400 space-y-1">
                        <li>• Higher placement in search results</li>
                        <li>• Featured in category listings</li>
                        <li>• Email notification sent to confirm boost</li>
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

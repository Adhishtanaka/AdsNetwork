import { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Navbar from "../../components/Navbar";
import ngeohash from "ngeohash";
import { apiService } from "../../services/api";
import type { Ad } from "../../constants/types";
import { Link } from "react-router";

export default function AllAdsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("Newest");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [geohashPrecision, setGeohashPrecision] = useState(5);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [userGeohash, setUserGeohash] = useState("");
  const [ads, setAds] = useState<Ad[]>([]);

  const categories = [
    "Electronics & Technology",
    "Vehicles & Transport",
    "Real Estate",
    "Fashion & Beauty",
    "Home & Garden",
    "Sports & Recreation",
    "Business Services",
    "Jobs & Employment",
  ];



  const fetchAds = async () => {
    try {
      const response = await apiService.getAdvertisements();
      setAds(response.data.ads); 
    } catch (error) {
      console.error("Error fetching ads:", error);
      setAds([]); 
    }
  };
  
  
  
  // Get user location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          const geohash = ngeohash.encode(latitude, longitude, 9);
          setUserGeohash(geohash);
        },
        (error) => {
          console.error("Error getting location:", error);
          // Fallback to Kalutara location
          setUserLocation({ lat: 6.5854, lng: 79.9607 });
          setUserGeohash(ngeohash.encode(6.5854, 79.9607, 9));
        }
      );
    } else {
      // Fallback to Kalutara location
      setUserLocation({ lat: 6.5854, lng: 79.9607 });
      setUserGeohash(ngeohash.encode(6.5854, 79.9607, 9));
    }
  };

  useEffect(() => {
    fetchAds();
    getUserLocation();
  }, []);

  // Filter and sort ads
  const filteredAds = ads.filter(ad => {
    const matchesSearch = ad.title.toLowerCase().includes(search.toLowerCase()) ||
                         ad.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !category || ad.category === category;
    
    // Location-based filtering
    let matchesLocation = true;
    if (locationEnabled && userGeohash) {
      const userGeohashPrefix = userGeohash.substring(0, geohashPrecision);
      const adGeohashPrefix = ad.location.geohash.substring(0, geohashPrecision);
      const neighbors = ngeohash.encode(userGeohashPrefix, geohashPrecision);
      matchesLocation = neighbors.includes(adGeohashPrefix);
    }
    
    return matchesSearch && matchesCategory && matchesLocation;
  });

  const sortedAds = [...filteredAds].sort((a, b) => {
    switch (sort) {
      case "PriceLow":
        return parseInt(a.price) - parseInt(b.price);
      case "PriceHigh":
        return parseInt(b.price) - parseInt(a.price);
      case "Nearest":
        if (!userLocation) return 0;
        const distA = Math.sqrt(Math.pow(a.location.lat - userLocation.lat, 2) + Math.pow(a.location.lng - userLocation.lng, 2));
        const distB = Math.sqrt(Math.pow(b.location.lat - userLocation.lat, 2) + Math.pow(b.location.lng - userLocation.lng, 2));
        return distA - distB;
      case "Newest":
      default:
        return new Date(b.date || "").getTime() - new Date(a.date || "").getTime();
    }
  });

  const formatPrice = (price: string) => {
    return `LKR ${parseInt(price).toLocaleString()}`;
  };

  const getPrecisionLabel = (precision: number) => {
    const labels = {
      1: "~2500km",
      2: "~630km", 
      3: "~78km",
      4: "~20km",
      5: "~2.4km",
      6: "~610m",
      7: "~76m"
    };
    return labels[precision as keyof typeof labels] || `${precision} chars`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Navbar />

      {/* Filters + Search */}
      <div className="sticky top-[64px] z-40 bg-gray-900 px-4 py-4 border-b border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-3 items-center">
          {/* Advanced Search Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${
              showAdvanced 
                ? 'bg-blue-600 border-blue-500 text-white' 
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
            }`}
          >
            <AdjustmentsHorizontalIcon className="w-4 h-4" />
            Advanced
          </button>

          {/* Sort Filter */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-gray-300 focus:outline-none focus:border-gray-600"
          >
            <option value="Newest">Newest</option>
            <option value="PriceLow">Price: Low to High</option>
            <option value="PriceHigh">Price: High to Low</option>
            <option value="Nearest">Nearest First</option>
          </select>

          {/* Search Bar */}
          <div className="flex flex-1 min-w-[250px] bg-gray-800 border border-gray-700 rounded-full overflow-hidden">
            <select
              className="bg-gray-800 text-gray-300 px-4 py-2 focus:outline-none border-r border-gray-700"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ads..."
              className="flex-1 bg-gray-800 px-4 py-2 text-gray-100 placeholder-gray-400 focus:outline-none"
            />
            <button className="px-4 bg-gray-700 hover:bg-gray-600 transition flex items-center justify-center">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-300" />
            </button>
          </div>

          <div className="text-sm text-gray-400">
            {sortedAds.length} ads found
          </div>
        </div>
      </div>

      {/* Content with Sidebar */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Advanced Search Sidebar */}
          {showAdvanced && (
            <div className="w-80 flex-shrink-0">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 sticky top-32">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">Advanced Search</h3>
                  <button
                    onClick={() => setShowAdvanced(false)}
                    className="text-gray-400 hover:text-gray-300"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Location-based Search */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-300">
                      Search Near Me
                    </label>
                    <button
                      onClick={() => setLocationEnabled(!locationEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        locationEnabled ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          locationEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {locationEnabled && (
                    <div className="space-y-4 pt-2">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">
                          Search Radius: {getPrecisionLabel(geohashPrecision)}
                        </label>
                        <input
                          type="range"
                          min="3"
                          max="7"
                          value={geohashPrecision}
                          onChange={(e) => setGeohashPrecision(parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Wide</span>
                          <span>Narrow</span>
                        </div>
                      </div>

                      {userLocation && (
                        <div className="p-3 bg-gray-700 rounded-lg">
                          <div className="text-sm text-gray-300 mb-1">Your Location:</div>
                          <div className="text-xs text-gray-400">
                            {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Geohash: {userGeohash.substring(0, geohashPrecision)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-700">
                    <button
                      onClick={() => {
                        setSearch("");
                        setCategory("");
                        setLocationEnabled(false);
                        setGeohashPrecision(5);
                      }}
                      className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ads Grid */}
          <main className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedAds.map((ad, index) => (
  <Link
    key={index}
    to={`/browse-ads/${ad.id}`}
    className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden group hover:border-gray-500 transition-all duration-200 cursor-pointer block"
  >
    <div className="relative">
      <img
        src={ad.photoUrls[0] || "https://via.placeholder.com/400x300?text=No+Image"}
        alt={ad.title}
        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
        onError={(e) => {
          e.currentTarget.src = "https://via.placeholder.com/400x300?text=No+Image";
        }}
      />
      <span className="absolute top-2 left-2 bg-gray-900/90 px-2 py-1 rounded text-sm font-semibold text-white">
        {formatPrice(ad.price)}
      </span>

      {ad.photoUrls.length > 1 && (
        <span className="absolute bottom-2 right-2 bg-gray-900/80 px-2 py-1 rounded text-xs text-gray-300">
          +{ad.photoUrls.length - 1} more
        </span>
      )}
    </div>
    <div className="p-4">
      <h4 className="font-semibold truncate text-gray-100 mb-1">{ad.title}</h4>
      <p className="text-gray-400 text-sm mb-2">{ad.category}</p>
      <p className="text-gray-300 text-sm line-clamp-2 mb-3 leading-relaxed">
        {ad.description}
      </p>
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span className="flex items-center gap-1">
          <MapPinIcon className="w-4 h-4" />
          {ad.location.name}
        </span>
        {ad.date && (
          <span className="text-xs">
            {new Date(ad.date).toLocaleDateString()}
          </span>
        )}
      </div>
      {ad.userEmail && (
        <div className="mt-2 text-xs text-gray-500 truncate">
          By: {ad.userEmail.split('@')[0]}
        </div>
      )}
    </div>
  </Link>
))}

            </div>

            {/* No results */}
            {sortedAds.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-2">No ads found</div>
                <div className="text-gray-600 text-sm">
                  {locationEnabled 
                    ? "Try expanding your search radius or turning off location filter"
                    : "Try adjusting your search criteria"
                  }
                </div>
              </div>
            )}

          
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-6 text-center text-gray-500 text-sm">
        © 2025 AdNetwork. All rights reserved.
      </footer>

  <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1f2937;
        }
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1f2937;
        }
      `}</style>
    </div>
  );
}
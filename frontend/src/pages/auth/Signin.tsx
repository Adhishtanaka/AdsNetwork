import { useState } from "react";
import { useNavigate } from "react-router";
import { apiService } from "../../services/api";
import { MapPinIcon } from "@heroicons/react/24/outline";
import Navbar from "../../components/Navbar";

export default function Signin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (!userLocation) {
        setError("Please provide your location.");
        return;
      }
      const res = await apiService.login(email, password, userLocation);
      localStorage.setItem("jwt", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      navigate("/profile");
    } catch (err: unknown) {
      let msg = "Login failed";
      if (typeof err === "object" && err !== null) {
        const axiosErr = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
        if (axiosErr.response?.data?.message) {
          msg = axiosErr.response.data.message;
        } else if (axiosErr.response?.data?.error) {
          msg = axiosErr.response.data.error;
        } else if (axiosErr.message) {
          msg = axiosErr.message;
        }
      }
      setError(msg);
    }
  };

  const getCurrentLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            setUserLocation({ lat: latitude, lng: longitude });
          } catch {
            setError("Failed to get location details");
          } finally {
            setLocationLoading(false);
          }
        },
        () => {
          setError("Location access denied");
          setLocationLoading(false);
        }
      );
    } else {
      setError("Geolocation is not supported");
      setLocationLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans relative overflow-x-hidden">
      {/* Subtle background elements */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-gray-700/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-gray-600/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
<Navbar />

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative bg-gray-800/60 backdrop-blur-sm p-8 rounded-lg shadow-lg border border-gray-700/60 w-full max-w-md">
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-100 mb-2">Sign In</h2>
              <p className="text-gray-400 text-sm">Access your Agriලංකා account</p>
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-200 p-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Email Address</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-gray-700/50 border border-gray-600 text-gray-100 p-3 rounded-lg focus:outline-none focus:border-gray-500 focus:bg-gray-700 transition duration-200"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-gray-700/50 border border-gray-600 text-gray-100 p-3 rounded-lg focus:outline-none focus:border-gray-500 focus:bg-gray-700 transition duration-200"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Location</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Your location (lat, lng)"
                    value={userLocation ? `${userLocation.lat}, ${userLocation.lng}` : ""}
                    onChange={e => {
                      const val = e.target.value;
                      const [lat, lng] = val.split(",").map(s => parseFloat(s.trim()));
                      if (!isNaN(lat) && !isNaN(lng)) {
                        setUserLocation({ lat, lng });
                      } else {
                        setUserLocation(null);
                      }
                    }}
                    className="flex-1 bg-gray-700/50 border border-gray-600 text-gray-100 p-3 rounded-lg focus:outline-none focus:border-gray-500 focus:bg-gray-700 transition duration-200"
                  />
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={locationLoading}
                    className="px-3 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-600 hover:text-gray-100 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {locationLoading ? (
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <MapPinIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-gray-500 text-xs mt-1">Click the location button to auto-detect</p>
              </div>

              </div>

            <button
              type="submit"
              onClick={handleSubmit}
              className="w-full bg-gray-700 hover:bg-gray-600 text-gray-100 font-medium py-3 rounded-lg border border-gray-600 transition duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              Sign In
            </button>

            <div className="text-center pt-4 border-t border-gray-700">
              <p className="text-gray-400 text-sm">
                Don't have an account?{" "}
                <a href="/signup" className="text-gray-200 hover:text-white font-medium transition duration-200">
                  Sign up
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-6 text-center text-gray-500 text-sm bg-gray-900/95">
        © {new Date().getFullYear()} Agriලංකා. All rights reserved. | Professional classified solutions for Sri Lanka.
      </footer>
    </div>
  );
}
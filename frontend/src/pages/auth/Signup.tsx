import { useState } from "react";
import { useNavigate } from "react-router";
import { apiService } from "../../services/api";
import { MapPinIcon, PhoneIcon, UserIcon, EnvelopeIcon, LockClosedIcon } from "@heroicons/react/24/outline";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userLocation, setUserLocation] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [error, setError] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
  await apiService.signup(name, email, password, userLocation, whatsappNumber);
      navigate("/workflows");
    } catch (err: unknown) {
      let msg = "Signup failed";
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
            // In a real app, you'd reverse geocode these coordinates
            // For now, we'll just set a placeholder
            setUserLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
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
      <header className="flex justify-between items-center px-6 py-5 border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center border border-gray-600">
            <span className="text-gray-200 font-bold text-lg">A</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-100">AdNetwork</h1>
        </div>
        <nav className="hidden md:flex space-x-8 text-gray-400 font-medium">
          <a href="/" className="hover:text-gray-200 transition duration-200">Home</a>
          <a href="#features" className="hover:text-gray-200 transition duration-200">Features</a>
          <a href="#about" className="hover:text-gray-200 transition duration-200">About</a>
          <a href="#contact" className="hover:text-gray-200 transition duration-200">Contact</a>
        </nav>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative bg-gray-800/60 backdrop-blur-sm p-8 rounded-lg shadow-lg border border-gray-700/60 w-full max-w-md">
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-100 mb-2">Create Account</h2>
              <p className="text-gray-400 text-sm">Join AdNetwork and start selling</p>
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-200 p-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-gray-700/50 border border-gray-600 text-gray-100 p-3 pl-10 rounded-lg focus:outline-none focus:border-gray-500 focus:bg-gray-700 transition duration-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Email Address</label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-gray-700/50 border border-gray-600 text-gray-100 p-3 pl-10 rounded-lg focus:outline-none focus:border-gray-500 focus:bg-gray-700 transition duration-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Password</label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="password"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-gray-700/50 border border-gray-600 text-gray-100 p-3 pl-10 rounded-lg focus:outline-none focus:border-gray-500 focus:bg-gray-700 transition duration-200"
                    required
                  />
                </div>
                <p className="text-gray-500 text-xs mt-1">Minimum 8 characters recommended</p>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Location</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Your city or area"
                    value={userLocation}
                    onChange={e => setUserLocation(e.target.value)}
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
                <p className="text-gray-500 text-xs mt-1">This helps buyers find items near them</p>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">WhatsApp Number</label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="tel"
                    placeholder="+94 77 123 4567"
                    value={whatsappNumber}
                    onChange={e => setWhatsappNumber(e.target.value)}
                    className="w-full bg-gray-700/50 border border-gray-600 text-gray-100 p-3 pl-10 rounded-lg focus:outline-none focus:border-gray-500 focus:bg-gray-700 transition duration-200"
                  />
                </div>
                <p className="text-gray-500 text-xs mt-1">For direct communication with buyers</p>
              </div>
            </div>

            <div className="pt-2">
              <div className="bg-gray-700/30 border border-gray-600/50 rounded-lg p-4 mb-4">
                <p className="text-gray-300 text-xs leading-relaxed">
                  By creating an account, you agree to our{" "}
                  <a href="/terms" className="text-gray-200 hover:text-white transition duration-200">Terms of Service</a>{" "}
                  and{" "}
                  <a href="/privacy" className="text-gray-200 hover:text-white transition duration-200">Privacy Policy</a>.
                </p>
              </div>

              <button
                type="submit"
                onClick={handleSubmit}
                className="w-full bg-gray-700 hover:bg-gray-600 text-gray-100 font-medium py-3 rounded-lg border border-gray-600 transition duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              >
                Create Account
              </button>
            </div>

            <div className="text-center pt-4 border-t border-gray-700">
              <p className="text-gray-400 text-sm">
                Already have an account?{" "}
                <a href="/signin" className="text-gray-200 hover:text-white font-medium transition duration-200">
                  Sign in
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-6 text-center text-gray-500 text-sm bg-gray-900/95">
        © {new Date().getFullYear()} AdNetwork. All rights reserved. | Professional classified solutions for Sri Lanka.
      </footer>
    </div>
  );
}
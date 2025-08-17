import { Link, useLocation, useNavigate } from "react-router";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation(); // Get current URL
  const navigate = useNavigate(); // Navigate programmatically

  useEffect(() => {
    const token = localStorage.getItem("jwt");
    setIsAuthenticated(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("jwt");
    setIsAuthenticated(false);
    navigate("/signin");
  };

  return (
    <nav className="flex justify-between items-center px-6 py-5 border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm">
      {/* Logo / Home link */}
      <Link
        to="/"
        className="flex items-center space-x-3 hover:opacity-80 transition duration-200"
      >
        <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center border border-gray-600">
          <span className="text-gray-200 font-bold text-lg">A</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-100">
          Agriලංකා
        </h1>
      </Link>

      {/* Right side nav */}
      <div className="flex items-center space-x-3">
        {isAuthenticated ? (
          <>
            {location.pathname === "/profile" ? (
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-red-400 hover:text-red-300 transition duration-200"
              >
                Logout
              </button>
            ) : (
              <Link
                to="/profile"
                className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center border border-gray-600 hover:bg-gray-600 transition duration-200"
                title="Profile"
              >
                <svg
                  className="w-5 h-5 text-gray-200"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            )}
          </>
        ) : (
          <Link
            to="/signin"
            className="px-4 py-2 text-gray-300 font-medium hover:text-gray-100 transition duration-200"
          >
            Sign In
          </Link>
        )}

        <Link
          to="/Browse-Ads"
          className="px-6 py-2 bg-gray-700 text-gray-100 font-medium rounded-lg border border-gray-600 hover:bg-gray-600 transition duration-200"
        >
          Marketplace
        </Link>
      </div>
    </nav>
  );
}

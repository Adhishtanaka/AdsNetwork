import { useState, useEffect } from "react";
import { Routes, Route } from "react-router";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/public/Home";
import Signin from "./pages/auth/Signin";
import Signup from "./pages/auth/Signup";
import Profile from "./pages/auth/Profile";
import AddAdPage from "./pages/ads/AddAds";
import SearchAds from "./pages/ads/AllAds";
import SingleAdPage from "./pages/ads/SingleAds";
import UpdateAdPage from "./pages/ads/UpdateAds";
import ChatWidget from "./components/Chatbot";
import AdminProfile from "./pages/auth/AdminProfile"; 

// Custom hook to determine user role
function useUserRole() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const determineUserRole = () => {
      const token = localStorage.getItem("jwt");
      
      if (!token) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const userEmail = payload?.email;
        
        // Check if user is admin based on email domain
        const isAdminUser = userEmail && userEmail.endsWith("@agrilanka.com");
        setIsAdmin(isAdminUser);
        
        console.log("User email:", userEmail);
        console.log("Is admin:", isAdminUser);
        
      } catch (err) {
        console.error("Invalid JWT:", err);
        setIsAdmin(false);
      }
      
      setLoading(false);
    };

    determineUserRole();
  }, []);

  return { isAdmin, loading };
}

// Profile page component that uses the custom hook
function ProfilePage() {
  const { isAdmin, loading } = useUserRole();

  // Show loading state while determining user role
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }
  
  // Render appropriate profile component based on user role
  return isAdmin ? <AdminProfile /> : <Profile />;
}

function App() {
  return (
    <div className="App">
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/browse-ads" element={<SearchAds />} />
          <Route path="/browse-ads/:id" element={<SingleAdPage />} />
          
          {/* Protected routes for authenticated users */}
          <Route
            path="/ads/add"
            element={
              <ProtectedRoute>
                <AddAdPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ads/update/:id"
            element={
              <ProtectedRoute>
                <UpdateAdPage />
              </ProtectedRoute>
            }
          />
          
          {/* Profile route with role-based component rendering */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
        </Routes>
        
        {/* Fixed position chat widget */}
        <div className="fixed bottom-4 right-4">
          <ChatWidget />
        </div>
      </main>
    </div>
  );
}

export default App;
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

function getProfileComponent() {
  const token = localStorage.getItem("jwt");
  if (!token) return <Profile />; 

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const userEmail = payload?.email;

    if (userEmail && userEmail.endsWith("@agrilanka.com")) {
      return <AdminProfile />;
    } else {
      return <Profile />;
    }
  } catch (err) {
    console.error("Invalid JWT:", err);
    return <Profile />;
  }
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

          {/* ✅ Proper route for profile/admin-profile */}
          <Route
            path="/profile"
            element={<ProtectedRoute>{getProfileComponent()}</ProtectedRoute>}
          />
        </Routes>

        {/* Chat Widget with margin */}
        <div className="fixed bottom-4 right-4">
          <ChatWidget />
        </div>
      </main>
    </div>
  );
}

export default App;

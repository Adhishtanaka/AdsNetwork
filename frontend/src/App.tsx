import { Routes, Route } from 'react-router';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/public/Home';
import Signin from './pages/auth/Signin';
import Signup from './pages/auth/Signup';
import Profile from './pages/auth/Profile';
import AddAdPage from './pages/ads/AddAds';
import SearchAds from './pages/ads/AllAds';
import SingleAdPage from './pages/ads/SingleAds';

function App() {
  return (
      <div className="App">
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signin" element={<Signin />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/ads/add" element={<AddAdPage />} />
            <Route path='/browse-ads' element={<SearchAds />} />
            <Route path='/browse-ads/:id' element={<SingleAdPage/>}/>
            <Route path='/profile' element={
              // <ProtectedRoute>
                <Profile />
              // {/* </ProtectedRoute> */}
            } />
            
          </Routes>
        </main>
      </div>
  );
}

export default App;


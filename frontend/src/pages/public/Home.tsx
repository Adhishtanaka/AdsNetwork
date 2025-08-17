import { useState } from "react";
import { 
  MagnifyingGlassIcon, 
  MapPinIcon, 
  ArrowRightIcon
} from "@heroicons/react/24/outline";
import Navbar from "../../components/Navbar";
import { Link, useNavigate } from "react-router";
import Footer from "../../components/Footer";
import { locations } from "../../constants/data";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const navigate = useNavigate();

  const handleSearch = () => {
    // Create URL parameters object
    const params = new URLSearchParams();
    
    // Add search query if it exists
    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim());
    }
    
    // Add location if it's not "All Locations"
    if (selectedLocation && selectedLocation !== "All Locations") {
      params.set("location", selectedLocation);
    }
    
    // Navigate to browse-ads with parameters
    const queryString = params.toString();
    const url = queryString ? `/browse-ads?${queryString}` : "/browse-ads";
    navigate(url);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Team members data
  const teamMembers = [
    {
      name: "Isara Madunika",
      image: "i.png" // You'll need to add this image
    },
    {
      name: "Kavindu Shehan",
      image: "k.png" // You'll need to add this image
    },
    {
      name: "Samsudeen Ashad",
      image: "s.png" // You'll need to add this image
    },
    {
      name: "Adhishtanaka Kulasooriya",
      image: "a.png" // You'll need to add this image
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
      {/* Fixed background container */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gray-700/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gray-600/10 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
      </div>

      <Navbar />

      {/* Hero Section */}
      <section className="flex flex-col items-center text-center py-20 px-4 max-w-6xl mx-auto w-full">
        <h2 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6 max-w-4xl">
          <span className="text-gray-100">Professional</span>{' '}
          <span className="text-gray-400">Classified Network</span>
        </h2>
        <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
          Connect buyers and sellers across Sri Lanka through our comprehensive classified advertising platform. 
          Trusted by thousands of businesses and individuals nationwide.
        </p>

        {/* Search Interface */}
        <div className="w-full max-w-4xl mb-16 px-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-1 flex flex-col md:flex-row">
            <div className="flex-1 flex items-center px-4 py-4 border-b border-gray-700 md:border-b-0 md:border-r">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-500 mr-3 flex-shrink-0" />
              <input 
                type="text" 
                placeholder="Search products, services..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 outline-none text-gray-200 placeholder-gray-500 bg-transparent min-w-0"
              />
            </div>
            <div className="flex items-center px-4 py-4 border-b border-gray-700 md:border-b-0 md:border-r min-w-0">
              <MapPinIcon className="w-5 h-5 text-gray-500 mr-3 flex-shrink-0" />
              <select 
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="outline-none text-gray-200 bg-transparent cursor-pointer min-w-0"
              >
                {locations.map((loc, idx) => (
                  <option key={idx} value={loc} className="bg-gray-800">{loc}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={handleSearch}
              className="bg-gray-700 hover:bg-gray-600 text-gray-100 px-6 py-4 rounded-md font-medium transition duration-200 border border-gray-600 md:px-8 group"
            >
              <span className="flex items-center">
                Search
                <MagnifyingGlassIcon className="ml-2 w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
              </span>
            </button>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => console.log("Navigate to browse-ads")}
            className="group inline-flex items-center justify-center px-8 py-4 bg-gray-700 rounded-lg text-gray-100 font-semibold border border-gray-600 hover:bg-gray-600 transition duration-200">
            Browse Listings
            <ArrowRightIcon className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
          <button
            onClick={() => console.log("Navigate to add ad")}
            className="inline-flex items-center justify-center px-8 py-4 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 font-semibold hover:bg-gray-700 hover:text-gray-100 transition duration-200">
            List Your Business
          </button>
        </div>
      </section>

      {/* About Us Section */}
      <section className="py-20 px-4 max-w-6xl mx-auto w-full">
        <div className="text-center mb-16">
          <h3 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            <span className="text-gray-100">Meet Our</span>{' '}
            <span className="text-gray-400">Team</span>
          </h3>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            We are a dedicated team of professionals committed to revolutionizing the classified advertising 
            experience in Sri Lanka. Our diverse expertise drives innovation and excellence in everything we do.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamMembers.map((member, index) => (
            <div 
              key={index}
              className="group relative bg-gray-800 rounded-lg border border-gray-700 p-6 hover:bg-gray-750 transition-all duration-300 hover:border-gray-600"
            >
              {/* Avatar Container */}
              <div className="relative mb-4">
                <div className="w-32 h-32 mx-auto rounded-full overflow-hidden bg-gray-700 border-2 border-gray-600 group-hover:border-gray-500 transition-colors duration-300">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              </div>

              {/* Name */}
              <h4 className="text-xl font-semibold text-gray-100 text-center group-hover:text-white transition-colors duration-300">
                {member.name}
              </h4>

              {/* Subtle hover effect */}
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-gray-700/5 to-gray-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          ))}
        </div>

        {/* Team description */}
        <div className="mt-16 text-center">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 max-w-4xl mx-auto">
            <p className="text-lg text-gray-300 leading-relaxed">
              Together, we bring years of combined experience in technology, business development, 
              and customer service. Our mission is to create the most trusted and efficient 
              classified advertising platform that serves the diverse needs of Sri Lankan communities.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
import { 
  MagnifyingGlassIcon, 
  MapPinIcon, 
  ArrowRightIcon
} from "@heroicons/react/24/outline";
import Navbar from "../../components/Navbar";
import { Link } from "react-router";
import Footer from "../../components/Footer";

const locations = [
  "All Locations",
  "Colombo",
  "Gampaha",
  "Kalutara",
  "Kandy",
  "Matale",
  "Nuwara Eliya",
  "Galle",
  "Matara",
  "Hambantota",
  "Jaffna",
  "Kilinochchi",
  "Mannar",
  "Vavuniya",
  "Mullaitivu",
  "Batticaloa",
  "Ampara",
  "Trincomalee",
  "Kurunegala",
  "Puttalam",
  "Anuradhapura",
  "Polonnaruwa",
  "Badulla",
  "Monaragala",
  "Ratnapura",
  "Kegalle"
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans relative overflow-x-hidden">
      {/* Subtle background elements */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-gray-700/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-gray-600/10 rounded-full blur-3xl"></div>
      </div>

      <Navbar />

      {/* Hero Section */}
      <section className="flex flex-col items-center text-center py-20 px-4 max-w-6xl mx-auto">
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
                className="flex-1 outline-none text-gray-200 placeholder-gray-500 bg-transparent min-w-0"
              />
            </div>
            <div className="flex items-center px-4 py-4 border-b border-gray-700 md:border-b-0 md:border-r min-w-0">
              <MapPinIcon className="w-5 h-5 text-gray-500 mr-3 flex-shrink-0" />
              <select className="outline-none text-gray-200 bg-transparent cursor-pointer min-w-0">
                {locations.map((loc, idx) => (
                  <option key={idx} className="bg-gray-800">{loc}</option>
                ))}
              </select>
            </div>
            <button className="bg-gray-700 hover:bg-gray-600 text-gray-100 px-6 py-4 rounded-md font-medium transition duration-200 border border-gray-600 md:px-8">
              Search
            </button>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            to="/browse-ads"
            className="group inline-flex items-center justify-center px-8 py-4 bg-gray-700 rounded-lg text-gray-100 font-semibold border border-gray-600 hover:bg-gray-600 transition duration-200">
            Browse Listings
            <ArrowRightIcon className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
          <Link
            to="/ads/add"
            className="inline-flex items-center justify-center px-8 py-4 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 font-semibold hover:bg-gray-700 hover:text-gray-100 transition duration-200">
            List Your Business
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}

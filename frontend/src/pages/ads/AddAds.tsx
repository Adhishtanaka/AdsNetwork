import {
  PhotoIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  XMarkIcon,
  MapPinIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { useState } from "react";
import {jwtDecode} from "jwt-decode";
import ngeohash from "ngeohash";
import LocationPicker from "../../components/MapPicker";
import { apiService } from "../../services/api";
import Navbar from "../../components/Navbar";
import type { FormDataType, Photo, LocationData, SubmissionState } from "../../constants/types";

export default function AddAdPage() {
  const [formData, setFormData] = useState<FormDataType>({
    title: "",
    description: "",
    price: "",
    location: "",
    category: "",
    photos: []
  });

  const [dragActive, setDragActive] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [submission, setSubmission] = useState<SubmissionState>({
    isSubmitting: false,
    isSuccess: false,
    error: null,
    progress: ''
  });

  const categories = [
    "Electronics & Technology",
    "Vehicles & Transport",
    "Real Estate",
    "Fashion & Beauty",
    "Home & Garden",
    "Sports & Recreation",
    "Business Services",
    "Jobs & Employment"
  ];

const locations = [
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


  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const validateFiles = (files: FileList): File[] => {
    const validFiles: File[] = [];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    Array.from(files).forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        alert(`${file.name} is not a valid image type. Please use JPG, PNG, or WebP.`);
        return;
      }
      
      if (file.size > maxSize) {
        alert(`${file.name} is too large. Maximum file size is 5MB.`);
        return;
      }
      
      validFiles.push(file);
    });

    return validFiles;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    
    const validFiles = validateFiles(files);
    const availableSlots = 6 - formData.photos.length;
    const filesToAdd = validFiles.slice(0, availableSlots);

    if (validFiles.length > availableSlots) {
      alert(`You can only upload ${availableSlots} more photos. Maximum 6 photos allowed.`);
    }

    const newPhotos: Photo[] = filesToAdd.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9)
    }));

    setFormData((prev) => ({
      ...prev,
      photos: [...prev.photos, ...newPhotos]
    }));
  };

  const removePhoto = (photoId: string) => {
    const photoToRemove = formData.photos.find(p => p.id === photoId);
    if (photoToRemove) {
      URL.revokeObjectURL(photoToRemove.url); // Clean up memory
    }
    
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((photo) => photo.id !== photoId)
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.title.trim()) return "Title is required";
    if (!formData.description.trim()) return "Description is required";
    if (!formData.price) return "Price is required";
    if (!formData.category) return "Category is required";
    if (!formData.location) return "Location is required";
    if (!coordinates) return "Please select a location on the map";
    if (formData.photos.length === 0) return "At least one photo is required";
    
    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) return "Please enter a valid price";
    
    return null;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    setSubmission({
      isSubmitting: true,
      isSuccess: false,
      error: null,
      progress: 'Preparing your advertisement...'
    });

    try {
      // Get userEmail from JWT
      const token = localStorage.getItem('jwt');
      let userEmail = '';
      if (token) {
        try {
          const decoded = jwtDecode<{ email?: string }>(token);
          userEmail = decoded.email || '';
        } catch {
          userEmail = '';
        }
      }

      // Prepare location data
      let locationObj: LocationData;
      if (formData.location && coordinates) {
        locationObj = {
          name: formData.location,
          lat: coordinates.lat,
          lng: coordinates.lng,
          geohash: ngeohash.encode(coordinates.lat, coordinates.lng)
        };
        setLocationData(locationObj);
      } else {
        throw new Error("Location data is missing");
      }

      // Update progress
      setSubmission(prev => ({ ...prev, progress: 'Uploading images...' }));

      // Prepare form data for API
      const adFormData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: formData.price,
        location: locationObj,
        category: formData.category,
        userEmail
      };

      // Extract files from photos
      const imageFiles = formData.photos.map(photo => photo.file);

      // Update progress
      setSubmission(prev => ({ ...prev, progress: 'Creating advertisement...' }));

      // Submit to API (this will handle both image upload and ad creation)
      const response = await apiService.createAdvertisementWithImages(adFormData, imageFiles);

      if (response.success) {
        setSubmission({
          isSubmitting: false,
          isSuccess: true,
          error: null,
          progress: 'Advertisement published successfully!'
        });

        // Reset form after successful submission
        setTimeout(() => {
          setFormData({
            title: "",
            description: "",
            price: "",
            location: "",
            category: "",
            photos: []
          });
          setCoordinates(null);
          setLocationData(null);
          setSubmission({
            isSubmitting: false,
            isSuccess: false,
            error: null,
            progress: ''
          });
        }, 3000);

      } else {
        throw new Error(response.error || 'Failed to create advertisement');
      }

    } catch (error) {
      console.error('Submission error:', error);
      setSubmission({
        isSubmitting: false,
        isSuccess: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        progress: ''
      });
    }
  };

  const resetSubmission = () => {
    setSubmission({
      isSubmitting: false,
      isSuccess: false,
      error: null,
      progress: ''
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <Navbar />

      {/* Submission Status Modal */}
      {(submission.isSubmitting || submission.isSuccess || submission.error) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
            {submission.isSubmitting && (
              <div className="text-center">
                <ArrowPathIcon className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-100 mb-2">Publishing Advertisement</h3>
                <p className="text-gray-300">{submission.progress}</p>
              </div>
            )}
            
            {submission.isSuccess && (
              <div className="text-center">
                <CheckCircleIcon className="w-8 h-8 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-100 mb-2">Success!</h3>
                <p className="text-gray-300">{submission.progress}</p>
              </div>
            )}
            
            {submission.error && (
              <div className="text-center">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-100 mb-2">Error</h3>
                <p className="text-gray-300 mb-4">{submission.error}</p>
                <button
                  onClick={resetSubmission}
                  className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition duration-200"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        {/* Basic Info */}
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
          <h3 className="text-xl font-semibold text-gray-100 mb-6 flex items-center">
            <DocumentTextIcon className="w-5 h-5 mr-2" />
            Basic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Advertisement Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter a descriptive title for your ad"
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:border-gray-500 focus:outline-none transition duration-200"
                required
                disabled={submission.isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-gray-100 focus:border-gray-500 focus:outline-none transition duration-200"
                required
                disabled={submission.isSubmitting}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Location *
              </label>
              <select
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-gray-100 focus:border-gray-500 focus:outline-none transition duration-200"
                required
                disabled={submission.isSubmitting}
              >
                <option value="">Select location</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Price (LKR) *
              </label>
              <div className="relative">
                <CurrencyDollarIcon className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:border-gray-500 focus:outline-none transition duration-200"
                  required
                  disabled={submission.isSubmitting}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={6}
                placeholder="Provide detailed description of your item or service..."
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:border-gray-500 focus:outline-none resize-vertical transition duration-200"
                required
                disabled={submission.isSubmitting}
              ></textarea>
            </div>
          </div>
        </div>

        {/* Photo Upload */}
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
          <h3 className="text-xl font-semibold text-gray-100 mb-6 flex items-center">
            <PhotoIcon className="w-5 h-5 mr-2" />
            Photos ({formData.photos.length}/6) *
          </h3>

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition duration-200 ${
              dragActive 
                ? "border-gray-500 bg-gray-800/50" 
                : "border-gray-600 hover:border-gray-500"
            } ${submission.isSubmitting ? 'opacity-50 pointer-events-none' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <PhotoIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <div className="mb-4">
              <p className="text-gray-300 font-medium mb-2">Drag and drop photos here, or click to select</p>
              <p className="text-gray-500 text-sm">Upload up to 6 photos (JPG, PNG, WebP, max 5MB each)</p>
            </div>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
              id="photo-upload"
              disabled={submission.isSubmitting}
            />
            <label
              htmlFor="photo-upload"
              className={`inline-flex items-center px-4 py-2 bg-gray-700 text-gray-200 rounded-lg cursor-pointer hover:bg-gray-600 transition duration-200 ${
                submission.isSubmitting ? 'cursor-not-allowed' : ''
              }`}
            >
              Choose Files
            </label>
          </div>

          {formData.photos.length > 0 && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
              {formData.photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.url}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-lg border border-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.id)}
                    className="absolute top-2 right-2 p-1 bg-gray-900/80 rounded-full text-gray-300 hover:text-red-400 transition duration-200"
                    disabled={submission.isSubmitting}
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map Location Picker */}
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
          <h3 className="text-xl font-semibold text-gray-100 mb-6 flex items-center">
            <MapPinIcon className="w-5 h-5 mr-2" />
            Pick Location on Map *
          </h3>
          <div className={submission.isSubmitting ? 'opacity-50 pointer-events-none' : ''}>
            <LocationPicker onLocationSelect={(lat, lng) => setCoordinates({ lat, lng })} />
          </div>
          {coordinates && (
            <p className="mt-2 text-gray-300 text-sm">
              Selected: Lat {coordinates.lat.toFixed(5)}, Lng {coordinates.lng.toFixed(5)}
              {locationData && (
                <span className="block">Geohash: {locationData.geohash}</span>
              )}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
          <button
            type="submit"
            disabled={submission.isSubmitting}
            className={`px-8 py-3 font-semibold rounded-lg border transition duration-200 ${
              submission.isSubmitting
                ? 'bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600'
            }`}
          >
            {submission.isSubmitting ? (
              <span className="flex items-center">
                <ArrowPathIcon className="w-4 h-4 animate-spin mr-2" />
                Publishing...
              </span>
            ) : (
              'Publish Advertisement'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
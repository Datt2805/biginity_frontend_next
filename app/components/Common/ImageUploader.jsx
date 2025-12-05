"use client";
import React, { useState } from "react";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
// Make sure this path is correct for your SDK file
import { uploadFile } from "../../../lib/api/app-SDK"; 
import { 
  UploadCloud, 
  X, 
  Image as ImageIcon, 
  Check, 
  Loader2 
} from "lucide-react";

const ImageUploader = ({ onUploadSuccess }) => {
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    setUploadedImageUrl("");
  };

  const successCallback = (data) => {
    setUploadedImageUrl(data.url);
    onUploadSuccess(data.url);
    setLoading(false);
    toast.success("Image uploaded successfully!");
  };

  const errorCallback = (error) => {
    setLoading(false);
    toast.error("Image upload failed: " + error.message);
    console.error("Error uploading image:", error);
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!imagePreview) {
      toast.error("Please select a file first.");
      return;
    }
    setLoading(true);
    uploadFile.handler(successCallback, errorCallback)(e);
  };

  const handleRemove = () => {
    if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setUploadedImageUrl("");
    onUploadSuccess("");
    
    // Optional: clear the file input value so selecting the same file works again
    const fileInput = document.getElementById("eventImage");
    if(fileInput) fileInput.value = "";
  };

  return (
    <form
      onSubmit={handleUploadSubmit}
      className="w-full"
    >
      {/* ✅ FIX: INPUT MOVED HERE (Always in DOM, always hidden) */}
      <input
        type="file"
        id="eventImage"
        name="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={loading}
        className="hidden"
      />

      {!imagePreview ? (
        /* --- 1. EMPTY STATE (Upload Trigger) --- */
        <label
          htmlFor="eventImage"
          className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-200 group"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <div className="p-3 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-8 h-8 text-indigo-500" />
            </div>
            <p className="mb-1 text-sm text-gray-700 font-medium">
              <span className="font-semibold text-indigo-600">Click to upload</span> 
            </p>
            <p className="text-xs text-gray-500">SVG, PNG, JPG or GIF</p>
          </div>
          {/* Input removed from here */}
        </label>
      ) : (
        /* --- 2. PREVIEW STATE --- */
        <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200 group bg-gray-100">
           {/* Image */}
           <img
             src={imagePreview}
             alt="Preview"
             className="w-full h-full object-cover"
           />
           
           {/* Overlay Gradient */}
           <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

           {/* Remove Button */}
           {!loading && !uploadedImageUrl && (
               <button
                 type="button"
                 onClick={handleRemove}
                 className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-full shadow-sm backdrop-blur-sm transition-all transform hover:scale-105"
                 title="Remove image"
               >
                 <X size={18} />
               </button>
           )}

           {/* Status Badge */}
           {uploadedImageUrl && (
             <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                <div className="bg-green-500 text-white px-4 py-2 rounded-full flex items-center shadow-lg font-medium text-sm animate-in zoom-in">
                    <Check size={16} className="mr-2" /> Upload Complete
                </div>
             </div>
           )}
        </div>
      )}

      {/* --- 3. ACTION BUTTON --- */ }
      {imagePreview && !uploadedImageUrl && (
        <button
            type="submit"
            disabled={loading}
            className={`w-full mt-3 flex items-center justify-center py-2.5 px-4 rounded-lg text-sm font-medium text-white transition-all shadow-sm ${
                loading 
                ? "bg-indigo-400 cursor-wait" 
                : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-md active:scale-95"
            }`}
        >
            {loading ? (
                <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Uploading...
                </>
            ) : (
                <>
                    <ImageIcon size={16} className="mr-2" />
                    Confirm & Upload
                </>
            )}
        </button>
      )}

      {/* Hidden input to store URL for parent form */}
      {uploadedImageUrl && (
        <input type="hidden" name="image_url" value={uploadedImageUrl} />
      )}
    </form>
  );
};

ImageUploader.propTypes = {
  onUploadSuccess: PropTypes.func.isRequired,
};

export default ImageUploader;
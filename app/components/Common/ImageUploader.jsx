'use client';
import React, { useState } from "react";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
import { uploadFile } from "../../../lib/api/app-SDK";

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

  return (
    <form
      onSubmit={handleUploadSubmit}
      className="flex flex-col gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200"
    >
      <label
        htmlFor="eventImage"
        className="text-sm font-semibold text-gray-700"
      >
        Upload Speaker Image <span className="text-red-500">*</span>
      </label>

      <input
        type="file"
        id="eventImage"
        name="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={loading}
        className="file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-100 file:text-green-700 hover:file:bg-green-200 cursor-pointer"
      />

      {imagePreview && (
        <div className="flex items-center gap-4 mt-2">
          <img
            src={imagePreview}
            alt="Preview"
            className="w-20 h-20 object-cover rounded-lg border"
          />
          <button
            type="button"
            onClick={() => {
              URL.revokeObjectURL(imagePreview);
              setImagePreview(null);
              setUploadedImageUrl("");
              onUploadSuccess("");
            }}
            className="text-sm text-red-500 hover:text-red-700 font-medium"
          >
            Remove
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={!imagePreview || uploadedImageUrl || loading}
        className={`px-4 py-2 rounded-lg text-white font-medium ${
          loading
            ? "bg-green-400 cursor-wait"
            : uploadedImageUrl
            ? "bg-green-500 cursor-default"
            : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {loading ? "Uploading..." : uploadedImageUrl ? "Uploaded" : "Upload"}
      </button>

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

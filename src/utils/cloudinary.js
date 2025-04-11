const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dfwv6qzrx',
  api_key: '871617722336997',
  api_secret: 'V8dGM45abZbk6ec6G2Dna79MmsM',
});

/**
 * Upload an image to Cloudinary
 * @param {string} filePath - Path to the image file
 * @param {string} folder - Folder name in Cloudinary (optional)
 * @returns {Promise<Object>} - Cloudinary upload result
 */
const uploadImage = async (filePath, folder = 'categories') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto',
    });
    return result;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
};

/**
 * Delete an image from Cloudinary
 * @param {string} publicId - Public ID of the image in Cloudinary
 * @returns {Promise<Object>} - Cloudinary delete result
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw new Error('Failed to delete image from Cloudinary');
  }
};

module.exports = {
  uploadImage,
  deleteImage,
};

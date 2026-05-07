import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'EasyDeal',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      {
        quality: 'auto',
        fetch_format: 'auto', // serves webp/avif automatically
        width: 1200, // resize to max 1200px width
        crop: 'limit', // won't upscale smaller images
      },
    ],
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per image
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only jpg, png and webp images are allowed'), false);
    }
  },
});

export default cloudinary;

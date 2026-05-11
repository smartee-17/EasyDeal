import { sendResponse } from '../library/utils.js';
import Product from '../models/product.model.js';
import cloudinary from '../../config/cloudinary.js';
import { generateAltText } from '../library/visionAi.js';

export const getAllProducts = async (req, res) => {
  try {
    // TODO: We use populate after user model is defined
    // const products = await Product.find().populate('seller', 'name');
    const products = await Product.find();

    return sendResponse(
      res,
      200,
      true,
      'Products retrieved successfully',
      products,
    );
  } catch (error) {
    console.error(`Error in getAllProducts: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: We use populate after user model is defined
    // const product = await Product.findById(id).populate('seller', 'name');
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return sendResponse(
      res,
      200,
      true,
      'Product retrieved successfully',
      product,
    );
  } catch (error) {
    console.error(`Error in getProduct: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { _id } = req.user;
    const { title, description, category, price } = req.body;

    // Multiple images from Cloudinary
    if (req.files && req.files.length > 5) {
      return res.status(400).json({ message: 'Maximum of 5 images allowed' });
    }

    // Process images and generate alts
    const images = await Promise.all(
      (req.files || []).map(async (file, index) => {
        const cloudinaryUrl = file.path;

        // Call the separate AI function
        const aiDescription = await generateAltText(cloudinaryUrl, description);

        return {
          url: cloudinaryUrl,
          publicId: file.filename,
          // Use AI description if it exists, otherwise use fallback title
          alt: {
            detailed:
              aiDescription !== null
                ? `${title} - ${aiDescription.detailed}`
                : `${title} - Image ${index + 1}`,
            short:
              aiDescription !== null
                ? `${title} - ${aiDescription.short}`
                : `${title} - Image ${index + 1}`,
            standard:
              aiDescription !== null
                ? `${title} - ${aiDescription.standard}`
                : `${title} - Image ${index + 1}`,
          },
        };
      }),
    );

    const product = new Product({
      title,
      description,
      category,
      price,
      images,
      seller: _id,
    });

    await product.save();

    return sendResponse(
      res,
      201,
      true,
      'Product created successfully',
      product,
    );
  } catch (error) {
    console.error(`Error in createProduct: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { _id } = req.user;
    const { id } = req.params;
    const { title, description, category, price, isAvailable } = req.body;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // If new images are uploaded
    if (req.files && req.files.length > 5) {
      return res.status(400).json({ message: 'Maximum of 5 images allowed' });
    }

    if (req.files && req.files.length > 0) {
      // Delete old images from Cloudinary
      for (const image of product.images) {
        await cloudinary.uploader.destroy(image.publicId);
      }

      // Set new images
      product.images = req.files.map((file) => ({
        url: file.path,
        publicId: file.filename,
      }));
    }

    product.title = title || product.title;
    product.description = description || product.description;
    product.category = category || product.category;
    product.price = price || product.price;
    product.isAvailable = isAvailable ?? product.isAvailable;

    await product.save();

    return sendResponse(
      res,
      200,
      true,
      'Product updated successfully',
      product,
    );
  } catch (error) {
    console.error(`Error in updateProduct: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        await cloudinary.uploader.destroy(image.publicId);
      }
    }

    return sendResponse(
      res,
      200,
      true,
      'Product deleted successfully',
      product,
    );
  } catch (error) {
    console.error(`Error in deleteProduct: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

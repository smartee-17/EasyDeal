import { sendResponse } from '../library/utils.js';
import Product from '../models/product.model.js';
import Tag from '../models/tag.model.js';
import cloudinary, { upload } from '../../config/cloudinary.js';
import { generateAltText } from '../library/visionAi.js';
import { CATEGORY_ATTRIBUTES } from '../library/constants/categoryAttributes.constants.js';

/**
 * Parses tags from the request body into a clean array of tag name strings.
 * Handles three shapes the client might send:
 *   - a real array (application/json requests): ["samsung", "smartphones"]
 *   - a JSON string (multipart form-data): '["samsung", "smartphones"]'
 *   - a JS-style stringified array (bad client serialization):
 *     "[ 'samsung', 'smartphones' ]"
 *
 * @param {string | string[]} rawTags
 * @returns {string[]}
 */
const parseTagNames = (rawTags) => {
  if (!rawTags) return [];

  if (Array.isArray(rawTags)) {
    return rawTags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  if (typeof rawTags === 'string') {
    // Try proper JSON first
    try {
      const parsed = JSON.parse(rawTags);
      if (Array.isArray(parsed)) {
        return parsed.map((tag) => String(tag).trim()).filter(Boolean);
      }
    } catch (parseError) {
      // Not valid JSON — fall through to manual parsing below
    }

    // Fallback: handle a JS-style array string, e.g. "[ 'samsung', 'smartphones' ]"
    const stripped = rawTags.trim().replace(/^\[/, '').replace(/\]$/, '');
    return stripped
      .split(',')
      .map((tag) => tag.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);
  }

  return [];
};

/**
 * Resolves an array of tag names into Tag ObjectIds, creating any
 * tags that don't already exist. This is required because Product.tags
 * stores ObjectId references, not raw strings.
 *
 * @param {string[]} tagNames
 * @returns {Promise<import('mongoose').Types.ObjectId[]>}
 */
const resolveTagIds = async (tagNames) => {
  const normalizedNames = [
    ...new Set(tagNames.map((name) => name.toLowerCase().trim())),
  ].filter(Boolean);

  const tagDocs = await Promise.all(
    normalizedNames.map((name) =>
      Tag.findOneAndUpdate(
        { name },
        {
          $setOnInsert: {
            name,
            slug: name.replace(/\s+/g, '-'),
          },
        },
        { upsert: true, new: true },
      ),
    ),
  );

  return tagDocs.map((doc) => doc._id);
};

/**
 * Validates submitted specifications against the attribute template
 * defined for the given category.
 *
 * - Ensures all required attributes are present
 * - Ensures values for "select" type attributes are within the allowed options
 * - Ignores validation for categories with no template (falls back to free-form specs)
 *
 * @param {string} category
 * @param {Array<{key: string, label?: string, value: any}>} specifications
 * @returns {{ valid: boolean, message?: string }}
 */
const validateSpecifications = (category, specifications = []) => {
  const template = CATEGORY_ATTRIBUTES[category];

  // No template defined for this category — allow any specs through
  if (!template) {
    return { valid: true };
  }

  const providedMap = new Map(
    (specifications || []).map((spec) => [spec.key, spec.value]),
  );

  // Check required attributes are present
  const requiredKeys = template
    .filter((attr) => attr.required)
    .map((attr) => attr.key);
  const missing = requiredKeys.filter((key) => !providedMap.has(key));

  if (missing.length > 0) {
    return {
      valid: false,
      message: `Missing required specification(s): ${missing.join(', ')}`,
    };
  }

  // Check select-type attributes have valid values
  for (const attr of template) {
    if (attr.type === 'select' && providedMap.has(attr.key)) {
      const value = providedMap.get(attr.key);
      if (!attr.options.includes(value)) {
        return {
          valid: false,
          message: `Invalid value "${value}" for "${attr.label || attr.key}". Allowed: ${attr.options.join(', ')}`,
        };
      }
    }
  }

  return { valid: true };
};

/**
 * Normalizes incoming specifications into the { key, label, value } shape
 * stored on the Product document, filling in labels from the template
 * when the client only sends key/value.
 *
 * @param {string} category
 * @param {Array<{key: string, label?: string, value: any}>} specifications
 * @returns {Array<{key: string, label: string, value: any}>}
 */
const normalizeSpecifications = (category, specifications = []) => {
  const template = CATEGORY_ATTRIBUTES[category] || [];
  const labelByKey = new Map(template.map((attr) => [attr.key, attr.label]));

  return (specifications || []).map((spec) => ({
    key: spec.key,
    label: spec.label || labelByKey.get(spec.key) || spec.key,
    value: spec.value,
  }));
};

export const getAllProducts = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    const products = await Product.find(filter)
      .populate('category', 'name')
      .populate('seller', 'name whatsappNumber');

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

    const product = await Product.findById(id)
      .populate('category', 'name')
      .populate('seller', 'name whatsappNumber');

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
    const { title, description, category, price, tags, specifications } =
      req.body;

    if (req.files && req.files.length > 5) {
      return res.status(400).json({ message: 'Maximum of 5 images allowed' });
    }

    const tagNames = parseTagNames(tags);

    if (tagNames.length > 5) {
      return res.status(400).json({ message: 'Maximum of 5 tags allowed' });
    }

    const tagIds = await resolveTagIds(tagNames);

    // specifications may arrive as a JSON string when sent via multipart/form-data
    let parsedSpecifications = [];
    if (specifications) {
      try {
        parsedSpecifications =
          typeof specifications === 'string'
            ? JSON.parse(specifications)
            : specifications;
      } catch (parseError) {
        return res
          .status(400)
          .json({ message: 'Invalid specifications format' });
      }
    }

    const specValidation = validateSpecifications(
      category,
      parsedSpecifications,
    );
    if (!specValidation.valid) {
      return res.status(400).json({ message: specValidation.message });
    }

    const normalizedSpecifications = normalizeSpecifications(
      category,
      parsedSpecifications,
    );

    const images = await Promise.all(
      (req.files || []).map(async (file, index) => {
        const cloudinaryUrl = file.path;

        let aiDescription = null;
        try {
          aiDescription = await generateAltText(cloudinaryUrl, description);
        } catch (visionError) {
          // AI alt-text generation is a nice-to-have, not critical —
          // fall back to a generic alt text instead of failing the request.
          console.error(`generateAltText failed: ${visionError.message}`);
          aiDescription = null;
        }

        return {
          url: cloudinaryUrl,
          publicId: file.filename,
          alt:
            aiDescription !== null
              ? `${title} - ${aiDescription.detailed}`
              : `${title} - Image ${index + 1}`,
        };
      }),
    );

    const product = new Product({
      title,
      description,
      category,
      price,
      images,
      tags: tagIds,
      specifications: normalizedSpecifications,
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
    const { _id: userId } = req.user;
    const { id } = req.params;
    const { title, description, category, price, isAvailable, specifications } =
      req.body;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Multiple images from Cloudinary
    if (req.files && req.files.length > 5) {
      return res.status(400).json({ message: 'Maximum of 5 images allowed' });
    }

    // Optional: Ensure only the seller can update their own product
    if (product.seller.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: 'Not authorized to update this product' });
    }

    // Handle new images if they are provided in the request
    if (req.files && req.files.length > 0) {
      // 1. Purge old images from Cloudinary concurrently to boost performance
      if (product.images && product.images.length > 0) {
        const deletionPromises = product.images.map((image) =>
          cloudinary.uploader.destroy(image.publicId),
        );
        await Promise.all(deletionPromises);
      }

      // 2. Map and assign the new Cloudinary files to the product document
      product.images = req.files.map((file) => ({
        url: file.path, // Provided by the Cloudinary multer storage engine
        publicId: file.filename, // Vital for future deletions
      }));
    }

    // Handle specifications update — validate against the (possibly new) category
    if (specifications !== undefined) {
      let parsedSpecifications = [];
      try {
        parsedSpecifications =
          typeof specifications === 'string'
            ? JSON.parse(specifications)
            : specifications;
      } catch (parseError) {
        return res
          .status(400)
          .json({ message: 'Invalid specifications format' });
      }

      const effectiveCategory = category || product.category;
      const specValidation = validateSpecifications(
        effectiveCategory,
        parsedSpecifications,
      );
      if (!specValidation.valid) {
        return res.status(400).json({ message: specValidation.message });
      }

      product.specifications = normalizeSpecifications(
        effectiveCategory,
        parsedSpecifications,
      );
    }

    // Update text fields (fallback to existing values if not provided in req.body)
    product.title = title || product.title;
    product.description = description || product.description;
    product.category = category || product.category;
    product.price = price || product.price;
    product.isAvailable = isAvailable ?? product.isAvailable;

    // Persist changes to MongoDB
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

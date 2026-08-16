import { sendResponse } from '../library/utils.js';
import Product from '../models/product.model.js';
import Tag from '../models/tag.model.js';
import User from '../models/user.model.js';
import cloudinary, { upload } from '../../config/cloudinary.js';
import { generateAltText } from '../library/visionAi.js';
import { CATEGORY_ATTRIBUTES } from '../library/constants/categoryAttributes.constants.js';
import { cacheWrapper, cacheDelete } from '../cache/cache.wrapper.js';
import { CacheKeys } from '../cache/cache.keys.js';

/**
 * Parses tags from the request body into a clean array of tag name strings.
 * Handles a real array, a JSON string, or a JS-style stringified array.
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
    try {
      const parsed = JSON.parse(rawTags);
      if (Array.isArray(parsed)) {
        return parsed.map((tag) => String(tag).trim()).filter(Boolean);
      }
    } catch (parseError) {
      // Not valid JSON — fall through to manual parsing below
    }

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
 * tags that don't already exist.
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
 * @param {string} category
 * @param {Array<{key: string, label?: string, value: any}>} specifications
 * @returns {{ valid: boolean, message?: string }}
 */
const validateSpecifications = (category, specifications = []) => {
  const template = CATEGORY_ATTRIBUTES[category];

  if (!template) {
    return { valid: true };
  }

  const providedMap = new Map(
    (specifications || []).map((spec) => [spec.key, spec.value]),
  );

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
 * stored on the Product document.
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
    const {
      category, // comma-separated, e.g. "electronics,fashion"
      minPrice,
      maxPrice,
      condition, // comma-separated, e.g. "Brand new,Like new"
      location, // comma-separated, e.g. "Delhi,Noida"
    } = req.query;

    const filter = {};

    if (category) {
      const categories = category
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
      if (categories.length > 0) {
        filter.category =
          categories.length > 1 ? { $in: categories } : categories[0];
      }
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (condition) {
      const conditions = condition
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
      if (conditions.length > 0) {
        filter.specifications = {
          $elemMatch: { key: 'condition', value: { $in: conditions } },
        };
      }
    }

    if (location) {
      const locations = location
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean);
      if (locations.length > 0) {
        filter.location = { $in: locations };
      }
    }

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
    return sendResponse(res, 500, false, 'Internal server error');
    // return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await cacheWrapper({
      key: CacheKeys.product(id),
      ttl: 3600,
      fetchFunction: async () => {
        return await Product.findById(id)
          .populate('category', 'name')
          .populate('seller', 'name whatsappNumber')
          .lean();
      },
    });

    if (!product) {
      return sendResponse(res, 404, false, 'Product not found');
      // return res.status(404).json({ message: 'Product not found' });
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
    return sendResponse(res, 500, false, 'Internal server error');
    // return res.status(500).json({ message: 'Internal server error' });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { _id } = req.user;
    const {
      title,
      description,
      category,
      price,
      tags,
      location,
      specifications,
    } = req.body;

    if (req.files && req.files.length > 5) {
      return sendResponse(res, 400, false, 'Maximum of 5 images allowed');
      // return res.status(400).json({ message: 'Maximum of 5 images allowed' });
    }

    const tagNames = parseTagNames(tags);
    if (tagNames.length > 5) {
      return sendResponse(res, 400, false, 'Maximum of 5 tags allowed');
      // return res.status(400).json({ message: 'Maximum of 5 tags allowed' });
    }

    const tagIds = await resolveTagIds(tagNames);

    let parsedSpecifications = [];
    if (specifications) {
      try {
        parsedSpecifications =
          typeof specifications === 'string'
            ? JSON.parse(specifications)
            : specifications;
      } catch (parseError) {
        return sendResponse(res, 400, false, 'Invalid specifications format');
        // return res
        //   .status(400)
        //   .json({ message: 'Invalid specifications format' });
      }
    }

    const specValidation = validateSpecifications(
      category,
      parsedSpecifications,
    );
    if (!specValidation.valid) {
      return sendResponse(res, 400, false, specValidation.message);
      // return res.status(400).json({ message: specValidation.message });
    }

    const normalizedSpecifications = normalizeSpecifications(
      category,
      parsedSpecifications,
    );

    const images = (req.files || []).map((file, index) => ({
      url: file.path,
      publicId: file.filename,
      alt: `${title} - Image ${index + 1}`,
    }));

    const product = new Product({
      title,
      description,
      category,
      price,
      images,
      tags: tagIds,
      location,
      specifications: normalizedSpecifications,
      seller: _id,
    });

    await product.save();

    // Respond immediately — user isn't stuck waiting on AI
    sendResponse(res, 201, true, 'Product created successfully', product);

    // Fire-and-forget: generate real AI alt text in the background,
    // then patch the saved product afterward
    (async () => {
      try {
        const updatedImages = await Promise.all(
          product.images.map(async (image) => {
            try {
              const aiDescription = await generateAltText(
                image.url,
                description,
              );
              return {
                ...image.toObject(),
                alt: aiDescription
                  ? `${title} - ${aiDescription.detailed}`
                  : image.alt,
              };
            } catch (visionError) {
              console.error(`generateAltText failed: ${visionError.message}`);
              return image; // keep fallback alt on failure
            }
          }),
        );

        product.images = updatedImages;
        await product.save();

        // Cache was never set for a brand-new product, so nothing to invalidate here.
        // But if you're caching getAllProducts later, invalidate that here too.
      } catch (bgError) {
        console.error(`Background alt-text update failed: ${bgError.message}`);
      }
    })();
  } catch (error) {
    console.error(`Error in createProduct: ${error.message}`);
    return sendResponse(res, 500, false, 'Internal server error');
    // return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { _id: userId } = req.user;
    const { id } = req.params;
    const {
      title,
      description,
      category,
      price,
      isAvailable,
      location,
      specifications,
    } = req.body;

    const product = await Product.findById(id);

    if (!product) {
      return sendResponse(res, 404, false, 'Product not found');
      // return res.status(404).json({ message: 'Product not found' });
    }

    if (req.files && req.files.length > 5) {
      return sendResponse(res, 400, false, 'Maximum of 5 images allowed');
      // return res.status(400).json({ message: 'Maximum of 5 images allowed' });
    }

    if (product.seller.toString() !== userId.toString()) {
      return sendResponse(
        res,
        403,
        false,
        'Not authorized to update this product',
      );
      // return res
      //   .status(403)
      //   .json({ message: 'Not authorized to update this product' });
    }

    if (req.files && req.files.length > 0) {
      if (product.images && product.images.length > 0) {
        const deletionPromises = product.images.map((image) =>
          cloudinary.uploader.destroy(image.publicId),
        );
        await Promise.all(deletionPromises);
      }

      product.images = req.files.map((file) => ({
        url: file.path,
        publicId: file.filename,
      }));
    }

    if (specifications !== undefined) {
      let parsedSpecifications = [];
      try {
        parsedSpecifications =
          typeof specifications === 'string'
            ? JSON.parse(specifications)
            : specifications;
      } catch (parseError) {
        return sendResponse(res, 400, false, 'Invalid specifications format');
        // return res
        //   .status(400)
        //   .json({ message: 'Invalid specifications format' });
      }

      const effectiveCategory = category || product.category;
      const specValidation = validateSpecifications(
        effectiveCategory,
        parsedSpecifications,
      );
      if (!specValidation.valid) {
        return sendResponse(res, 400, false, specValidation.message);
        // return res.status(400).json({ message: specValidation.message });
      }

      product.specifications = normalizeSpecifications(
        effectiveCategory,
        parsedSpecifications,
      );
    }

    product.title = title || product.title;
    product.description = description || product.description;
    product.category = category || product.category;
    product.price = price || product.price;
    product.location = location || product.location;
    product.isAvailable = isAvailable ?? product.isAvailable;

    await product.save();

    await cacheDelete(CacheKeys.product(id));

    return sendResponse(
      res,
      200,
      true,
      'Product updated successfully',
      product,
    );
  } catch (error) {
    console.error(`Error in updateProduct: ${error.message}`);
    return sendResponse(res, 500, false, 'Internal server error');
    // return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return sendResponse(res, 404, false, 'Product not found');
      // return res.status(404).json({ message: 'Product not found' });
    }

    // Invalidate cache — product no longer exists
    await cacheDelete(CacheKeys.product(id));

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
    return sendResponse(res, 500, false, 'Internal server error');
    // return res.status(500).json({ message: 'Internal server error' });
  }
};

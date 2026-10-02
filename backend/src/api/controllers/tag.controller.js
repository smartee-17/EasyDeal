import { sendResponse } from '../library/utils.js';
import Tag from '../models/tag.model.js';
import Product from '../models/product.model.js';
import { cacheDelete } from '../cache/cache.wrapper.js';
import { CacheKeys } from '../cache/cache.keys.js';
import mongoose from 'mongoose';

// Create a new tag
export const createTag = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return sendResponse(res, 400, false, 'Tag name is required');
      // return res.status(400).json({ message: 'Tag name is required' });
    }

    // Prevent duplicates
    const existing = await Tag.findOne({ name: name.toLowerCase().trim() });
    if (existing) {
      return sendResponse(res, 409, false, 'Tag already exists');
      // return res
      //   .status(409)
      //   .json({ message: 'Tag already exists', tag: existing });
    }

    // Audit: createdBy and updatedBy from authenticated admin
    const adminId = req.user._id;
    const tag = new Tag({
      name: name.trim(),
      createdBy: adminId,
      updatedBy: adminId,
    });
    await tag.save();
    return sendResponse(res, 201, true, 'Tag created successfully', tag);
  } catch (error) {
    console.log(`Error creating tag: ${error}`);
    return sendResponse(res, 500, false, 'Internal server error');
    // return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all tags
export const getAllTags = async (req, res) => {
  try {
    const tags = await Tag.find().sort({ name: 1 });
    if (tags.length === 0) {
      return sendResponse(res, 404, false, 'No tags found');
      // return res.status(404).json({ message: 'No tags found' });
    }
    return sendResponse(res, 200, true, 'Tags retrieved successfully', tags);
  } catch (error) {
    console.log(`Error getting tags: ${error}`);
    return sendResponse(res, 500, false, 'Internal server error');
    // return res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete a tag (admin only)
export const deleteTag = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendResponse(res, 400, false, 'Invalid ID format');
      // return res.status(400).json({ message: 'Invalid ID format' });
    }
    const tag = await Tag.findById(id);
    if (!tag) {
      return sendResponse(res, 404, false, 'Tag not found');
      // return res.status(404).json({ message: 'Tag not found' });
    }

    // Collect the products that reference this tag before removing the
    // reference, so their cached responses can be invalidated afterwards.
    const referencedProducts = await Product.find({ tags: tag._id })
      .select('_id')
      .lean();
    const affectedProductIds = referencedProducts.map((product) =>
      product._id.toString(),
    );

    // Drop the now-dangling ObjectId from every product. Runs before the tag
    // is removed so a failure here leaves the tag and its references intact.
    await Product.updateMany({ tags: tag._id }, { $pull: { tags: tag._id } });

    await Tag.findByIdAndDelete(id);

    // getProductById caches the unpopulated product (including its tags array)
    // for an hour, so those entries must be dropped or the deleted tag id
    // keeps being served.
    for (const productId of affectedProductIds) {
      await cacheDelete(CacheKeys.product(productId));
    }

    return sendResponse(res, 200, true, 'Tag deleted successfully', tag);
  } catch (error) {
    console.log(`Error deleting tag: ${error}`);
    return sendResponse(res, 500, false, 'Internal server error');
    // return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update / rename a tag (admin only)
export const updateTag = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return sendResponse(res, 400, false, 'Tag name is required');
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendResponse(res, 400, false, 'Invalid ID format');
    }

    const tag = await Tag.findById(id);
    if (!tag) {
      return sendResponse(res, 404, false, 'Tag not found');
    }

    // Prevent duplicates, ignoring the tag being updated
    const normalizedName = name.toLowerCase().trim();
    const existing = await Tag.findOne({ name: normalizedName, _id: { $ne: id } });
    if (existing) {
      return sendResponse(res, 409, false, 'Tag already exists');
    }

    // Audit: updatedBy from authenticated admin; createdBy remains immutable
    const adminId = req.user._id;
    tag.name = name.trim();
    tag.updatedBy = adminId;
    // Ignore client-supplied createdBy/updatedBy/createdAt/updatedAt
    await tag.save();

    return sendResponse(res, 200, true, 'Tag updated successfully', tag);
  } catch (error) {
    // Second layer of duplicate protection: the unique index on name rejects
    // a colliding rename that slips past the findOne check above.
    if (error.code === 11000) {
      return sendResponse(res, 409, false, 'Tag already exists');
    }
    console.log(`Error updating tag: ${error}`);
    return sendResponse(res, 500, false, 'Internal server error');
  }
};

export const searchTags = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return sendResponse(res, 400, false, 'Query is required');
    // return res.status(400).json({ message: 'Query is required' });

    const tags = await Tag.find({
      name: { $regex: q, $options: 'i' }, // case-insensitive search
    }).limit(10);

    return sendResponse(res, 200, true, 'Tags found', tags);
  } catch (error) {
    console.log(`Error searching tags: ${error}`);
    return sendResponse(res, 500, false, 'Internal server error');
    // return res.status(500).json({ message: 'Internal server error' });
  }
};

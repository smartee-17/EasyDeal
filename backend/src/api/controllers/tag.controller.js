import { sendResponse } from '../library/utils.js';
import Tag from '../models/tag.model.js';
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

    const tag = new Tag({ name: name.trim() });
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
    const tag = await Tag.findByIdAndDelete(id);
    if (!tag) {
      return sendResponse(res, 404, false, 'Tag not found');
      // return res.status(404).json({ message: 'Tag not found' });
    }
    return sendResponse(res, 200, true, 'Tag deleted successfully', tag);
  } catch (error) {
    console.log(`Error deleting tag: ${error}`);
    return sendResponse(res, 500, false, 'Internal server error');
    // return res.status(500).json({ message: 'Internal server error' });
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

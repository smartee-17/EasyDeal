import mongoose from 'mongoose';
import { sendResponse } from '../library/utils.js';
import Product from '../models/product.model.js';
import User from '../models/user.model.js';

const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate('seller', 'name email')
      .select('title price category seller createdAt')
      .sort({ createdAt: -1 });
    if (!products || products.length === 0) {
      // return res.status(404).json({ message: 'No products found' });

      // For consistency 
      return sendResponse(
        res,
        404,
        false,
        'No products found'
      );
    }
    // res.status(200).json(products);

    // For consistency 
    return sendResponse(
      res,
      200,
      true,
      'Products retrieved successfully',
      { products }
    )
  } catch (error) {
    // res.status(500).json({ message: 'Server error', error: error.message });

    // For consistency 
    console.error("[Admin Dashboard]", error);
    return sendResponse(
      res,
      500,
      false,
      'Server error'
    );
  }
};

const getSingleProduct = async (req, res) => {
  try {
    const { id } = req.params;

      if(!mongoose.Types.ObjectId.isValid(id)){
        return sendResponse(
          res,
          400,
          false,
          'Invalid product ID'
        );
      }

    const product = await Product.findById(id)
    .populate("seller", "name email")
    .select("title price category seller createdAt");

      if (!product) {
        return sendResponse(
          res,
          404,
          false,
          'Product not found'
        );
      }

    return sendResponse(
      res, 
      200,
      true,
      'Product retrieved successfully',
      { product }
    );

  } catch (error) {
    console.error("[Admin Dashboard]", error);
    return sendResponse(
      res,
      500,
      false,
      "Server error"
    );
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      // return res.status(404).json({ message: 'Product not found' });

      // For consistency 
      return sendResponse(
        res,
        404,
        false,
        'Product not found'
      );
    }
    // res.status(200).json({ message: 'Product deleted successfully' });

    // For consistency 
    return sendResponse(
      res,
      200,
      true,
      'Product deleted successfully'
    )

  } catch (error) {
    // res.status(500).json({ message: 'Server error', error: error.message });

    // For consistency 
    console.error("[Admin Dashboard]", error);
    return sendResponse(
      res,
      500,
      false,
      'Server error'
    );
  }
};

// Dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalSellers,
      totalBlockedUsers,
      totalBlockedSellers,
      totalVerifiedSellers,
      totalProducts,
    ] = await Promise.all([
      User.countDocuments({ role: "user", isDeleted: false }),
      User.countDocuments({ role: "seller", isDeleted: false }),
      User.countDocuments({ role: "user", isBlocked: true, isDeleted: false }),
      User.countDocuments({ role: "seller", isBlocked: true, isDeleted: false }),
      User.countDocuments({ role: "seller", isEmailVerified: true, isDeleted: false }),
      Product.countDocuments(),
    ]);

    return sendResponse(
      res,
      200,
      true,
      "Dashboard stats retrieved successfully",
      {
        users: {
          total: totalUsers,
          blocked: totalBlockedUsers,
        },
        sellers: {
          total: totalSellers,
          blocked: totalBlockedSellers,
          verified: totalVerifiedSellers,
        },
        products: {
          total: totalProducts,
        },
      }
    );
  } catch (error) {
    console.error("[Admin Dashboard]", error);
    return sendResponse(
      res,
      500,
      false,
      "Dashboard stats retrieval unsuccessful"
    );
  }
};

// User management

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ isDeleted: false }).sort({ createdAt: -1 });

    const publicUsers = users.map(user => user.toPublic());

    return sendResponse(
      res,
      200,
      true,
      "Users retrieved successfully",
      {
        users: publicUsers,
        total: publicUsers.length,
      }
    );

  } catch (error) {
    console.error("[Admin Dashboard]", error);
    return sendResponse(
      res,
      500,
      false,
      "Server error"
    );
  }
};

// Get single user 
const getSingleUser = async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendResponse(
          res,
          400,
          false,
          "Invalid user ID"
      );
    }

    const user = await User.findById(id);

    if (!user){
      return sendResponse(
          res,
          404,
          false,
          "User not found"
      );
    }

    return sendResponse(
      res,
      200,
      true,
      "User retrieved successfully",
      { user: user.toPublic() }
    );

  } catch(error) {
    console.error("[Admin Dashboard]", error);
    return sendResponse(
      res,
      500,
      false,
      "Server error"
    );
  }
};

// Block user 
const blockUser = async (req, res) => {
  try { 
    const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)){
        return sendResponse(
          res,
          400,
          false,
          'Invalid user ID'
        );
      }

    const user = await User.findById(id);

      if (!user) {
        return sendResponse(
          res,
          404,
          false,
          'User not found'
        );
      }

      if(user.isBlocked){
        return sendResponse(
          res,
          409,
          false,
          'User is already blocked'
        );
      }

    user.isBlocked = true;
    await user.save();

    return sendResponse(
      res,
      200,
      true,
      'User blocked successfully',
      { user: user.toPublic() }
    )


  } catch(error) {
    console.error("[Admin Dashboard]", error);
    return sendResponse(
      res,
      500,
      false,
      "Server error"
    );
  }
}


// Unblock User
const unblockUser = async (req, res) => {
  try { 
    const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)){
        return sendResponse(
          res,
          400,
          false,
          'Invalid user ID'
        );
      }

    const user = await User.findById(id);

      if (!user) {
        return sendResponse(
          res,
          404,
          false,
          'User not found'
        );
      }

      if(!user.isBlocked){
        return sendResponse(
          res,
          409,
          false,
          'User is not blocked'
        );
      }

    user.isBlocked = false;
    await user.save();

    return sendResponse(
      res,
      200,
      true,
      'User unblocked successfully',
      { user: user.toPublic() }
    )


  } catch(error) {
    console.error("[Admin Dashboard]", error);
    return sendResponse(
      res,
      500,
      false,
      "Server error"
    );
  }
}

// Delete User
const deleteUser = async (req, res) => {
  try { 
    const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)){
        return sendResponse(
          res,
          400,
          false,
          'Invalid user ID'
        );
      }

    const user = await User.findById(id);

      if (!user){
        return sendResponse(
          res,
          404,
          false,
          'User not found'
        );
      }

      if (user.isDeleted) {
        return sendResponse(
          res,
          409,
          false,
          'User has already been deleted'
        );
      }

    user.isDeleted = true;
    user.deletedAt = new Date();
    
    await user.save();

    return sendResponse(
      res,
      200,
      true,
      'User deleted successfully',
      { user: user.toPublic() }
    );


  } catch (error) {
    console.error("[Admin Dashboard]", error);
    return sendResponse(
      res,
      500,
      false,
      "Server error"
    );
  }
}

// Restore User
const restoreUser = async (req, res) => {
  try { 
    const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)){
        return sendResponse(
          res,
          400,
          false,
          'Invalid user ID'
        );
      }

    const user = await User.findById(id);

      if (!user){
        return sendResponse(
          res,
          404,
          false,
          'User not found'
        );
      }

      if (!user.isDeleted) {
        return sendResponse(
          res,
          409,
          false,
          'User is already active'
        );
      }

    user.isDeleted = false;
    user.deletedAt = null;
    
    await user.save();

    return sendResponse(
      res,
      200,
      true,
      'User restored successfully',
      { user: user.toPublic() }
    );


  } catch (error) {
    console.error("[Admin Dashboard]", error);
    return sendResponse(
      res,
      500,
      false,
      "Server error"
    );
  }
}

export {
  getAllProducts,
  deleteProduct,
  getSingleProduct,

  getDashboardStats,
  getAllUsers,
  getSingleUser,

  blockUser,
  unblockUser,
  deleteUser,
  restoreUser,
};

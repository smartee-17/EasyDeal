import User from '../models/user.model.js';
import { sendResponse } from '../library/utils.js';
import cloudinary from '../../config/cloudinary.js';

export const getME = async(req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if(!user) {
          return  res.status(404).json({ message: 'User not found' });
        }

        return sendResponse(
            res,
            200,
            true,
            'Profile fetched successfully',
            { user: user.toPublic() }
        );

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message })
    }
};

export const updateMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user){
            return res.status(404).json({ message: "User not found" });
        }

       const updates = {};
        
       const allowedFields = [
            'name',
            'email',
            'phone',
            'username',
            'bio',
            'whatsappNumber'
        ];

        allowedFields.forEach( (field) => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        if (req.file) {
            if (user.avatar?.publicId) {
                await cloudinary.uploader.destroy(user.avatar.publicId);
            }


            updates.avatar = {
                url: req.file.path,
                publicId: req.file.filename,
            };
        }


        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            updates,
            {
                new: true,
                runValidators: true
            }
        );

        sendResponse(
            res,
            200,
            true,
            'Profile updated successfully',
            { user: updatedUser.toPublic() }
        );

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Server error during update', error: error.message
        });
    }
}
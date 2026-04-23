import jwt from 'jsonwebtoken';

const generateToken = (user) => {
    return jwt.sign(
        { id: user._id},
        process.env.JWT_SECRET,
        { expiresIn: '7d'}
    );
};

export default generateToken;
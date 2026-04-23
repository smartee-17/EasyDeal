import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    reviewerId: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User"},

    rating: { type: Number, required: true}, 
    comment: {type: String},

    createdAt: {type: Date, default: Date.now}
});

const Review = mongoose.model(Review, reviewSchema);

export default Review; 
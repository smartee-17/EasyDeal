import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    reviewerId: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User"},

    rating: { type: Number, required: true, min: 1, max: 5}, 
    comment: {type: String}
}, {timestamps: true});

reviewSchema.statics.calculateAverage = async function (sellerId){
    const stats = await this.aggregate([
        { $match: { sellerId } },
        {
           $group: {
            _id: '$sellerId',
            nRating: { $sum: 1},
            avgRating: { $avg: '$rating' },
           }
        }
    ]);

    const ratingCount = stats.length ? stats[0].nRating : 0;
    const ratingAverage = stats.length ? stats[0].avgRating : 0;


    await mongoose.model('User').findByIdAndUpdate(sellerId, {
        ratingCount,
        ratingAverage: Number(ratingAverage.tofixed(1))
    })
}

reviewSchema.post('save', function() {
    this.constructor.calculateAverage(this.sellerId);
});

reviewSchema.post(/^findOneAnd/, async function (doc){
    if(doc) await doc.constructor.calculateAverage(doc.sellerId);
});

const Review = mongoose.model('Review', reviewSchema);

export default Review; 
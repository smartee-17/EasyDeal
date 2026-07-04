import Product from '../models/product.model.js';

const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate('seller', 'name email')
      .select('title price category seller createdAt')
      .sort({ createdAt: -1 });
    if (!products || products.length === 0) {
      return res.status(404).json({ message: 'No products found' });
    }
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export { getAllProducts, deleteProduct };

const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { category, search, featured, limit = 20 } = req.query;

        let query = {};

        if (category) {
            query.category = category;
        }

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        if (featured === 'true') {
            query.featured = true;
        }

        // Default filter: only approved items
        // Unless fetching my own or admin (but this is public route)
        query.status = 'approved';

        const products = await Product.find(query).limit(parseInt(limit)).sort({ createdAt: -1 });

        res.json({ success: true, count: products.length, data: products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/products/featured
// @desc    Get featured products
// @access  Public
router.get('/featured', async (req, res) => {
    try {
        const products = await Product.find({ featured: true }).limit(8);
        res.json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/products/category/:category
// @desc    Get products by category
// @access  Public
router.get('/category/:category', async (req, res) => {
    try {
        const products = await Product.find({ category: req.params.category }).sort({ createdAt: -1 });
        res.json({ success: true, count: products.length, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/products/rentals
// @desc    Get rental products
// @access  Public
router.get('/rentals', async (req, res) => {
    try {
        const products = await Product.find({ isRental: true }).sort({ createdAt: -1 });
        res.json({ success: true, count: products.length, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/products
// @desc    Upload a product (User/Admin)
// @access  Private
const auth = require('../middleware/auth');

router.post('/', auth.protect, async (req, res) => {
    try {
        // If user is admin, auto-approve. Else pending.
        // For simplicity, let's say all uploads are pending unless specifically set?
        // Or check user role? We didn't implement roles fully yet.
        // Let's assume 'default' user is student -> pending.

        const status = 'pending';

        const product = await Product.create({
            ...req.body,
            seller: req.user._id, // Link to user
            status,
            createdAt: new Date()
        });

        res.status(201).json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/products/:id/status
// @desc    Update product status (Admin)
// @access  Private
router.put('/:id/status', auth.protect, async (req, res) => {
    try {
        const { status, adminComments } = req.body;
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Update fields
        product.status = status;
        if (adminComments) product.adminComments = adminComments;

        await product.save();

        res.json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/products/my-uploads
// @desc    Get logged in user's uploads
// @access  Private
router.get('/my-uploads', auth.protect, async (req, res) => {
    try {
        // Local DB specific filter
        const allProducts = await Product.find({});
        const myProducts = allProducts.filter(p => p.seller === req.user._id);
        res.json({ success: true, count: myProducts.length, data: myProducts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/products/pending
// @desc    Get pending products (Admin)
// @access  Private
router.get('/pending', auth.protect, async (req, res) => {
    try {
        const products = await Product.find({ status: 'pending' });
        res.json({ success: true, count: products.length, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;


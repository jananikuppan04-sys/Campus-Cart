const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// @route   GET /api/cart
// @desc    Get user cart
// @access  Private
// FIX: Local DB does not support populate()
router.get('/', auth.protect, async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            cart = await Cart.create({ user: req.user._id, items: [] });
            return res.json({ success: true, data: cart });
        }

        // Manual populate implementation
        // Fetch all product IDs in cart
        // Then map them to actual product data
        const detailedItems = [];
        for (const item of cart.items) {
            const product = await Product.findById(item.product);
            if (product) {
                // Return structure similar to populated object
                detailedItems.push({
                    _id: item._id, // item id (if exists or generate?) Mongoose usually has subdoc _id
                    product: product, // Full product object
                    quantity: item.quantity,
                    isRental: item.isRental,
                    rentalDays: item.rentalDays
                });
            }
        }

        // Return a constructed object that looks like the populated cart
        const cartResponse = {
            _id: cart._id,
            user: cart.user,
            items: detailedItems,
            createdAt: cart.createdAt,
            updatedAt: cart.updatedAt
        };

        res.json({ success: true, data: cartResponse });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/cart
// @desc    Add item to cart
// @access  Private
router.post('/', auth.protect, async (req, res) => {
    try {
        const { productId, quantity, isRental, rentalDays } = req.body;

        let cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            cart = await Cart.create({ user: req.user._id, items: [] });
        }

        // check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // check if item already in cart
        const existingItemIndex = cart.items.findIndex(item =>
            item.product.toString() === productId &&
            item.isRental === isRental &&
            (!item.isRental || item.rentalDays === rentalDays)
        );

        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            cart.items.push({
                product: productId,
                quantity,
                isRental: isRental || false,
                rentalDays: rentalDays || 0
            });
        }

        await cart.save();

        const populatedCart = await Cart.findOne({ user: req.user._id }).populate('items.product');

        res.json({ success: true, data: populatedCart });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/cart/:itemId
// @desc    Update cart item quantity
// @access  Private
router.put('/:id', auth.protect, async (req, res) => {
    try {
        const { quantity } = req.body;

        let cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const itemIndex = cart.items.findIndex(item => item._id.toString() === req.params.itemId);

        if (itemIndex > -1) {
            if (quantity > 0) {
                cart.items[itemIndex].quantity = quantity;
            } else {
                cart.items.splice(itemIndex, 1);
            }
            await cart.save();
            const populatedCart = await Cart.findOne({ user: req.user._id }).populate('items.product');
            return res.json({ success: true, data: populatedCart });
        }

        res.status(404).json({ success: false, message: 'Item not found in cart' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   DELETE /api/cart/:itemId
// @desc    Remove item from cart
// @access  Private
router.delete('/:itemId', auth.protect, async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        cart.items = cart.items.filter(item => item._id.toString() !== req.params.itemId);

        await cart.save();

        const populatedCart = await Cart.findOne({ user: req.user._id }).populate('items.product');

        res.json({ success: true, data: populatedCart });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   DELETE /api/cart
// @desc    Clear cart
// @access  Private
router.delete('/', auth.protect, async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user._id });

        if (cart) {
            cart.items = [];
            await cart.save();
        }

        res.json({ success: true, data: { items: [] } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;

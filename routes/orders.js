const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', auth.protect, async (req, res) => {
    try {
        const { paymentMethod, shippingAddress, deliveryNotes } = req.body;

        // Get user cart
        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: 'No items in cart' });
        }

        // Calculate total and prepare order items
        let totalAmount = 0;
        const orderItems = [];

        for (const item of cart.items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(404).json({ success: false, message: `Product not found: ${item.product}` });
            }

            // Check stock
            if (product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Product ${product.name} is out of stock`
                });
            }

            // Calc price
            let price = product.price;
            if (item.isRental && item.rentalDays) {
                price = product.rentalPricePerDay * parseInt(item.rentalDays);
            }

            totalAmount += price * item.quantity;

            orderItems.push({
                product: product._id, // Store ID
                name: product.name,
                price: price, // Store calculated price
                quantity: item.quantity,
                image: product.image,
                isRental: item.isRental,
                rentalDays: item.rentalDays
            });

            // Reduce stock
            product.stock -= item.quantity;
            await product.save();
        }

        // Create order
        const order = await Order.create({
            user: req.user._id,
            items: orderItems,
            totalAmount,
            paymentMethod,
            shippingAddress,
            deliveryNotes: deliveryNotes || ''
        });

        // Clear cart
        cart.items = [];
        await cart.save();

        res.status(201).json({ success: true, data: order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   GET /api/orders
// @desc    Get logged in user orders
// @access  Private
router.get('/', auth.protect, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', auth.protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name email phone');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Ensure user owns order
        if (order.user._id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        res.json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/orders/:id/pay
// @desc    Update order to paid
// @access  Private
router.put('/:id/pay', auth.protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        order.paymentStatus = 'completed';
        order.orderStatus = 'confirmed';

        const updatedOrder = await order.save();

        res.json({ success: true, data: updatedOrder });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;

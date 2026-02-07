require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');

// Connect to database (Local JSON DB is already initialized on require)
// connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/messages', require('./routes/messages'));

// Health check
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to CampusCart API', status: 'running' });
});

// Seed sample products endpoint
app.post('/api/seed', async (req, res) => {
    const Product = require('./models/Product');

    const sampleProducts = [];
    const categories = ['grocery', 'stationery', 'rental'];
    const subcategories = {
        grocery: ['snacks', 'beverages', 'dairy', 'instant'],
        stationery: ['instruments', 'paper', 'writing', 'art'],
        rental: ['electronics', 'fashion', 'furniture', 'gear']
    };

    // Helper to generate items
    const generateItems = (category, count, startSig) => {
        for (let i = 0; i < count; i++) {
            const sub = subcategories[category][Math.floor(Math.random() * subcategories[category].length)];
            sampleProducts.push({
                name: `${category.charAt(0).toUpperCase() + category.slice(1)} Item ${i + 1} - ${sub}`, // Placeholder name, will refine below
                description: `High quality ${category} item for students. Perfect connection for campus life.`,
                price: Math.floor(Math.random() * 500) + 50,
                category,
                subcategory: sub,
                stock: Math.floor(Math.random() * 50) + 10,
                featured: i < 3,
                isRental: category === 'rental',
                rentalPricePerDay: category === 'rental' ? Math.floor(Math.random() * 100) + 20 : 0,
                rentalDuration: category === 'rental' ? 'daily' : null,
                image: `https://images.unsplash.com/photo-${getUnsplashId(category, i)}?auto=format&fit=crop&w=400&q=80`,
                status: 'approved',
                seller: 'admin'
            });
        }
    };

    // Semi-curated Unsplash IDs for reliability
    const getUnsplashId = (cat, index) => {
        const mapping = {
            grocery: ['1542838132-92c53300491e', '1515023115689-589c33041697', '1621939514649-1b3074092493', '1527960669280-9755f9a4666f', '1610832958506-aa56368176cf', '1582562142289-5f21287950d8', '1604382354936-07c5d9983bd3', '1596462502278-27bfdd403cc2', '1513558161293-cdaf765ed2fd', '1564750978923-b1d7d0a7cb54', '1596462502278-27bfdd403cc2', '1621939514649-1b3074092493', '1527960669280-9755f9a4666f', '1610832958506-aa56368176cf', '1582562142289-5f21287950d8'],
            stationery: ['1515965806378-d27a72d8dc63', '1607513745294-0ba8e55e0a6d', '1456735190827-d1262f71b8a3', '1519389950476-29a823528f9d', '1606167667258-c0065afb0d6a', '1584989658421-4f1a603ac1d2', '1622345097446-24a96b346985', '1622345695000-85fbd2641a29', '1557007775-5384cc37c768', '1533604818465-9a84a7e2b834', '1456735190827-d1262f71b8a3', '1519389950476-29a823528f9d', '1606167667258-c0065afb0d6a', '1584989658421-4f1a603ac1d2', '1622345097446-24a96b346985'],
            rental: ['1588508065123-287c28eb85a5', '1527443224156-03f3e1a81dc4', '1496181133206-80ce9b88a853', '1505740420926-70d130c336fa', '1517336714731-489689fd1ca4', '1543512214-318c34cc704b', '1550009158-b0114945d714', '1586495773814-498103ed0c94', '1558211583-d26f610c1eb1', '1496181133206-80ce9b88a853', '1588508065123-287c28eb85a5', '1527443224156-03f3e1a81dc4', '1496181133206-80ce9b88a853', '1505740420926-70d130c336fa', '1517336714731-489689fd1ca4']
        };
        const list = mapping[cat] || [];
        return list[index % list.length];
    };

    // Specific Items to override defaults
    const specificItems = [
        // Grocery
        { name: 'Fresh Apples (1kg)', category: 'grocery', subcategory: 'fresh', image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400' },
        { name: 'Whole Wheat Bread', category: 'grocery', subcategory: 'bakery', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400' },
        { name: 'Orange Juice', category: 'grocery', subcategory: 'beverages', image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400' },

        // Stationery
        { name: 'Premium Notebook', category: 'stationery', subcategory: 'paper', image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400' },
        { name: 'Watercolor Set', category: 'stationery', subcategory: 'art', image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400' },
        { name: 'Geometric Ruler', category: 'stationery', subcategory: 'instruments', image: 'https://images.unsplash.com/photo-1587570411139-c567a19c677f?w=400' },

        // Rental
        { name: 'Gaming Laptop', category: 'rental', isRental: true, rentalPricePerDay: 250, image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400' },
        { name: 'DSLR Camera', category: 'rental', isRental: true, rentalPricePerDay: 350, image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400' },
        { name: 'Electric Guitar', category: 'rental', isRental: true, rentalPricePerDay: 150, image: 'https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?w=400' }
    ];

    generateItems('grocery', 15);
    generateItems('stationery', 15);
    generateItems('rental', 15);

    // Overlay specific items
    specificItems.forEach((item, i) => {
        // Find a matching category item to replace or just push? 
        // Let's replace the first few for quality
        const idx = sampleProducts.findIndex(p => p.category === item.category && p.name.includes('Item'));
        if (idx !== -1) {
            Object.assign(sampleProducts[idx], item);
        }
    });

    try {
        await Product.deleteMany({});
        await Product.insertMany(sampleProducts);
        res.json({ success: true, message: 'Sample products seeded successfully', count: sampleProducts.length });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 CampusCart server running on port ${PORT}`);
    console.log(`📦 API available at http://localhost:${PORT}/api`);
});

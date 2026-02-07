const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory data storage
let users = [
    { id: 1, email: 'admin@shop.com', password: 'admin123', role: 'admin', name: 'Admin User' },
    { id: 2, email: 'user@shop.com', password: 'user123', role: 'user', name: 'Test User' },
];

let products = [
    { id: 1, name: 'Laptop', price: 999.99, category: 'Electronics', stock: 10, image: 'laptop.jpg' },
    { id: 2, name: 'Smartphone', price: 699.99, category: 'Electronics', stock: 15, image: 'phone.jpg' },
    { id: 3, name: 'Headphones', price: 149.99, category: 'Electronics', stock: 25, image: 'headphones.jpg' },
    { id: 4, name: 'Keyboard', price: 79.99, category: 'Accessories', stock: 30, image: 'keyboard.jpg' },
    { id: 5, name: 'Mouse', price: 49.99, category: 'Accessories', stock: 40, image: 'mouse.jpg' },
];

let orders = [];
let carts = {};

// Authentication endpoints
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find((u) => u.email === email && u.password === password);

    if (user) {
        const { password: _, ...userWithoutPassword } = user;
        res.json({
            success: true,
            user: userWithoutPassword,
            token: `token_${user.id}_${Date.now()}`,
        });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

app.post('/api/auth/register', (req, res) => {
    const { email, password, name } = req.body;

    if (users.find((u) => u.email === email)) {
        return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const newUser = {
        id: users.length + 1,
        email,
        password,
        name,
        role: 'user',
    };

    users.push(newUser);
    const { password: _, ...userWithoutPassword } = newUser;

    res.json({
        success: true,
        user: userWithoutPassword,
        token: `token_${newUser.id}_${Date.now()}`,
    });
});

// Product endpoints
app.get('/api/products', (req, res) => {
    const { category, search } = req.query;
    let filteredProducts = products;

    if (category) {
        filteredProducts = filteredProducts.filter((p) => p.category === category);
    }

    if (search) {
        filteredProducts = filteredProducts.filter((p) =>
            p.name.toLowerCase().includes(search.toLowerCase())
        );
    }

    res.json({ success: true, products: filteredProducts });
});

app.get('/api/products/:id', (req, res) => {
    const product = products.find((p) => p.id === parseInt(req.params.id));

    if (product) {
        res.json({ success: true, product });
    } else {
        res.status(404).json({ success: false, message: 'Product not found' });
    }
});

// Cart endpoints
app.get('/api/cart/:userId', (req, res) => {
    const userId = req.params.userId;
    const cart = carts[userId] || [];
    res.json({ success: true, cart });
});

app.post('/api/cart/:userId', (req, res) => {
    const userId = req.params.userId;
    const { productId, quantity } = req.body;

    const product = products.find((p) => p.id === productId);

    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (!carts[userId]) {
        carts[userId] = [];
    }

    const existingItem = carts[userId].find((item) => item.productId === productId);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        carts[userId].push({ productId, quantity, product });
    }

    res.json({ success: true, cart: carts[userId] });
});

app.delete('/api/cart/:userId/:productId', (req, res) => {
    const userId = req.params.userId;
    const productId = parseInt(req.params.productId);

    if (carts[userId]) {
        carts[userId] = carts[userId].filter((item) => item.productId !== productId);
    }

    res.json({ success: true, cart: carts[userId] || [] });
});

app.delete('/api/cart/:userId', (req, res) => {
    const userId = req.params.userId;
    carts[userId] = [];
    res.json({ success: true, cart: [] });
});

// Order endpoints
app.post('/api/orders', (req, res) => {
    const { userId, items, total, paymentMethod } = req.body;

    const order = {
        id: orders.length + 1,
        userId,
        items,
        total,
        paymentMethod,
        status: 'pending',
        createdAt: new Date().toISOString(),
    };

    orders.push(order);

    // Clear cart
    carts[userId] = [];

    res.json({ success: true, order });
});

app.get('/api/orders/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const userOrders = orders.filter((o) => o.userId === userId);

    res.json({ success: true, orders: userOrders });
});

// Admin endpoints
app.get('/api/admin/orders', (req, res) => {
    res.json({ success: true, orders });
});

app.put('/api/admin/orders/:id', (req, res) => {
    const orderId = parseInt(req.params.id);
    const { status } = req.body;

    const order = orders.find((o) => o.id === orderId);

    if (order) {
        order.status = status;
        res.json({ success: true, order });
    } else {
        res.status(404).json({ success: false, message: 'Order not found' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ success: true, status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`Demo e-commerce server running on http://localhost:${PORT}`);
});

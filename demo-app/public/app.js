// State management
let currentUser = null;
let currentPage = 'login';
let cart = [];
let products = [];

const API_BASE = 'http://localhost:3000/api';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Check for saved user
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showPage('products');
        updateNavigation();
        loadProducts();
    }

    // Event listeners
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.querySelector('[data-testid="show-register"]').addEventListener('click', (e) => {
        e.preventDefault();
        showPage('register');
    });
    document.querySelector('[data-testid="show-login"]').addEventListener('click', (e) => {
        e.preventDefault();
        showPage('login');
    });
    document.getElementById('logoutLink').addEventListener('click', handleLogout);
    document.querySelector('[data-testid="nav-products"]').addEventListener('click', (e) => {
        e.preventDefault();
        if (currentUser) showPage('products');
    });
    document.querySelector('[data-testid="nav-cart"]').addEventListener('click', (e) => {
        e.preventDefault();
        if (currentUser) showPage('cart');
    });
    document.querySelector('[data-testid="nav-profile"]').addEventListener('click', (e) => {
        e.preventDefault();
        if (currentUser) showPage('profile');
    });
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.getElementById('categoryFilter').addEventListener('change', handleCategoryFilter);
    document.getElementById('checkoutBtn').addEventListener('click', () => showPage('checkout'));
    document.getElementById('checkoutForm').addEventListener('submit', handleCheckout);
});

// Authentication
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
            showPage('products');
            updateNavigation();
            loadProducts();
        } else {
            showError('loginError', data.message);
        }
    } catch (error) {
        showError('loginError', 'Login failed. Please try again.');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();

        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
            showPage('products');
            updateNavigation();
            loadProducts();
        } else {
            showError('registerError', data.message);
        }
    } catch (error) {
        showError('registerError', 'Registration failed. Please try again.');
    }
}

function handleLogout(e) {
    e.preventDefault();
    currentUser = null;
    cart = [];
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    showPage('login');
    updateNavigation();
}

// Products
async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE}/products`);
        const data = await response.json();

        if (data.success) {
            products = data.products;
            renderProducts(products);
        }
    } catch (error) {
        console.error('Failed to load products:', error);
    }
}

function renderProducts(productsToRender) {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '';

    productsToRender.forEach((product) => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <h3>${product.name}</h3>
            <p class="category">${product.category}</p>
            <p class="price">$${product.price.toFixed(2)}</p>
            <p>Stock: ${product.stock}</p>
            <button class="btn btn-primary" data-testid="add-to-cart-${product.id}" onclick="addToCart(${product.id})">
                Add to Cart
            </button>
        `;
        grid.appendChild(card);
    });
}

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = products.filter((p) => p.name.toLowerCase().includes(searchTerm));
    renderProducts(filtered);
}

function handleCategoryFilter(e) {
    const category = e.target.value;
    const filtered = category ? products.filter((p) => p.category === category) : products;
    renderProducts(filtered);
}

// Cart
async function addToCart(productId) {
    if (!currentUser) return;

    try {
        const response = await fetch(`${API_BASE}/cart/${currentUser.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, quantity: 1 }),
        });

        const data = await response.json();

        if (data.success) {
            cart = data.cart;
            updateCartCount();
        }
    } catch (error) {
        console.error('Failed to add to cart:', error);
    }
}

async function removeFromCart(productId) {
    if (!currentUser) return;

    try {
        const response = await fetch(`${API_BASE}/cart/${currentUser.id}/${productId}`, {
            method: 'DELETE',
        });

        const data = await response.json();

        if (data.success) {
            cart = data.cart;
            updateCartCount();
            renderCart();
        }
    } catch (error) {
        console.error('Failed to remove from cart:', error);
    }
}

async function loadCart() {
    if (!currentUser) return;

    try {
        const response = await fetch(`${API_BASE}/cart/${currentUser.id}`);
        const data = await response.json();

        if (data.success) {
            cart = data.cart;
            renderCart();
        }
    } catch (error) {
        console.error('Failed to load cart:', error);
    }
}

function renderCart() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');

    if (cart.length === 0) {
        cartItems.innerHTML = '<p>Your cart is empty</p>';
        cartTotal.textContent = '0.00';
        return;
    }

    let total = 0;
    cartItems.innerHTML = '';

    cart.forEach((item) => {
        const itemTotal = item.product.price * item.quantity;
        total += itemTotal;

        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.product.name}</h4>
                <p class="price">$${item.product.price.toFixed(2)} x ${item.quantity} = $${itemTotal.toFixed(2)}</p>
            </div>
            <div class="cart-item-actions">
                <button class="btn" data-testid="remove-from-cart-${item.productId}" onclick="removeFromCart(${item.productId})">Remove</button>
            </div>
        `;
        cartItems.appendChild(cartItem);
    });

    cartTotal.textContent = total.toFixed(2);
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelector('[data-testid="cart-count"]').textContent = count;
}

// Checkout
async function handleCheckout(e) {
    e.preventDefault();

    const paymentMethod = document.getElementById('paymentMethod').value;
    const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    try {
        const response = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                items: cart,
                total,
                paymentMethod,
            }),
        });

        const data = await response.json();

        if (data.success) {
            cart = [];
            updateCartCount();
            alert('Order placed successfully!');
            showPage('profile');
            loadOrders();
        }
    } catch (error) {
        console.error('Checkout failed:', error);
    }
}

// Orders
async function loadOrders() {
    if (!currentUser) return;

    try {
        const response = await fetch(`${API_BASE}/orders/${currentUser.id}`);
        const data = await response.json();

        if (data.success) {
            renderOrders(data.orders);
        }
    } catch (error) {
        console.error('Failed to load orders:', error);
    }
}

function renderOrders(orders) {
    const orderHistory = document.getElementById('orderHistory');

    if (orders.length === 0) {
        orderHistory.innerHTML = '<p>No orders yet</p>';
        return;
    }

    orderHistory.innerHTML = '';

    orders.forEach((order) => {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        orderCard.innerHTML = `
            <h4>Order #${order.id}</h4>
            <p>Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p>Total: $${order.total.toFixed(2)}</p>
            <p>Payment: ${order.paymentMethod}</p>
            <span class="order-status ${order.status}">${order.status}</span>
        `;
        orderHistory.appendChild(orderCard);
    });
}

// UI Helpers
function showPage(pageName) {
    document.querySelectorAll('.page').forEach((page) => page.classList.add('hidden'));
    document.querySelectorAll('.nav-link').forEach((link) => link.classList.remove('active'));

    currentPage = pageName;

    if (pageName === 'login') {
        document.getElementById('loginPage').classList.remove('hidden');
    } else if (pageName === 'register') {
        document.getElementById('registerPage').classList.remove('hidden');
    } else if (pageName === 'products') {
        document.getElementById('productsPage').classList.remove('hidden');
        document.querySelector('[data-testid="nav-products"]').classList.add('active');
    } else if (pageName === 'cart') {
        document.getElementById('cartPage').classList.remove('hidden');
        document.querySelector('[data-testid="nav-cart"]').classList.add('active');
        loadCart();
    } else if (pageName === 'checkout') {
        document.getElementById('checkoutPage').classList.remove('hidden');
    } else if (pageName === 'profile') {
        document.getElementById('profilePage').classList.remove('hidden');
        document.querySelector('[data-testid="nav-profile"]').classList.add('active');
        renderProfile();
        loadOrders();
    }
}

function updateNavigation() {
    if (currentUser) {
        document.getElementById('loginLink').classList.add('hidden');
        document.getElementById('profileLink').classList.remove('hidden');
        document.getElementById('logoutLink').classList.remove('hidden');
    } else {
        document.getElementById('loginLink').classList.remove('hidden');
        document.getElementById('profileLink').classList.add('hidden');
        document.getElementById('logoutLink').classList.add('hidden');
    }
}

function renderProfile() {
    const profileInfo = document.getElementById('profileInfo');
    profileInfo.innerHTML = `
        <p><strong>Name:</strong> ${currentUser.name}</p>
        <p><strong>Email:</strong> ${currentUser.email}</p>
        <p><strong>Role:</strong> ${currentUser.role}</p>
    `;
}

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');

    setTimeout(() => {
        errorElement.classList.add('hidden');
    }, 5000);
}

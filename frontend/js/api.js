const API_BASE_URL = 'http://localhost:5000/api';

const API = {
    // Headers helper
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        const token = Auth.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    },

    // Auth
    async login(email, password) {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        return res.json();
    },

    async register(userData) {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        return res.json();
    },

    async getProfile() {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: this.getHeaders()
        });
        return res.json();
    },

    // Products
    async getProducts(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const res = await fetch(`${API_BASE_URL}/products?${queryString}`);
        const data = await res.json();
        return data.data;
    },

    async getFeaturedProducts() {
        const res = await fetch(`${API_BASE_URL}/products/featured`);
        const data = await res.json();
        return data.data;
    },

    async getProduct(id) {
        const res = await fetch(`${API_BASE_URL}/products/${id}`);
        const data = await res.json();
        return data.data;
    },

    // Cart
    async getCart() {
        const res = await fetch(`${API_BASE_URL}/cart`, {
            headers: this.getHeaders()
        });
        const data = await res.json();
        return data.data;
    },

    async addToCart(productId, quantity, isRental, rentalDays) {
        const res = await fetch(`${API_BASE_URL}/cart`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ productId, quantity, isRental, rentalDays })
        });
        return res.json();
    },

    async updateCartItem(itemId, quantity) {
        const res = await fetch(`${API_BASE_URL}/cart/${itemId}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify({ quantity })
        });
        return res.json();
    },

    async removeFromCart(itemId) {
        const res = await fetch(`${API_BASE_URL}/cart/${itemId}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        return res.json();
    },

    // Orders
    async createOrder(orderData) {
        const res = await fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(orderData)
        });
        return res.json();
    },

    async getOrders() {
        const res = await fetch(`${API_BASE_URL}/orders`, {
            headers: this.getHeaders()
        });
        const data = await res.json();
        return data.data;
    },

    async payOrder(orderId) {
        const res = await fetch(`${API_BASE_URL}/orders/${orderId}/pay`, {
            method: 'PUT',
            headers: this.getHeaders()
        });
        return res.json();
    }
};

const CartManager = {
    async getCart() {
        if (Auth.isLoggedIn()) {
            return await API.getCart();
        } else {
            return LocalCart.get();
        }
    },

    async addToCart(product, quantity = 1, isRental = false, rentalDays = 0) {
        if (Auth.isLoggedIn()) {
            try {
                const res = await API.addToCart(product._id, quantity, isRental, rentalDays);
                if (res.success) {
                    showToast('Added to cart!', 'success');
                    this.updateCount();
                } else {
                    showToast(res.message, 'error');
                }
            } catch (e) {
                showToast('Failed to add to cart', 'error');
            }
        } else {
            LocalCart.add(product, quantity, isRental, rentalDays);
            showToast('Added to cart!', 'success');
            this.updateCount();
        }
    },

    async updateCount() {
        const countEl = document.getElementById('cart-count');
        if (!countEl) return;

        let count = 0;
        if (Auth.isLoggedIn()) {
            try {
                const cart = await API.getCart();
                if (cart && cart.items) {
                    count = cart.items.length;
                }
            } catch (e) { console.log('Error fetching cart count'); }
        } else {
            const cart = LocalCart.get();
            count = cart.items.length;
        }

        countEl.textContent = count;
        countEl.style.display = count > 0 ? 'flex' : 'none';
    },

    async removeItem(itemId) {
        if (Auth.isLoggedIn()) {
            await API.removeFromCart(itemId);
        } else {
            LocalCart.remove(itemId);
        }
        this.updateCount();
    }
};

const LocalCart = {
    get() {
        const cart = localStorage.getItem('cart');
        return cart ? JSON.parse(cart) : { items: [] };
    },

    add(product, quantity, isRental, rentalDays) {
        const cart = this.get();
        const existingItemIndex = cart.items.findIndex(item =>
            item.product._id === product._id &&
            item.isRental === isRental &&
            (!item.isRental || item.rentalDays === rentalDays)
        );

        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            cart.items.push({
                product,
                quantity,
                isRental,
                rentalDays
            });
        }

        this.save(cart);
    },

    remove(itemId) { // itemId for local cart is just index or generated ID
        // Simplified for local cart
        const cart = this.get();
        // This is tricky without unique IDs, strict index matching needed
    },

    save(cart) {
        localStorage.setItem('cart', JSON.stringify(cart));
    },

    clear() {
        localStorage.removeItem('cart');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    CartManager.updateCount();
});

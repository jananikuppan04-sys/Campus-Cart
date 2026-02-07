function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = `toast show ${type}`;

    if (type === 'success') {
        toast.innerHTML = `<i data-lucide="check-circle"></i> ${message}`;
    } else {
        toast.innerHTML = `<i data-lucide="alert-circle"></i> ${message}`;
    }
    lucide.createIcons();

    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

function createProductCard(product) {
    const isRental = product.isRental || product.category === 'rental';
    const priceLabel = isRental
        ? `₹${product.rentalPricePerDay}<small>/day</small>`
        : `₹${product.price}`;

    return `
        <div class="product-card" data-product-id="${product._id}">
            <div class="product-image">
                ${product.featured ? '<span class="badge badge-featured">Featured</span>' : ''}
                ${isRental ? '<span class="badge badge-rental">Rental</span>' : ''}
                <img src="${getImageUrl(product.image)}" alt="${product.name}">
            </div>
            <div class="product-info">
                <span class="product-category">${product.category}</span>
                <h4 class="product-name"><a href="product-detail.html?id=${product._id}">${product.name}</a></h4>
                <div class="product-footer">
                    <span class="product-price">${priceLabel}</span>
                    <button class="add-to-cart-btn" onclick="handleAddToCart(event, '${product._id}')" 
                        data-product='${JSON.stringify(product).replace(/'/g, "\\\'")}'>
                        <i data-lucide="plus"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function getImageUrl(imageName) {
    // Return sample images from unsplash based on usage
    if (imageName.includes('laptop')) return 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500';
    if (imageName.includes('maggi') || imageName.includes('noodles')) return 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=500';
    if (imageName.includes('chip')) return 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=500';
    if (imageName.includes('book') || imageName.includes('drawing')) return 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=500';
    if (imageName.includes('camera')) return 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500';
    return 'https://images.unsplash.com/photo-1572584642822-6f8de0243c93?w=500';
}

function formatCurrency(amount) {
    return '₹' + amount;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric'
    });
}

function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Global debounced search or other utilities can go here

async function handleAddToCart(e, productId) {
    if (e) e.preventDefault();
    const btn = e.currentTarget; // The button element
    const productData = JSON.parse(btn.dataset.product.replace(/\\'/g, "'"));

    const isRental = productData.isRental || productData.category === 'rental';

    // Add animation
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<div class="spinner"></div>';

    await CartManager.addToCart(productData, 1, isRental, isRental ? 1 : 0);

    btn.innerHTML = '<i data-lucide="check"></i>';
    lucide.createIcons();

    setTimeout(() => {
        btn.innerHTML = originalContent;
        lucide.createIcons();
    }, 2000);
}

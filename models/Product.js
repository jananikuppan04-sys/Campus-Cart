const BaseModel = require('./BaseModel');

class Product extends BaseModel {
    constructor() {
        super('products');
        // Schema definition for reference/validation (mock)
        this.schema = {
            name: { required: true },
            price: { required: true },
            category: { required: true },
            seller: { default: 'admin' },
            status: { default: 'approved' }
        };
    }
}

module.exports = new Product();

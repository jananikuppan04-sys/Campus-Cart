const BaseModel = require('./BaseModel');

class Cart extends BaseModel {
    constructor() {
        super('carts');
    }
}

module.exports = new Cart();

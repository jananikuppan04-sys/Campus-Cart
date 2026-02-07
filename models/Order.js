const BaseModel = require('./BaseModel');

class Order extends BaseModel {
    constructor() {
        super('orders');
    }
}

module.exports = new Order();

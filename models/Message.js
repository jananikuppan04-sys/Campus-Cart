const BaseModel = require('./BaseModel');

class Message extends BaseModel {
    constructor() {
        super('messages');
    }
}

module.exports = new Message();

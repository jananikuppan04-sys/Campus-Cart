const BaseModel = require('./BaseModel');

class User extends BaseModel {
    constructor() {
        super('users');
    }
}

module.exports = new User();

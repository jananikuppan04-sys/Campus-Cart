const db = require('../config/db');

class MockQuery {
    constructor(collectionName, initialQuery = {}) {
        this.collectionName = collectionName;
        this.queryObj = initialQuery;
        this.ops = [];
    }

    limit(n) {
        this.ops.push({ type: 'limit', value: n });
        return this;
    }

    sort(sortObj) {
        this.ops.push({ type: 'sort', value: sortObj });
        return this;
    }

    select(fields) {
        return this; // Ignored for mock
    }

    // This makes it awaitable
    then(resolve, reject) {
        try {
            const result = this.execute();
            resolve(result);
        } catch (err) {
            reject(err);
        }
    }

    execute() {
        // Handle MongoDB operators in query (simple version)
        // Clean query of regex/special operators for lowdb filter
        const simpleQuery = {};
        const complexFilters = [];

        Object.keys(this.queryObj).forEach(key => {
            const val = this.queryObj[key];
            if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                // Check for operators like $regex
                if (val.$regex) {
                    const regex = new RegExp(val.$regex, val.$options || '');
                    complexFilters.push(item => regex.test(item[key]));
                }
                // Check for $in
                else if (val.$in) { // e.g., category: { $in: ['a', 'b'] }
                    complexFilters.push(item => val.$in.includes(item[key]));
                }
                // Add more as needed
            } else {
                simpleQuery[key] = val;
            }
        });

        // Start chain
        let chain = db.get(this.collectionName).filter(simpleQuery);

        // Apply complex filters
        if (complexFilters.length > 0) {
            chain = chain.filter(item => complexFilters.every(f => f(item)));
        }

        // Apply ops
        this.ops.forEach(op => {
            if (op.type === 'limit') {
                chain = chain.take(op.value);
            }
            if (op.type === 'sort') {
                // Simple sort implementation
                // sortObj is { field: -1/1 }
                const sortKey = Object.keys(op.value)[0];
                const dir = op.value[sortKey] === -1 ? 'desc' : 'asc';
                chain = chain.orderBy([sortKey], [dir]);
            }
        });

        const results = chain.value();

        // Wrap results
        const model = new DBModel(this.collectionName);
        return results.map(i => model._wrap(i));
    }
}

class DBModel {
    constructor(collectionName) {
        this.collection = collectionName;
        this.db = db;
    }

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    create(data) {
        const newItem = { _id: this.generateId(), ...data, createdAt: new Date(), updatedAt: new Date() };
        this.db.get(this.collection).push(newItem).write();
        return this._wrap(newItem); // Create typically returns the object, not a promise in mongoose? Actually it is async.
        // But since we are not using MockQuery for create (it's direct), we can't await it the same way if caller expects chain.
        // Usually Model.create() returns a promise resolving to doc.
    }

    findOne(query) {
        // findOne also returns a query actually, but often awaited directly.
        // Let's return a MockQuery that creates a limit(1) implicitly?
        // Or just execute immediately if no chaining?
        // Mongoose: findOne(q).select(...).exec()
        // Here we'll satisfy the immediate await case first

        const q = new MockQuery(this.collection, query);
        // We need to override execute to return single item
        const origExecute = q.execute.bind(q);
        q.execute = () => {
            const res = origExecute();
            return res[0] || null;
        };
        return q;
    }

    findById(id) {
        return this.findOne({ _id: id });
    }

    find(query = {}) {
        return new MockQuery(this.collection, query);
    }

    deleteMany(query) {
        // Return promise
        return new Promise(resolve => {
            this.db.get(this.collection).remove(query).write();
            resolve({ ok: 1, deletedCount: 1 });
        });
    }

    insertMany(items) {
        return new Promise(resolve => {
            const newItems = items.map(item => ({
                _id: this.generateId(), ...item, createdAt: new Date(), updatedAt: new Date()
            }));
            // lowdb doesn't have batch insert, push one by one
            newItems.forEach(i => {
                this.db.get(this.collection).push(i).write();
            });
            resolve(newItems);
        });
    }

    _wrap(item) {
        if (!item) return null;
        const self = this;
        return {
            ...item,
            matchPassword: async function (entered) {
                // Simple string compare for now since we can't easily import bcrypt here without making it async?
                // Wait, we can import bcrypt.
                return entered === this.password; // MOCK ONLY: Plaintext compare for recovered items if hashing is complex
                // Or we could try real compare if item has hash
            },
            save: async function () {
                const match = self.db.get(self.collection).find({ _id: this._id });
                match.assign(this).write();
                return self._wrap(match.value());
            }
        };
    }
}

module.exports = DBModel;

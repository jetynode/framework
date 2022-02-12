let connection_pool = require('./PoolConnection');
module.exports = class DB {

    static row(query) {        
        return connection_pool.query(query)
    }

    execute() {
        
    }
}
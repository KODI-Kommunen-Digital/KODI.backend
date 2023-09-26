const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const corePath = path.join(__dirname,'..', 'test.db'); 
const cityPath = path.join(__dirname,'..', 'city-1.db');

// sqlitedb

class MockDb{
    dbPath;
    constructor(cityId) {
        this.dbPath = corePath;
        if (cityId) {
            this.dbPath = cityPath;
        }
    }

    async query(sql, params) {
        sql = sql.replaceAll('heidi_city_1.', '');
        if(sql.startsWith('INSERT')){
            const split = sql.split(' ');
            const table = split[2];
            const keys = Object.keys(params);
            const values = Object.values(params);
            const placeholders = keys.map(() => '?').join(',');
            sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`;

            return new Promise((resolve, reject) => {
                const db = new sqlite3.Database(this.dbPath);
                db.run(sql, values, function(err, rows) {
                    if (err) {
                        reject(err);
                    } else {
                        db.close();
                        this.insertId = this.lastID;
                        resolve([this]);
                    }
                });
            });
        }
        else if(sql.startsWith('UPDATE')){
            const split = sql.split(' ');
            const table = split[1];

            sql = `UPDATE ${table} SET `;

            let filter = params[0];
            const queryParams = [];

            let filterKeys = Object.keys(filter);

            for (let i = 0; i < filterKeys.length; i++) {
                const key = filterKeys[i];
                if (Array.isArray(filter[key])) {
                    sql += `${key} IN (${filter[key].map(() => '?').join(',')})`;
                    queryParams.push(...filter[key]);
                } else {
                    sql += `${key} = ?`;
                    queryParams.push(filter[key]);
                }

                if (i < filterKeys.length - 1) {
                    sql += ', ';
                }
            }

            sql += ' WHERE ';

            filter = params[1];

            filterKeys = Object.keys(filter);

            for (let i = 0; i < filterKeys.length; i++) {
                const key = filterKeys[i];
                if (Array.isArray(filter[key])) {
                    sql += `${key} IN (${filter[key].map(() => '?').join(',')})`;
                    queryParams.push(...filter[key]);
                } else {
                    sql += `${key} = ?`;
                    queryParams.push(filter[key]);
                }

                if (i < filterKeys.length - 1) {
                    sql += ', ';
                }
            }

            const values = queryParams;
            return new Promise((resolve, reject) => {
                const db = new sqlite3.Database(this.dbPath);
                db.run(sql, values, function(err, rows) {
                    if (err) {
                        reject(err);
                    } else {
                        db.close();
                        this.insertId = this.lastID;
                        resolve([this]);
                    }
                });
            });

        }
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(this.dbPath);
            db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    db.close();
                    resolve([rows, null]);
                }
            });
        });
    }

    async createQuery(sql, params) {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(this.dbPath);
            db.run(sql, params, function(err, rows) {
                if (err) {
                    reject(err);
                } else {
                    db.close();
                    this.insertId = this.lastID;
                    resolve(this);
                }
            });
        });
    }

    async get(table, filter, columns, cityId, pageNo, pageSize, orderBy, descending) {
        let query = `SELECT ${columns ? columns : "*"} FROM ${table} `;
        const queryParams = [];

        if (filter && Object.keys(filter).length > 0) {
            query += "WHERE ";
            const filterKeys = Object.keys(filter);
            for (let i = 0; i < filterKeys.length; i++) {
                const key = filterKeys[i];
                if (Array.isArray(filter[key])) {
                    query += `${key} IN (${filter[key].map(() => '?').join(',')})`;
                    queryParams.push(...filter[key]);
                } else {
                    query += `${key} = ?`;
                    queryParams.push(filter[key]);
                }

                if (i < filterKeys.length - 1) {
                    query += ' AND ';
                }
            }
        }

        if (orderBy) {
            query += ` ORDER BY ${orderBy.join(', ')}`;
            if (descending) {
                query += ' DESC';
            }
        }

        if (pageNo !== undefined && pageSize !== undefined) {
            query += ` LIMIT ${(pageNo - 1) * pageSize}, ${pageSize}`;
        }

        const [rows] = await this.query(query, queryParams);
        return rows;
    }

    async create(table, data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map(() => '?').join(',');
        const q = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`;
        const response = await this.createQuery(q, values);
        return  [response];
    }

    async update(table, data, conditions) {
        const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
        const whereClause = Object.keys(conditions).map(key => `${key} = ?`).join(' AND ');
        const query = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
        await this.query(query, [data, conditions]);
    }

    async deleteData(table, filter) {
        let query = `DELETE FROM ${table} `;
        const queryParams = [];
        if (filter) {
            query += "WHERE ";
            for (const key in filter) {
                query += `${key} = ? AND `;
                queryParams.push(filter[key]);
            }
            query = query.slice(0, -4);
        }
        await this.query(query, queryParams);
    }

    async callStoredProcedure(spName, parameters, cityId) {
        let query = `CALL ${spName}`;
        if (parameters && parameters.length > 0) {
            query += `(${Array(parameters.length).fill("?")})`;
        }
        await query(query, parameters);
    }

    async callQuery(query, params, cityId) {
        const rows = await query(query, params);
        return { rows };
    }

    release(){
        // db.close();
    }

    close(){
        // db.close();
    }
}

module.exports = MockDb;

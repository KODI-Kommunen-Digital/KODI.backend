const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname,'..', 'test.db'); 
const cityPath = path.join(__dirname,'..', 'city-1.db'); 

let db; 

class MockDb{
    constructor(cityId) {
        db = new sqlite3.Database(dbPath);
        if (cityId) {
            db = new sqlite3.Database(cityPath);
        }
    }

    async query(sql, params) {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(dbPath);
            db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    db.close();
                    resolve({rows, fields: null});
                }
            });
        });
    }

    async createQuery(sql, params) {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(dbPath);
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

        const rows = await query(query, queryParams);
        return { rows };
    }

    async create(table, data, cityId) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map(() => '?').join(',');
        const q = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`;
        const response = await this.createQuery(q, values);
        return  [response];
    }

    async update(table, data, conditions, cityId) {
        const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
        const setValues = Object.values(data);
        const whereClause = Object.keys(conditions).map(key => `${key} = ?`).join(' AND ');
        const whereValues = Object.values(conditions);
        const query = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
        await query(query, [...setValues, ...whereValues]);
    }

    async deleteData(table, filter, cityId) {
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
        await query(query, queryParams);
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
        db.close();
    }

    close(){
        db.close();
    }
}

module.exports = MockDb;

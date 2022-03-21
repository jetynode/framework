const pool = require("@jetynode/framework/src/Blaze/Support/PoolConnection");
class Model {
  select(table = this.table, select = "*") {
    this.query = `SELECT ${select} FROM ${table} `;
    return this;
  }

  where(where) {
    let conditions = "";
    // If there is a condition object build query using keys and values
    if (where) {
      const conditionKeys = Object.keys(where);
      const conditionValues = Object.values(where).map((value) =>
        typeof value === "string" ? `'${value}'` : value
      );
      conditionKeys.forEach((key, index) => {
        conditions += `${key} = ${conditionValues[index]}${
          index === conditionKeys.length - 1 ? "" : " AND "
        }`;
      });
    }
    this.query = this.query + ` WHERE ${conditions}`;
    return this;
  }

  leftJoin(table, column1, condition, column2) {
    this.query =
      this.query + `LEFT JOIN ${table} ON ${column1} ${condition} ${column2}`;
    return this;
  }

  rightJoin(table, column1, condition, column2) {
    this.query =
      this.query + `RIGHT JOIN ${table} ON ${column1} ${condition} ${column2}`;
    return this;
  }

  first() {
    console.log(this.query);
    return new Promise((resolve, reject) => {
      DB.query(this.query, function (err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data[0] ?? []);
        }
      });
    });
  }

  get() {
    return new Promise((resolve, reject) => {
      DB.query(this.query, function (err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data ?? []);
        }
      });
    });
  }

  // Fetch all Data of table
  all() {
    let sql = `SELECT * FROM ${this.table}`;
    return new Promise((resolve, reject) => {
      pool.query(sql, function (err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data ?? []);
        }
      });
    });
  }

  // Fetch all Data of table With Select column option
  // get(select, callback) {
  //   if (Array.isArray(select) === false) {
  //     throw new Error("Method Error: First Parameter must be array!");
  //   }

  //   if (select.length > 0) select = select.join(", ");
  //   else select = "*";

  //   DB.query(`SELECT ${select} FROM ${this.table}`, (err, res) => {
  //     if (err) callback(err);
  //     callback(null, res);
  //   });
  // }

  // Fetch single Data of table
  find(id) {
    let sql = `SELECT * FROM ${this.table} WHERE id =${id}`;
    return new Promise((resolve, reject) => {
      pool.query(sql, function (err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data[0] ?? []);
        }
      });
    });
  }

  // Update Single Row
  insert(input, callback) {
    let values = [];
    for (const key in input) {
      values.push(`${key} = ?`);
    }
    values = values.join(", ");
    DB.query(
      `INSERT INTO  ${this.table} SET ${values}`,
      Object.values(input),
      (err, res, fields = input) => {
        if (err) callback(err);
        callback(null, {
          id: res.insertId,
          ...fields,
        });
      }
    );
  }

  // Update Single Row
  // update(id, input, callback) {
  //   let values = [];
  //   for (const key in input) {
  //     values.push(`${key} = ?`);
  //   }
  //   values = values.join(", ");
  //   DB.query(
  //     `UPDATE ${this.table} SET ${values} WHERE id=${id}`,
  //     Object.values(input),
  //     (err, res) => {
  //       if (err) callback(err);
  //       callback(null, true);
  //     }
  //   );
  // }

  isEmpty(val) {
    return val === undefined || val == null || val.length <= 0 ? true : false;
  }

  async includeBuilder(input, option) {
    const { table, pivot, pk, fk, fk_pivot, key, select = [] } = option;
    const promiser = [];
    for (let i = 0; i < input.length; i++) {
      const item = input[i];
      const query = QueryBuilder.build.innerJoin(
        table,
        pivot,
        pk,
        fk,
        fk_pivot,
        item[key],
        select
      );
      promiser.push(pool.query(query));
    }
    return Promise.all(promiser);
  }

  async include(options, data) {
    const db = this;
    const response = await db.get(data);

    // return if no record
    if (!response.length) return [];

    const promisers = options.map(function (option) {
      return db.includeBuilder(response, option);
    });
    const outputs = await Promise.all(promisers);
    const newResponse = [];
    for (let i = 0; i < response.length; i++) {
      const item = response[i];
      const join = {};
      for (let j = 0; j < outputs.length; j++) {
        const output = outputs[j];
        const option = options[j];
        join[option.table] = output[i].rows;
      }
      newResponse.push({
        ...item,
        ...join,
      });
    }
    if (data.top) return newResponse[0];
    return newResponse;
  }

  get(data = {}) {
    const sql = QueryBuilder.build.filter(this.table, data);
    return new Promise((resolve, reject) => {
      pool.query(sql, function (err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data.rows);
        }
      });
    });
  }

  save(data) {
    const sql = QueryBuilder.build.save(this.table, data);
    return new Promise((resolve, reject) => {
      pool.query(sql, Object.values(data), (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data.rows);
        }
      });
    });
  }

  update(data, where) {
    const sql = QueryBuilder.build.update(this.table, data, where);
    return new Promise((resolve, reject) => {
      pool.query(sql, Object.values(data), (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data.rows);
        }
      });
    });
  }

  delete(id) {
    const sql = `DELETE FROM ${this.table} WHERE id = ?`;
    return new Promise((resolve, reject) => {
      pool.query(sql, [this.table, id], function (err, data) {
        if (err) reject(err);
        resolve(data);
      });
    });
  }
}
const QueryBuilder = {
  build: {
    save: (name, data) => {
      const vIterator = Object.keys(data)
        .map((i, idx) => `$${idx + 1}`)
        .join(",");
      const keys = Object.keys(data).join(",");
      return `INSERT INTO ${name} (${keys}) VALUES (${vIterator})`;
    },

    filter: (name, { columns, where }) => {
      let conditions = "";

      // If there is a condition object build query using keys and values
      if (where) {
        const conditionKeys = Object.keys(where);
        const conditionValues = Object.values(where).map((value) =>
          typeof value === "string" ? `'${value}'` : value
        );
        conditionKeys.forEach((key, index) => {
          conditions += `${key} = ${conditionValues[index]}${
            index === conditionKeys.length - 1 ? "" : " AND "
          }`;
        });
      }

      let query = `SELECT ${columns ? columns.join() : "*"} FROM ${name}`;
      if (conditions) query += ` WHERE ${conditions}`;
      return query;
    },

    innerJoin: (name, pivot, pk, fk, fk_pivot, id, select = []) => {
      const selection = select.length
        ? select.map((s) => `s.${s}`).join(",")
        : "*";

      return `SELECT ${selection}
      FROM ${pivot} sc 
      INNER JOIN ${name} s ON s.${fk} = sc.${fk_pivot}
      WHERE sc.${pk} = ${id}`;
    },

    update: (name, data, where) => {
      let conditions = "";
      let updater = "";

      // If there is a condition object build query using keys and values
      if (where) {
        const conditionKeys = Object.keys(where);
        const conditionValues = Object.values(where).map((value) =>
          typeof value === "string" ? `'${value}'` : value
        );
        conditionKeys.forEach((key, index) => {
          conditions += `${key} = ${conditionValues[index]}${
            index === conditionKeys.length - 1 ? "" : " AND "
          }`;
        });
      }
      if (data) {
        const dataKey = Object.keys(data);
        dataKey.forEach((key, index) => {
          updater += `${key} = $${index + 1}`;
        });
      }
      let query = `UPDATE ${name} SET ${updater} `;
      if (conditions) query += ` WHERE ${conditions}`;
      return query;
    },
  },
};
module.exports = {
  Model,
  QueryBuilder,
};

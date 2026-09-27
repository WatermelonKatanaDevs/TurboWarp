const Mongoose = require('mongoose')
//const fs = require("fs");

const ProjectDataSchema = new Mongoose.Schema(
    {
        _id: String,
        keyvalues: {
            type: Object,
            default: {},
        },
        tables: {
            type: Object,
            default: {},
        },
    },
    { strict: false }
)

const ProjectData = Mongoose.model('projectdata', ProjectDataSchema)

const columntypes = ['string', 'number', 'boolean']

function checkname(value, label) {
    if (typeof value !== 'string' || value === '' || value === '__proto__')
        throw `invalid ${label} "${value}"`
    return value
}

function checkcolumn(value) {
    if (checkname(value, 'column') === 'id') throw `the id column cannot be modified`
    return value
}

function parse(value) {
    return typeof value === 'string' ? JSON.parse(value) : value
}

function isrecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function mark(doc, field, key) {
    doc.markModified(/^[^.$][^.]*$/.test(key) ? `${field}.${key}` : field)
}

// Database
const TurboDB = async function (id) {
    var db = {}
    db._read = true
    db._data = (await ProjectData.findOne({ _id: id })) || new ProjectData({ _id: id })
    db.gettable = function (table_name) {
        let tables = this._data.tables
        if (typeof table_name !== 'string' || !Object.hasOwn(tables, table_name))
            throw `no table found at "${table_name}"`
        return tables[table_name]
    }
    db.getKeyValue = function (key) {
        let keyvalues = this._data.keyvalues
        return typeof key === 'string' && Object.hasOwn(keyvalues, key) ? keyvalues[key] : JSON.stringify(null)
    }
    db.getAllKeyValues = function () {
        return this._data.keyvalues
    }
    db.setKeyValue = function (key, value) {
        this._data.keyvalues[checkname(key, 'key')] = value
        mark(this._data, 'keyvalues', key)
        return true
    }
    db.populateKeyValues = function (map) {
        map = parse(map)
        if (!isrecord(map)) throw `invalid key value map`
        let keys = Object.keys(map)
        keys.forEach((key) => checkname(key, 'key'))
        for (let key of keys) {
            this._data.keyvalues[key] = map[key]
        }
        this._data.markModified('keyvalues')
        return true
    }
    db.deleteKeyValue = function (key) {
        let keyvalues = this._data.keyvalues
        if (typeof key === 'string' && Object.hasOwn(keyvalues, key)) {
            delete keyvalues[key]
            mark(this._data, 'keyvalues', key)
        }
        return true
    }
    // table paths
    db.createRecord = function (table_name, record_json) {
        checkname(table_name, 'table')
        record_json = parse(record_json)
        if (!isrecord(record_json)) throw `invalid record for table "${table_name}"`
        let tables = this._data.tables
        if (!Object.hasOwn(tables, table_name)) {
            tables[table_name] = { records: [], nextId: 1 }
        }
        let table = tables[table_name]
        record_json.id = table.nextId++
        table.records.push(record_json)
        mark(this._data, 'tables', table_name)
        return record_json
    }
    db.createTable = function (table_name) {
        checkname(table_name, 'table')
        let tables = this._data.tables
        if (!Object.hasOwn(tables, table_name)) {
            tables[table_name] = { records: [], nextId: 1 }
            mark(this._data, 'tables', table_name)
        }
        return true
    }
    db.addColumn = function (column_name, table_name) {
        checkname(column_name, 'column')
        let table = this.gettable(table_name)
        for (let record of table.records) {
            if (!Object.hasOwn(record, column_name)) record[column_name] = null
        }
        mark(this._data, 'tables', table_name)
        return true
    }
    /*db.add_shared_table = function(table_name) {
    let file = `${path || __dirname}/${table_name}.csv`
    if (!fs.existsSync(file)) {
      this._data.tables[table_name] = self.csvToJSON(fs.readFileSync(file, "utf-8"))
    }
    return true;
  };
  db.import_csv = function(table_name, table_data_csv) {
    if (typeof table_name !== "string" || typeof table_data_csv !== "string") throw `unable to import csv table ${table_name} with data ${table_data_csv}`;
    let json = self.csvToJSON(table_data_csv)
    if (json.records.length < 0) throw "there isn't any data in this csv file";
    this._data.tables[table_name] = json;
    this._changed = true;
    return true;
  };*/
    db.populateTables = function (map) {
        map = parse(map)
        if (!isrecord(map)) throw `invalid table map`
        let names = Object.keys(map)
        for (let name of names) {
            checkname(name, 'table')
            if (!Array.isArray(map[name]) || !map[name].every(isrecord))
                throw `invalid records for table "${name}"`
        }
        let tables = this._data.tables
        for (let name of names) {
            let records = map[name]
            let nextId = records.reduce((max, record) => (Number.isInteger(record.id) ? Math.max(max, record.id + 1) : max), 1)
            for (let record of records) {
                if (!Number.isInteger(record.id)) record.id = nextId++
            }
            tables[name] = { records, nextId }
        }
        this._data.markModified('tables')
        return true
    }
    db.updateRecord = function (table_name, record_json) {
        let table = this.gettable(table_name)
        record_json = parse(record_json)
        if (!isrecord(record_json)) throw `invalid record for table "${table_name}"`
        let index = table.records.findIndex((record) => record.id === record_json.id)
        if (index < 0) return null
        table.records[index] = record_json
        mark(this._data, 'tables', table_name)
        return record_json
    }
    db.renameColumn = function (table_name, old_column_name, new_column_name) {
        let table = this.gettable(table_name)
        checkcolumn(old_column_name)
        checkcolumn(new_column_name)
        if (old_column_name === new_column_name) return true
        for (let record of table.records) {
            if (Object.hasOwn(record, old_column_name)) {
                record[new_column_name] = record[old_column_name]
                delete record[old_column_name]
            }
        }
        mark(this._data, 'tables', table_name)
        return true
    }
    db.coerceColumn = function (table_name, column_name, column_type) {
        let table = this.gettable(table_name)
        checkcolumn(column_name)
        if (!columntypes.includes(column_type))
            throw `invalid argument on table "${table_name}" column "${column_name}" type "${column_type}"`
        for (let record of table.records) {
            let value = record[column_name]
            switch (column_type) {
                case 'boolean': {
                    record[column_name] = typeof value === 'string' ? value.trim().toLowerCase() === 'true' : Boolean(value)
                    break
                }
                case 'number': {
                    record[column_name] = Number(value)
                    break
                }
                case 'string': {
                    record[column_name] = String(value)
                    break
                }
            }
        }
        mark(this._data, 'tables', table_name)
        return true
    }
    db.getColumn = function (table_name, column_name) {
        return this.gettable(table_name).records.map((record) => (record[column_name] !== undefined ? record[column_name] : null))
    }
    db.getColumnsForTable = function (table_name) {
        const columns = new Set(['id'])
        for (let record of this.gettable(table_name).records) {
            for (let p in record) columns.add(p)
        }
        return [...columns]
    }
    /*db.export_csv = function() {
    let { table_name } = req.query;
    let table = this._data.tables[table_name];
    if (table === undefined) throw `table "${table_name}" cannot be exported`;
fs.writeFileSync(`${self.csvPath}/${table_name}.csv`, self.jsonToCSV(table.records), "utf-8");
    return true;
  };*/
    db.readRecords = function (table_name) {
        return this.gettable(table_name).records
    }
    db.clearTable = function (table_name) {
        this.gettable(table_name)
        this._data.tables[table_name] = { records: [], nextId: 1 }
        mark(this._data, 'tables', table_name)
        return true
    }
    db.deleteRecord = function (table_name, record_id) {
        let table = this.gettable(table_name)
        let index = table.records.findIndex((record) => record.id === Number(record_id))
        if (index < 0) throw `failed to remove record on table "${table_name}" at id "${record_id}"`
        table.records.splice(index, 1)
        mark(this._data, 'tables', table_name)
        return true
    }
    db.deleteColumn = function (table_name, column_name) {
        let table = this.gettable(table_name)
        checkcolumn(column_name)
        for (let record of table.records) {
            delete record[column_name]
        }
        mark(this._data, 'tables', table_name)
        return { table_name, column_name }
    }
    db.deleteTable = function (table_name) {
        this.gettable(table_name)
        delete this._data.tables[table_name]
        mark(this._data, 'tables', table_name)
        return true
    }
    db.getTableNames = function () {
        return Object.keys(this._data.tables)
    }
    db.getLibraryManifest = function () {
        return {}
    }
    db.projectHasData = function () {
        return (
            Object.keys(this._data.keyvalues).length > 0 ||
            Object.keys(this._data.tables).length > 0
        )
    }
    db.clearAllData = function () {
        this._data.keyvalues = {}
        this._data.tables = {}
        this._data.markModified("keyvalues")
        this._data.markModified("tables")
        return true
    }
    return db
}

// Api Interface
var TurboDBList = {}
var loading = {}
setInterval(() => {
    for (let i in TurboDBList) {
        let db = TurboDBList[i]
        let doc = db._data
        if (doc.isNew ? db.projectHasData() : doc.isModified()) {
            console.log('Saving changes to ' + i)
            doc.save().catch((err) => {
                console.log('Failed to save ' + i, err)
                if (TurboDBList[i] === db) delete TurboDBList[i]
            })
        } else if (!db._read) {
            console.log('Removing ' + i + ' from RAM')
            delete TurboDBList[i]
            continue
        }
        db._read = false
    }
}, 60 * 1000)
function createLink(app, method, name, callback) {
    app[method]('/datablock_storage/:id/' + name, async (req, res) => {
        // console.log(method, name, req.params.id, req.query, req.body)
        try {
            const id = req.params.id
            if (!/^[\w-]{1,64}$/.test(id)) throw `invalid project id "${id}"`
            var db = TurboDBList[id]
            if (db === undefined) {
                loading[id] = loading[id] || TurboDB(id).finally(() => delete loading[id])
                db = TurboDBList[id] = await loading[id]
            }
            db._read = true
            // console.log(db)
            var ret = await callback(db, req)
            // console.log(ret)
            res.status(200).type('json').set('X-Content-Type-Options', 'nosniff')
                .send(typeof ret === 'string' ? ret : JSON.stringify(ret))
        } catch (e) {
            console.log(e)
            res.status(400).json({ Error: String(e) })
        }
    })
}

module.exports = {
    Database: function (a) {
        const c = createLink
        c(a, 'get', 'get_key_value', (db, req) => db.getKeyValue(req.query.key))
        c(a, 'get', 'get_key_values', (db) => db.getAllKeyValues())
        c(a, 'post', 'set_key_value', (db, req) =>
            db.setKeyValue(req.body.key, req.body.value)
        )
        c(a, 'put', 'populate_key_values', (db, req) =>
            db.populateKeyValues(req.body.key_values_json)
        )
        c(a, 'delete', 'delete_key_value', (db, req) =>
            db.deleteKeyValue(req.body.key)
        )
        c(a, 'post', 'create_record', (db, req) =>
            db.createRecord(req.body.table_name, req.body.record_json)
        )
        c(a, 'post', 'create_table', (db, req) =>
            db.createTable(req.body.table_name)
        )
        c(a, 'post', 'add_column', (db, req) =>
            db.addColumn(req.body.column_name, req.body.table_name)
        )
        //c(a,"post","add_shared_table", (db,req) => db.add_shared_table(req.body.table_name));
        //c(a,"post","import_csv", (db,req) => db.import_csv(req.body.table_name, req.body.table_data_csv));
        c(a, 'put', 'populate_tables', (db, req) =>
            db.populateTables(req.body.tables_json)
        )
        c(a, 'put', 'update_record', (db, req) =>
            db.updateRecord(req.body.table_name, req.body.record_json)
        )
        c(a, 'put', 'rename_column', (db, req) =>
            db.renameColumn(
                req.body.table_name,
                req.body.old_column_name,
                req.body.new_column_name
            )
        )
        c(a, 'put', 'coerce_column', (db, req) =>
            db.coerceColumn(
                req.body.table_name,
                req.body.column_name,
                req.body.column_type
            )
        )
        c(a, 'get', 'get_column', (db, req) => db.getColumn(req.query.table_name, req.query.column_name))
        c(a, 'get', 'get_columns_for_table', (db, req) =>
            db.getColumnsForTable(req.query.table_name)
        )
        //c(a,"get","export_csv", (db,req) => db.export_csv(req.query.table_name));
        c(a, 'get', 'read_records', (db, req) =>
            db.readRecords(req.query.table_name)
        )
        c(a, 'delete', 'delete_record', (db, req) =>
            db.deleteRecord(req.body.table_name, req.body.record_id)
        )
        c(a, 'delete', 'delete_column', (db, req) =>
            db.deleteColumn(req.body.table_name, req.body.column_name)
        )
        c(a, 'delete', 'delete_table', (db, req) =>
            db.deleteTable(req.body.table_name)
        )
        c(a, 'get', 'get_table_names', (db) => db.getTableNames())
        c(a, 'get', 'get_library_manifest', (db) => db.getLibraryManifest())
        c(a, 'get', 'project_has_data', (db) => db.projectHasData())
        c(a, 'delete', 'clear_all_data', (db) => db.clearAllData())
    },
}

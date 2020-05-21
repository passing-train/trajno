import Database from "@/services/database";
import {ipcMain} from 'electron'
import log from 'electron-log'

export default class Customers {

    public static async init() {

        ipcMain.on('get-customer-data', async (event: Event ) => {
            event.returnValue = await this.getCustomerData();
        });
        ipcMain.on('get-customer-or-insert', async (event: Event, name: string ) => {
            event.returnValue = await this.getCustomerOrInsert(name);
        });
        ipcMain.on('get-suggest-customer-data', async (event: Event, queryText: string ) => {
            event.returnValue = await this.getSuggestCustomerData(queryText);
        });
        ipcMain.on('new-customer', async (event: Event, name: string, code: string ) => {
            event.returnValue = await this.newCustomer(name, code);
        });
        ipcMain.on('update-customer', async (event: Event, id: number, name: string, code: string ) => {
            event.returnValue = await this.updateCustomer(id, name, code);
        });
        ipcMain.on('delete-customer', async (event: Event, id: number ) => {
            event.returnValue = await this.deleteCustomer(id);
        });

    }
    public static async getCustomerData() {

        try {
            let results: any = await Database.all(`
                SELECT
                    id, name, customer_external_code
                FROM tempo_customers
                `);

            return results;
        } catch (e) {
            log.error(e);
        }
    }

    public static async getCustomerOrInsert(name: string) {
        let sql: string = `
                SELECT id
                FROM tempo_customers
                WHERE name = "${name}" LIMIT 1
                `;
        let customer = await Database.one(sql);

        if (customer === undefined) {
            customer = this.newCustomer(name, "");
        }
        log.debug(customer);
        return customer
    }


    public static async getSuggestCustomerData(queryText: string) {
        try {
            let results: any = await Database.all(`
                SELECT id, name
                FROM tempo_customers
                WHERE name LIKE "%${queryText}%"
                `);

            return results;
        } catch (e) {
            log.error(e);
        }
    }

    public static async newCustomer(name: string, code: string) {

        const sql = `
            INSERT INTO tempo_customers (name, customer_external_code)
            VALUES ("${name}","${code}")
        `;

        await Database.run(sql)


        let id = await Database.one("SELECT last_insert_rowid() as id");

        if (id === undefined) {
           id = null;
        }
        return id;

    }

    public static async updateCustomer(id: number, name: string, code: string): Promise<boolean> {

        const sql = `
            UPDATE tempo_customers SET name="${name}", customer_external_code="${code}"
            WHERE id = ${id}
        `;

        await Database.run(sql);
        return true;

    }

    public static async deleteCustomer(id: number): Promise<boolean> {

        const sql = `
            DELETE from tempo_customers
            WHERE id = ${id}
        `;

        await Database.run(sql);
        return true;

    }
}

import Database from "@/services/database";
import {ipcMain} from 'electron'
import log from 'electron-log'

export default class Entryinputs {

    private static lastEntryId: number = -1;
    private static lastEntryCreatedAt: number = -1;
    private static lastEntryTitle: string = "";

    public static async init() {
        ipcMain.on('set-entryinput', async (event: Event, entryText: string) => {
            event.returnValue = await Entryinputs.newEntry(entryText);
        });

        ipcMain.on('get-suggest-data', async (event: Event, queryText: string) => {
            event.returnValue = await this.getSuggestData(queryText);
        });

        ipcMain.on('get-entry-data', async (event: Event ) => {
            event.returnValue = await this.getEntryData();
        });
        ipcMain.on('get-entry-flat-data', async (event: Event ) => {
            event.returnValue = await this.getEntryFlatData();
        });

        ipcMain.on('delete-entry', async (event: Event, entryText: string ) => {
            event.returnValue = await this.deleteEntry(entryText);
        });
        ipcMain.on('delete-entry-flat', async (event: Event, entryId: number ) => {
            event.returnValue = await this.deleteEntryFlat(entryId);
        });

        ipcMain.on('update-entry', async (
            event: Event,
            oldTitle: string,
            newTitle: string,
            customerId: number,
            projectId: number,
        ) => {
            event.returnValue = await this.updateRecord(oldTitle, newTitle, customerId, projectId);
        });

        ipcMain.on('update-entry-flat', async (
            event: Event,
            entryId: number,
            newTitle: string,
            customerId: number,
            projectId: number,
        ) => {
            event.returnValue = await this.updateRecordFlat(entryId, newTitle, customerId, projectId);
        });

    }

    public static async getEntryData() {
        try {
            let results: any = await Database.all(`
                SELECT
                   e.entry_text as title,
                   e.tempo_customer_id as customer_id,
                   c.name as customer_name,
                   e.tempo_project_id as project_id,
                   p.name as project_name,
                   e.tempo_customer_id as total_time,
                   e.tempo_customer_id as today_time
                FROM tempo_entries e
                LEFT JOIN tempo_customers c
                    ON c.id = e.tempo_customer_id
                LEFT JOIN tempo_projects p
                    ON p.id = e.tempo_project_id
                GROUP BY title
                `);

            return results;
        } catch (e) {
            log.error(e);
        }
    }

    public static async getEntryFlatData() {
        try {
            let results: any = await Database.all(`
                SELECT
                   e.id as id,
                   e.entry_text as title,
                   e.tempo_customer_id as customer_id,
                   c.name as customer_name,
                   e.tempo_project_id as project_id,
                   p.name as project_name,
                   e.created_at as created_at,
                   e.time_delta as time_delta,
                   e.last_in_block as last_in_block
                FROM tempo_entries e
                LEFT JOIN tempo_customers c
                    ON c.id = e.tempo_customer_id
                LEFT JOIN tempo_projects p
                    ON p.id = e.tempo_project_id
                `);

            return results;
        } catch (e) {
            log.error(e);
        }
    }


    public static async getSuggestData(queryText: string) {
        try {
            let results: any = await Database.all(`
                SELECT id, entry_text as name
                FROM tempo_entries
                WHERE entry_text LIKE "%${queryText}%"
                GROUP BY name
                `);

            return results;
        } catch (e) {
            log.error(e);
        }
    }

    public static async newEntry(entryText: string): Promise<boolean> {

        log.debug(`lastId: ${this.lastEntryId}`);
        const currentTimeStamp: number = Math.floor(new Date().getTime() / 1000);
        let last_in_block: number = 1;

        // Store timedelta into last record
        if(this.lastEntryId > 0){

            if( entryText == this.lastEntryTitle ){
                last_in_block = 0;
            }

            const sqllast:string = `
            UPDATE tempo_entries SET
            time_delta=${(currentTimeStamp - this.lastEntryCreatedAt)},
            last_in_block = ${last_in_block}
            WHERE id = ${this.lastEntryId} `;

            log.debug(`last update sql ${sqllast}`);
            await Database.run(sqllast);
        }

        let last_same_entry = await Database.one(`SELECT * from tempo_entries where entry_text = "${entryText}" ORDER BY created_at LIMIT 1`);
        if(last_same_entry){
            log.debug(`same entry  ${last_same_entry.tempo_customer_id}`);
            log.debug(`same entry  ${last_same_entry.tempo_project_id}`);
            const sql: string = `
            INSERT INTO tempo_entries (entry_text, created_at, tempo_customer_id, tempo_project_id, last_in_block)
            VALUES ("${entryText}",${currentTimeStamp}, ${last_same_entry.tempo_customer_id}, ${last_same_entry.tempo_project_id}, 1) `;
            await Database.run(sql);
            log.debug(`insert sql ${sql}`);
        }
        else{
            const sql: string = `
            INSERT INTO tempo_entries (entry_text, created_at, last_in_block)
            VALUES ("${entryText}",${currentTimeStamp}, 1) `;
            await Database.run(sql);
            log.debug(`insert sql ${sql}`);
        }

        let lastId = await Database.one("SELECT last_insert_rowid() as id");
        this.lastEntryId = lastId.id;

        let lastRecord = await Database.one(`
                SELECT *
                FROM tempo_entries
                WHERE id = ${this.lastEntryId} `);

        this.lastEntryCreatedAt = lastRecord.created_at;
        this.lastEntryTitle = lastRecord.entry_text

        log.debug(`lastId: ${this.lastEntryId}`);
        log.debug(`lastEntryCreatedAt: ${this.lastEntryCreatedAt}`);
        log.debug(`lastEntryTitle: ${this.lastEntryTitle}`);

        return true;
    }

    public static async updateRecord(oldTitle: string, newTitle: string, customerId: number, projectId: number): Promise<boolean> {

        const sql = `
            UPDATE tempo_entries SET
            entry_text="${newTitle}",
            tempo_customer_id = ${customerId},
            tempo_project_id = ${projectId}
            WHERE entry_text = "${oldTitle}"
        `;

        await Database.run(sql)
        return true;
    }
    public static async updateRecordFlat(entryId: number, newTitle: string, customerId: number, projectId: number): Promise<boolean> {

        const sql = `
            UPDATE tempo_entries SET
            entry_text="${newTitle}",
            tempo_customer_id = ${customerId},
            tempo_project_id = ${projectId}
            WHERE id = "${entryId}"
        `;

        await Database.run(sql)
        return true;
    }

    public static async deleteEntry(entryText: string): Promise<boolean> {

        const sql = `
            DELETE from tempo_entries
            WHERE entry_text = "${entryText}"
        `;

        await Database.run(sql);
        return true;

    }
    public static async deleteEntryFlat(entryId: number): Promise<boolean> {

        const sql = `
            DELETE from tempo_entries
            WHERE id = "${entryId}"
        `;
        log.debug(sql);

        await Database.run(sql);
        return true;

    }

}

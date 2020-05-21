import Database from "@/services/database";
import {ipcMain} from 'electron'
import log from 'electron-log'

export default class Entryinputs {

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

        ipcMain.on('delete-entry', async (event: Event, entryText: string ) => {
            event.returnValue = await this.deleteEntry(entryText);
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

        //log.debug(results);
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

        //log.debug(results);
            return results;
        } catch (e) {
            log.error(e);
        }
    }

    public static async newEntry(entryText: string): Promise<boolean> {

        const time = Math.floor(new Date().getTime() / 1000);
        const sql = `
            INSERT INTO tempo_entries (entry_text, created_at)
            VALUES (?,?)
        `;

        log.debug(`insert input ${entryText} ${time}`);

        await Database.run(sql, [entryText, time])
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

        log.debug(`sql: ${sql}`);
        log.debug(`update old: ${oldTitle} new: ${newTitle}`);

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

}

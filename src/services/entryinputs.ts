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
    }

    public static async getEntryData() {
        try {
            let results: any = await Database.all(`
                SELECT
                    entry_text as title,
                    tempo_customer_id as customer,
                    tempo_project_id as project,
                    tempo_customer_id as total_time,
                    tempo_customer_id as today_time
                FROM tempo_entries
                GROUP BY title
                `);

        log.debug(results);
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

        log.debug(results);
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
}
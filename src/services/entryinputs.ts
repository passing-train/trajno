import Database from "@/services/database";
import {ipcMain} from 'electron'
import log from 'electron-log'

export default class Entryinputs {

    private static lastEntryId: number = -1;
    private static lastEntryCreatedAt: number = -1;
    private static lastEntryText: string = "";

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
            oldText: string,
            newText: string,
            customerId: number,
            projectId: number,
        ) => {
            event.returnValue = await this.updateRecord(oldText, newText, customerId, projectId);
        });

        ipcMain.on('add-remove-minutes-to-entry', async (event: Event, entryText: string, minutes: number ) => {
            event.returnValue = await this.add_or_remove_minutes_on_last_day(entryText,minutes);
        });

        ipcMain.on('update-entry-flat', async (
            event: Event,
            entryId: number,
            newText: string,
            customerId: number,
            projectId: number,
        ) => {
            event.returnValue = await this.updateRecordFlat(entryId, newText, customerId, projectId);
        });

    }

    public static async asyncForEach(array:any, callback:any) {
        for (let index = 0; index < array.length; index++) {
            await callback(array[index], index, array);
        }
    }

    public static async getEntryData() {

        let resultsplus:any[] = [];
        let results: any = await Database.all(`
                SELECT
                   e.entry_text as entry_text,
                   e.tempo_customer_id as customer_id,
                   c.name as customer_name,
                   e.tempo_project_id as project_id,
                   p.name as project_name
                FROM tempo_entries e
                LEFT JOIN tempo_customers c
                    ON c.id = e.tempo_customer_id
                LEFT JOIN tempo_projects p
                    ON p.id = e.tempo_project_id
                GROUP BY entry_text
                `);

        await this.asyncForEach(results, (async (row:any) => {
            row.total_time = await this.total_time_in_seconds(row.entry_text);
            resultsplus.push(row);
        }));

        return resultsplus;
    }

    private static async total_time_in_seconds(entryText: string): Promise<number>{

        let total_secs:number = 0;
        let last_entry:any = null;
        let block_total:number = 0;
        let work_break:boolean = false;
        let row: object;
        let rows: any[] = [];

        //MINUTEN?
        // TODO CONFIGURABLE
        let interval: number = 20;//NSUserDefaults.standardUserDefaults.integerForKey('AskInterval')
        let extra_marge: number = 30;

        let sql:string = `SELECT * FROM tempo_entries WHERE entry_text ="${entryText}"`;

        let entries: any = await Database.all(sql);
        await entries.forEach((entry:any)=>{

            // RESET VARS
            work_break = false;

            if( last_entry === null ||
                entry.entry_text != last_entry.entry_text ||
                last_entry.last_in_block === 1 )
            {
                block_total = 0;
            }

            // PREVENT TO LONG BLOCKS, WHEN TOO LONG TREAT AS EXTRA BLOCK
            // TODO CONFIGURABLE
            if (entry.time_delta > (interval + 5 + extra_marge) * 60 ){
                block_total += (interval + 5) * 60 + extra_marge;
                work_break = true;
            }
            else {
                block_total += entry.time_delta;
            }

            block_total += entry.extra_time;

            // DISPLAY AS NEW DAY OR LAST BLOCK (??)
            if(
                entry.last_in_block === 1 ||
                work_break ){

                row = {
                    created_at: entry.created_at,
                    block_total_secs: block_total
                }

                rows.push( row );
            }
            last_entry = entry;
        });

        rows.forEach((r:any)=>{
            total_secs = total_secs + r.block_total_secs;
        })

        return total_secs;
    }

    public static async add_or_remove_minutes_on_last_day(entryText:string, minutes:number){

        log.debug(minutes);
        let last_day_entry = await Database.one(`SELECT * from tempo_entries where entry_text = "${entryText}" ORDER BY created_at LIMIT 1`);
        log.debug(last_day_entry);

        let extra_time:number = last_day_entry.extra_time + (minutes * 60);

        const sqllast:string = `
            UPDATE tempo_entries SET
            extra_time=${extra_time}
            WHERE id = ${last_day_entry.id}`;

        log.debug(`last update sql ${sqllast}`);
        await Database.run(sqllast);
    }

    /*
  def add_extra_time_last_day sender

    if @addextratime_field.stringValue != @addextratime_field.stringValue.to_s.to_i.to_s and
        @addextratime_field.stringValue != @addextratime_field.stringValue.to_s.to_f.to_s

      alert = NSAlert.alloc.init
      alert.setMessageText  "Can't add time"
      alert.setInformativeText "Please enter the amount of minutes as a number. Add '-' to decrease time."
      alert.addButtonWithTitle "Ok"
      alert.runModal
    else

      @last_selected_row = @table_view.selectedRow
      last_day_entry = Entry.where(:title).eq(@entries[@last_selected_row].title).sort_by('created_at').last
      last_day_entry.extra_time = last_day_entry.extra_time + (@addextratime_field.stringValue.to_i * 60)

      cdq.save
      @table_view.reloadData

      disable_edit
      indexSet = NSIndexSet.indexSetWithIndex @last_selected_row
      @table_view.selectRowIndexes(indexSet, byExtendingSelection:false)
      self.window.makeFirstResponder @table_view

    end

    @addextratime_field.setStringValue ''
  end
     */


    public static async getEntryFlatData() {
        try {
            let results: any = await Database.all(`
                SELECT
                   e.id as id,
                   e.entry_text as entry_text,
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

            if( entryText == this.lastEntryText ){
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
        this.lastEntryText = lastRecord.entry_text

        log.debug(`lastId: ${this.lastEntryId}`);
        log.debug(`lastEntryCreatedAt: ${this.lastEntryCreatedAt}`);
        log.debug(`lastEntryText: ${this.lastEntryText}`);

        return true;
    }

    public static async updateRecord(oldText: string, newText: string, customerId: number, projectId: number): Promise<boolean> {

        const sql = `
            UPDATE tempo_entries SET
            entry_text="${newText}",
            tempo_customer_id = ${customerId},
            tempo_project_id = ${projectId}
            WHERE entry_text = "${oldText}"
        `;

        await Database.run(sql)
        return true;
    }
    public static async updateRecordFlat(entryId: number, newText: string, customerId: number, projectId: number): Promise<boolean> {

        const sql = `
            UPDATE tempo_entries SET
            entry_text="${newText}",
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

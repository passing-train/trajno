import Database from "@/services/database";
import log from 'electron-log'
import {formatMinutes, getDateStringFromStamp,formatMetricHours} from "@/util/time_util";
const ipcMain = require('electron').ipcMain;

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
            //event.u = await this.getEntryData();
        });
        ipcMain.on('get-entry-flat-data', async (event: Event ) => {
            event.returnValue = await this.getEntryFlatData();
        });

/*        ipcMain.on('flush-entries', async (event: Event, entryText: string ) => {
            event.returnValue = await this.flushEntries();
        });
        */
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

    /*
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
    */

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

    public static async interpret_day_totals_exact(){
        let rows = await this.interpret(true);

        let flat_activity_totals: any[] = [];
        let dates: { [date: string]: any } = { };
        let dates_with_totals: { [date: string]: any } = { };

        rows.forEach((entry:any)=>{
            if(!dates.hasOwnProperty(entry.date)){
                dates[entry.date] = [];
            }
            dates[entry.date].push(entry);
        });


        Object.keys(dates).forEach((date:string)=>{
            if(!dates_with_totals.hasOwnProperty(date)){
                dates_with_totals[date] = {
                    date: date,
                    activities: {}
                }
            }

            dates[date].forEach((entry:any)=>{
                if(!dates_with_totals[date].activities.hasOwnProperty(entry.entry_text)){
                //if(!entry['entry_text'] in dates_with_totals[date]['activities']) {

                    dates_with_totals[date]['activities'][entry['entry_text']] = {
                        'time_spent': 0,
                        'project_code': entry['project_code'],
                        'customer_code': entry['customer_code']
                    };
                }

                if('block_total_secs' in entry){
                    dates_with_totals[date]['activities'][entry['entry_text']]['time_spent'] += entry['block_total_secs'];
                }
            });
        });

        Object.keys(dates_with_totals).forEach((date:string)=>{

             Object.keys(dates_with_totals[date]['activities']).forEach((entry_text:string)=>{

                let act_record:any = dates_with_totals[date]['activities'][entry_text];
                 //log.debug(act_record);

                flat_activity_totals.push({

                    'medewerker': '2', //TODO CONFIGURABLE
                    'artikel': 'dev', //TODO CONFIGURABLE
                    'date': dates_with_totals[date]['date'],
                    'customer_code': (act_record['customer_code']?act_record['customer_code']:''),
                    'project_code': (act_record['project_code']?act_record['project_code']:''),
                    'activity': entry_text,
                    'time_spent': formatMetricHours(act_record['time_spent']) //TODO Format metric hours
                });
            });
        });

        log.debug(flat_activity_totals);

        return flat_activity_totals;

    }

    public static async interpret(last_only:boolean){
        let last_entry:any = null;
        let block_total:number = 0;
        let block_total_secs:number = 0;
        let work_break:boolean = false;
        let cum_start_time:number = 0;
        let day_next_entry: string = '';
        let rows: any[] = [];
        let row: object;
        let i:number = 0;

        //MINUTEN?
        // TODO CONFIGURABLE
        let interval: number = 20;//NSUserDefaults.standardUserDefaults.integerForKey('AskInterval')
        let extra_marge: number = 30;

        //let sql:string = `SELECT * FROM tempo_entries ORDER BY created_at`;
        let entries: any = await Database.all(`
                SELECT
                   e.entry_text as entry_text,
                   e.created_at as created_at,
                   e.last_in_block as last_in_block,
                   e.extra_time as extra_time,
                   e.time_delta as time_delta,
                   c.customer_external_code as customer_code,
                   c.name as customer_name,
                   p.project_external_code as project_code,
                   p.name as project_name
                FROM tempo_entries e
                LEFT JOIN tempo_customers c
                    ON c.id = e.tempo_customer_id
                LEFT JOIN tempo_projects p
                    ON p.id = e.tempo_project_id
                ORDER BY created_at
                `);

        //let entries: any = await Database.all(sql);
        await this.asyncForEach(entries, (async (entry:any) => {
        //await entries.forEach(async (entry:any)=>{

            i += 1;
            work_break = false;
            row = {};



            let sqlNext:string = `SELECT * FROM tempo_entries ORDER BY created_at`;
            let entriesNext: any = await Database.all(sqlNext);
            if(entriesNext[i]){
                day_next_entry = getDateStringFromStamp(entriesNext[i].created_at)
            }
            else{
                day_next_entry = '';
            }


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

            //log.debug(getDateStringFromStamp(entry.created_at));

            // DISPLAY AS NEW DAY OR LAST BLOCK
            if( entry.last_in_block === 1 ||
                getDateStringFromStamp(entry.created_at) != day_next_entry ||
                work_break ) {

                block_total_secs = block_total;
                block_total = 0;

            }

            if( !last_only ||
                entry.last_in_block === 1 ||
                getDateStringFromStamp(entry.created_at) != day_next_entry ||
                work_break ||
                formatMinutes(block_total) == "00:00" ) {

                //log.debug(getDateStringFromStamp(entry.created_at));

                row = {
                    date: getDateStringFromStamp(entry.created_at),
                    customer_code: entry.customer_code,
                    entry_text: entry.entry_text,
                    block_total_secs: block_total_secs,
                    project_code: entry.project_code
                }

                //log.debug(row);

                rows.push( row );
            }

            last_entry = entry;

        }));

        //log.debug(rows);

        return rows;

    }

    /*
  def interpret(keys = nil, last_only = false)
    last_entry = nil
    block_total = 0
    cum_start_time = 0

    rows = []

    i = 0
    Entry.where(:not_in_export).eq(0).sort_by('created_at').each do |entry|

      i += 1

      if block_total == 0 ||  cum_start_time == 0
        cum_start_time = @timeFormat.stringFromDate(entry.created_at)
      end

      if Entry.where(:not_in_export).eq(0).sort_by('created_at')[i]
        day_next_entry = @dateFormat.stringFromDate(Entry.where(:not_in_export).eq(0).sort_by('created_at')[i].created_at)
      else
        day_next_entry = nil
      end

      row = {}

      if last_entry.nil? || entry.title != last_entry.title || last_entry.last_in_block?
        block_total = 0
      end

      ## Voorkom te lange blokken, dan behandelen als een extra stuk
      interval = NSUserDefaults.standardUserDefaults.integerForKey('AskInterval')
      extra_marge = 30
      if entry.time_delta > (interval + 5 + extra_marge) * 60
        block_total += (interval + 5) * 60 + extra_marge
        work_break = true
      else
        work_break = false
        block_total += entry.time_delta
      end

      block_total += entry.extra_time

      time_delta_display = TimeUtility::format_time_from_seconds block_total

      # weergeven als nieuwe dag of laatste blok
      if entry.last_in_block? ||
          @dateFormat.stringFromDate(entry.created_at) != day_next_entry ||
          work_break
        block_total_display = TimeUtility::format_time_from_seconds block_total
        block_total_secs = block_total
        block_total = 0
      else
        block_total_display = ''
      end

      row = GeneralUtility::interpret_add_key_val(row, keys, 'created_at', entry.created_at)
      row = GeneralUtility::interpret_add_key_val(row, keys, 'day', @dayFormat.stringFromDate(entry.created_at))
      row = GeneralUtility::interpret_add_key_val(row, keys, 'date', @dateFormat.stringFromDate(entry.created_at))
      row = GeneralUtility::interpret_add_key_val(row, keys, 'time', @timeFormat.stringFromDate(entry.created_at))
      row = GeneralUtility::interpret_add_key_val(row, keys, 'time_first_log', cum_start_time)
      row = GeneralUtility::interpret_add_key_val(row, keys, 'time_last_log', @timeFormat.stringFromDate(entry.created_at))
      row = GeneralUtility::interpret_add_key_val(row, keys, 'activity', entry.title)
      row = GeneralUtility::interpret_add_key_val(row, keys, 'project_id', entry.project_id)
      row = GeneralUtility::interpret_add_key_val(row, keys, 'customer_id', entry.customer_id)
      row = GeneralUtility::interpret_add_key_val(row, keys, 'time_delta', time_delta_display)
      row = GeneralUtility::interpret_add_key_val(row, keys, 'time_spent', block_total_display)
      row = GeneralUtility::interpret_add_key_val(row, keys, 'block_total_secs', block_total_secs)
      row = GeneralUtility::interpret_add_key_val(row, keys, 'last_in_block', entry.last_in_block)

      if !last_only ||
          entry.last_in_block? ||
          @dateFormat.stringFromDate(entry.created_at) != day_next_entry ||
          work_break ||
          time_delta_display == '00:00'

        rows << row
      end

      last_entry = entry

    end
    rows
  end
    */


    /*
    rows = interpret_day_totals_exact(keys)
  def interpret_day_totals_exact(keys)

    rows = interpret(keys,true)

    dates = {}
    rows.each do | entry |
      dates[entry['date']] = [] if dates[entry['date']].nil?
      dates[entry['date']] << entry
    end

    dates_with_totals = {}
    dates.each do | date, entries |
      if dates_with_totals[date].nil?
        dates_with_totals[date] = {
          'date'=> date,
    #      'day' => entries[0]['day'],
          'activities' => {}
        }
      end

      entries.each do | entry|
        if dates_with_totals[date]['activities'][entry['activity']].nil?
          dates_with_totals[date]['activities'][entry['activity']] = {
            'time_spent' => 0,
            'project_id' => entry['project_id'],
            'customer_id' => entry['customer_id']
          }
        end

        dates_with_totals[date]['activities'][entry['activity']]['time_spent'] += entry['block_total_secs'] if entry['block_total_secs']
      end
    end

    #ap dates_with_totals

    flat_activity_totals = []
    dates_with_totals.each do | date, entry |
      entry['activities'].each do | activity, act_record |

       flat_activity_totals << {
        'medewerker' => '2',
        'artikel' => 'dev',
        'date'=> entry['date'],
        'customer_id'=> act_record['customer_id'],
        'project_id'=> act_record['project_id'],
        'activity' => activity,
        'time_spent'=> TimeUtility::format_time_from_seconds_to_metric_hours(act_record['time_spent'])
      }
      end
    end

    #ap flat_activity_totals
    flat_activity_totals
  end


    */


    public static async getEntryData() {

        let resultsplus:any[] = [];
        let results2: any;
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

        results2 = resultsplus;
        return results2;
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
        return true;
    }

    public static async getEntryFlatData() {
        try {
            let results: any = await Database.all(`
                SELECT
                   e.id as id,
                   e.entry_text as entry_text,
                   e.tempo_customer_id as customer_code,
                   c.name as customer_name,
                   e.tempo_project_id as project_code,
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
    public static async flushEntries(): Promise<boolean> {

        const sql = `
            DELETE from tempo_entries WHERE true
        `;

        await Database.run(sql);
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

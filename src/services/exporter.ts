import log from 'electron-log'
import stringify from 'csv-stringify';
import fs from 'fs';

export default class Exporter {

    public static writeEntryDayTotalsToCSV(filepath:string, dataObj:any[]){

        let columns = {
            medewerker: 'medewerker',
            artikel: 'artikel',
            date: 'date',
            customer_code: 'customer_code',
            project_code: 'project_code',
            activity: 'activity',
            time_spent: 'time_spent'
        };

        stringify(dataObj, { header: true, columns: columns }, (err, output) => {
            if (err) throw err;
            fs.writeFile(filepath, output, (err) => {
                if (err) throw err;
                log.debug(filepath + ' saved.');
            });
        });
    }


}


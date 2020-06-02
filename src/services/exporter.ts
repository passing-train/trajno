import log from 'electron-log'
import stringify from 'csv-stringify';
import fs from 'fs';

export default class Exporter {

    public static writeEntryDayTotalsToCSV(filepath:string, dataObj:any[]){

        let columns = {
            medewerker: 'medewerker',
            artikel: 'artikel',
            date: 'date',
            customer_id: 'customer_id',
            project_id: 'project_id',
            activity: 'activity',
            time_spent: 'time_spent'
        };



        //  2,dev,2020-05-11,7651,PRJ-0132-AKOCK,rusland1,1.76
        let data = [];

        for (var i = 0; i < 10; i++) {
            data.push([2,'dev','2020-05-11','7651','PRJ-0132-AKOCK','rusland1, en meer',1.76]);
        }

        stringify(data, { header: true, columns: columns }, (err, output) => {
            if (err) throw err;
            fs.writeFile(filepath, output, (err) => {
                if (err) throw err;
                log.debug(filepath + ' saved.');
            });
        });
    }


}


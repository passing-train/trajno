import Database from "@/services/database";
import {ipcMain} from 'electron'
import log from 'electron-log'

export default class Projects {

    public static async init() {

        ipcMain.on('get-project-data', async (event: Event ) => {
            event.returnValue = await this.getProjectData();
        });
        ipcMain.on('get-project-or-insert', async (event: Event, name: string ) => {
            event.returnValue = await this.getProjectOrInsert(name);
        });
        ipcMain.on('get-suggest-project-data', async (event: Event, queryText: string ) => {
            event.returnValue = await this.getSuggestProjectData(queryText);
        });
        ipcMain.on('new-project', async (event: Event, name: string, code: string ) => {
            event.returnValue = await this.newProject(name, code);
        });
        ipcMain.on('update-project', async (event: Event, id: number, name: string, code: string ) => {
            event.returnValue = await this.updateProject(id, name, code);
        });
        ipcMain.on('delete-project', async (event: Event, id: number ) => {
            event.returnValue = await this.deleteProject(id);
        });

    }
    public static async getProjectData() {

        try {
            let results: any = await Database.all(`
                SELECT
                    id, name, project_external_code
                FROM tempo_projects
                `);

            return results;
        } catch (e) {
            log.error(e);
        }
    }

    public static async getProjectOrInsert(name: string) {
        let sql: string = `
                SELECT id
                FROM tempo_projects
                WHERE name = "${name}" LIMIT 1
                `;
        let project = await Database.one(sql);

        if (project === undefined) {
            project = this.newProject(name, "");
        }
        log.debug(project);
        return project
    }


    public static async getSuggestProjectData(queryText: string) {
        try {
            let results: any = await Database.all(`
                SELECT id, name
                FROM tempo_projects
                WHERE name LIKE "%${queryText}%"
                `);

            return results;
        } catch (e) {
            log.error(e);
        }
    }

    public static async newProject(name: string, code: string) {

        const sql = `
            INSERT INTO tempo_projects (name, project_external_code)
            VALUES ("${name}","${code}")
        `;

        await Database.run(sql)


        let id = await Database.one("SELECT last_insert_rowid() as id");

        if (id === undefined) {
           id = null;
        }
        return id;

    }

    public static async updateProject(id: number, name: string, code: string): Promise<boolean> {

        const sql = `
            UPDATE tempo_projects SET name="${name}", project_external_code="${code}"
            WHERE id = ${id}
        `;

        await Database.run(sql);
        return true;

    }

    public static async deleteProject(id: number): Promise<boolean> {

        const sql = `
            DELETE from tempo_projects
            WHERE id = ${id}
        `;

        await Database.run(sql);
        return true;

    }
}

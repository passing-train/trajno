<script lang="ts">
    import {Component, Vue} from 'vue-property-decorator';
    import ipcRenderer from '@/components/ipc_renderer';
    import ContentPage from "@/components/contentPage.vue";
    import Updatable from "@/components/updatable";

    declare interface ProjectData {
        id: number,
        name: string,
        project_external_code: string
    }

    @Component({
        components: {
        }
    })

    export default class Projects extends Vue implements Updatable {

        projectData: ProjectData[] = this.getProjectData();
        selectedProjectId: number = -1;
        editName: string = "";
        editCode: string = "";
        selectedProject: ProjectData | null = null;
        editProject: ProjectData | null = null;

        mounted() {
            this.projectData = this.getProjectData();
        }

        getProjectData(): ProjectData[] {
            return ipcRenderer.sendSync('get-project-data');
        }

        getSelectedProjectName(): string {
            if(this.selectedProject){
                return this.selectedProject.name;
            }
            return "";
        }

        clickRow(project: ProjectData) {
            this.selectedProject = project;
            this.selectedProjectId = project.id;

            this.editName = this.selectedProject.name;
            this.editCode = this.selectedProject.project_external_code;
        }

        protected async save(): Promise<void> {
            await ipcRenderer.send('update-project', this.selectedProjectId, this.editName, this.editCode);
            this.projectData = this.getProjectData();
        }

        protected async deleteRecord(): Promise<void> {
            await ipcRenderer.send('delete-project', this.selectedProjectId);
            this.projectData = this.getProjectData();
        }

        protected async newRecord(): Promise<void> {
            await ipcRenderer.send('new-project', "no name", "no code");
            this.projectData = this.getProjectData();
        }
        protected async recordSave(): Promise<void> {
        }

        update(): void {
        }
    }
</script>

<template>
    <div id="projects">
        <div class="section">
            <div class="inputFlexRow">
                <h3 class="inputTitle">Projects</h3>
            </div>
            <div class="inputOption">
                <button @click="newRecord()">new</button>
            </div>

        </div>

        <div class="section" id="tableSection">

            <div id="theTableSection">
                <table class="table is-narrow" id="theTable">
                    <thead>
                        <tr>
                            <th>Project</th>
                            <th>Code</th>
                        </tr>
                    </thead>
                    <tbody v-for="project in this.projectData" :key="project.id" @click="clickRow(project)">
                        <tr class='hover' :class="{selected: selectedProjectId === project.id}">
                            <td>{{project.name}}</td>
                            <td>{{project.project_external_code}}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="section" id="editSection">
            <div id="col1">
                <div>
                    <label>
                        Project
                        <input type="text" v-model="editName">
                    </label>
                </div>

                <div>
                    <label>
                        Code
                        <input type="text" v-model="editCode">
                    </label>
                </div>

                <div class="inputOption">
                    <button @click="save()">Save</button>
                    <button @click="deleteRecord()">Delete</button>
                </div>

            </div>

        </div>
    </div>
</template>


<style scoped>

#projects {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 90px 2fr 1fr;
    height: 100%;
    margin-left: 10px;
}

#tableSection {
    grid-column: 1;
    grid-row: 2 / 3;
    overflow: auto;
    display: grid;
    grid-template-rows: 1fr;
}

#editSection {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-column: 1;
    grid-row: 3 / 3;
}

#col1 {
    text-align: right;
    grid-column: 1 / 1;
}

#col1 div{
    margin-bottom: 10px;
}

tr.hover:hover {
    background-color: #EAEAEA;
}

.selected {
    background-color: #F1F1F1;
}
</style>


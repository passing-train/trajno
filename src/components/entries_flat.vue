
<script lang="ts">
import {Component, Vue} from 'vue-property-decorator';
import ipcRenderer from '@/components/ipc_renderer';
import ContentPage from "@/components/contentPage.vue";
import Updatable from "@/components/updatable";
import {formatSeconds, getDateTimeStringFromStamp} from "@/util/time_util";

const VueAutosuggest = require('vue-autosuggest');

declare interface EntryFlatData {
    id: number,
    entry_text: string,
    customer_id: number,
    customer_name: string,
    project_id: number,
    project_name: string,
    created_at: number,
    time_delta: number,
    last_in_block: number
}

declare interface SuggestCustomerData {
    id: number,
    name: string
}
declare interface CustomerID {
    id: number
}

declare interface SuggestProjectData {
    id: number,
    name: string
}
declare interface ProjectID {
    id: number
}

@Component({
    components: VueAutosuggest
})

export default class EntriesFlat extends Vue implements Updatable {

    entryFlatData: EntryFlatData[] = this.getEntryFlatData();
    selectedEntryId: number = 0;
    editEntryText: string = "";
    lastInBlock: number = "";
    selected: string = "";
    selectedEntry: EntryFlatData | null = null;

    //customerText: string = '';
    queryCustomer: string = "";
    queryProject: string = "";

    getSuggestCustomerData(queryText: string): SuggestCustomerData[] {
        return ipcRenderer.sendSync('get-suggest-customer-data', queryText);
    }

    getCustomerOrInsert(name: string): CustomerID {
        return ipcRenderer.sendSync('get-customer-or-insert', name);
    }

    getSuggestProjectData(queryText: string): SuggestProjectData[] {
        return ipcRenderer.sendSync('get-suggest-project-data', queryText);
    }

    getProjectOrInsert(name: string): ProjectID {
        return ipcRenderer.sendSync('get-project-or-insert', name);
    }

    mounted() {
        this.entryFlatData = this.getEntryFlatData();
        //document.addEventListener("keyup", (event) => this.nextItem(event));
    }
    update(): void {
    }

    getEntryFlatData(): EntryFlatData[] {
        return ipcRenderer.sendSync('get-entry-flat-data');
    }

    getSelectedEntryText(): string {
        if(this.selectedEntry){
            return this.selectedEntry.entry_text;
        }
        return "";
    }

    clickEntry(entry: EntryFlatData) {

        this.selectedEntry = entry;
        this.selectedEntryId = entry.id;
        this.editEntryText = this.selectedEntry.entry_text;
        this.lastInBlock = this.selectedEntry.last_in_block;
        this.queryCustomer = (this.selectedEntry.customer_name?this.selectedEntry.customer_name:"")
        this.queryProject = (this.selectedEntry.project_name?this.selectedEntry.project_name:"")

    }

    protected async saveRecord(): Promise<void> {
        let customerId: CustomerID;
        let cust_id: number = -1;

        let theCustomerText = (this.$refs.customerText as Vue);
        let theCustomerInput = theCustomerText.$el.querySelector("input")
        if(theCustomerInput){
            customerId = await this.getCustomerOrInsert(theCustomerInput.value);
            cust_id = customerId.id;
        }

        let projectId: ProjectID;
        let prod_id: number = -1;

        let theProjectText = (this.$refs.projectText as Vue);
        let theProjectInput = theProjectText.$el.querySelector("input")
        if(theProjectInput){
            projectId = await this.getProjectOrInsert(theProjectInput.value);
            prod_id = projectId.id;
        }


        await ipcRenderer.send('update-entry-flat', this.selectedEntryId, this.editEntryText, cust_id, prod_id, this.lastInBlock);
        this.entryFlatData = this.getEntryFlatData();
    }

    protected async deleteRecord(): Promise<void> {
        await ipcRenderer.send('delete-entry-flat', this.selectedEntryId);
        this.entryFlatData = this.getEntryFlatData();
    }

    onSelected(item:any){
        this.selected = item.item;
    }

    getSuggestionValue(suggestion:any) {
        return suggestion.item.name;
    }

    timeAsString(time: number): string {
//        return formatSeconds(time);
        return getDateTimeStringFromStamp(time);
    }

    get filteredCustomerOptions() {
        let sdata = this.getSuggestCustomerData(this.queryCustomer.toLowerCase());

        return [
            {
                data: sdata
            }
        ];
    }
    get filteredProjectOptions() {
        let sdata = this.getSuggestProjectData(this.queryProject.toLowerCase());

        return [
            {
                data: sdata
            }
        ];
    }
}
</script>

<template>
    <div id="entries">
        <div class="section">
            <div class="entryinputFlexRow">
                <h3 class="entryinputText">Entries Flat</h3>
            </div>
        </div>

        <div class="section" id="tableSection">

            <div id="entryTableSection">
                <table class="table is-narrow" id="entriesTable">
                    <thead>
                        <tr>
                            <th>Entry</th>
                            <th>Customer</th>
                            <th>Project</th>
                            <th>Created At</th>
                            <th>Time Delta</th>
                            <th>Last in Block</th>
                        </tr>
                    </thead>
                    <tbody v-for="entry in this.entryFlatData" :key="entry.id" @click="clickEntry(entry)">
                        <tr class='hover' :class="{selected: selectedEntryId === entry.id}">
                            <td>{{entry.entry_text}};</td>
                            <td>{{entry.customer_name}}</td>
                            <td>{{entry.project_name}}</td>
                            <td>{{timeAsString(entry.created_at)}}</td>
                            <td>{{entry.time_delta}}</td>
                            <td>{{entry.last_in_block}}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="section" id="editSection">
            <div id="col1">
                <div>
                    <label>
                        Entry
                        <input type="text" v-model="editEntryText">
                    </label>
                </div>
                <div>
                    <label>
                        Customer

                            <vue-autosuggest
                                v-model="queryCustomer"
                                ref="customerText"
                                :suggestions="filteredCustomerOptions"
                                @selected="onSelected"
                                :get-suggestion-value="getSuggestionValue"
                                :input-props="{id:'autosuggest__input_super', placeholder:''}">
                                <div slot-scope="{suggestion}" style="display: flex; align-items: center;">
                                    <div style="{ display: 'flex', color: 'navyblue'}">{{suggestion.item.name}}</div>
                                </div>
                            </vue-autosuggest>


                    </label>
                </div>

            </div>

            <div id="col2">

                <div>
                    <label>
                        Project
                        <vue-autosuggest
                            v-model="queryProject"
                            ref="projectText"
                            :suggestions="filteredProjectOptions"
                            @selected="onSelected"
                            :get-suggestion-value="getSuggestionValue"
                            :input-props="{id:'autosuggest__input_super', placeholder:''}">
                            <div slot-scope="{suggestion}" style="display: flex; align-items: center;">
                                <div style="{ display: 'flex', color: 'navyblue'}">{{suggestion.item.name}}</div>
                            </div>
                        </vue-autosuggest>

                    </label>
                </div>
                <div>
                    <label>
                        Last in block
                        <input type="text" size="4" v-model="lastInBlock">
                    </label>
                </div>

                <div class="entryinputOption">
                    <button @click="saveRecord()">Save</button>
                    <button @click="deleteRecord()">Delete</button>
                </div>

            </div>



        </div>

    </div>
</template>

<style scoped>
#entries {
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
tr{
    border-top: solid 1px #ccc;
}

#editSection {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-column: 1;
    grid-row: 3 / 3;
}

#col1 {
    text-align: right;
    grid-column: 1 / 2;
}

#col1 div{
    margin-bottom: 10px;
}

#col2 {
    text-align: right;
    grid-column: 2 / 2;
}

#col2 div{
    margin-bottom: 10px;
}
tr.hover:hover {
    background-color: #EAEAEA;
}

.selected {
    background-color: #F1F1F1;
}

</style>

<style>

.autosuggest-container {
    display: flex;
    justify-content: center;
}

#autosuggest {
    width: 100%;
    display: inline;
}
.autosuggest__results-item--highlighted {
    background-color: #ccc;
}

.autosuggest__results ul {
    width: 90%;
    color: rgba(30, 39, 46,1.0);
    list-style: none;
    margin: 0;
    list-style: none;
    padding-left: 0;
    margin: 0;
    border: 1px #ccc solid;
}

.autosuggest__results ul li {
    margin: 0 0 0 0;
    border-radius: 5px;
    display: flex;
    align-items: center;
}

#autosuggest__input_super {
    padding:0.4em;
    caret-color: #ddd;
    position: relative;
    display: initial;
    font-size: initial;
    height: initial;
    border: 1px solid #ccc;
    border-radius: 3px;
    width: initial;
    box-sizing: border-box;
}

</style>



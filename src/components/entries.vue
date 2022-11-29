<script lang="ts">
import {Component, Prop, Vue} from 'vue-property-decorator';
import ipcRenderer from '@/components/ipc_renderer';
import ContentPage from "@/components/contentPage.vue";
import Updatable from "@/components/updatable";
import {Calendar, DatePicker, DateRange} from "v-calendar";
import {formatMinutes} from "@/util/time_util";
import DateSelection from '@/components/fragments/date_selection.vue';

const VueAutosuggest = require('vue-autosuggest');

declare interface EntryData {
    date: string,
    entry_text: string,
    customer_id: number,
    customer_name: string,
    project_id: number,
    project_name: string,
    total_time: number
}
declare interface DailyEntryData {
    date: string,
    entry_id: number,
    entry_text: string,
    involved_entry_ids: number[],
    customer_id: number,
    customer_name: string,
    project_id: number,
    project_name: string,
    total_time: number
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

// NOTE make sure to add your component in this list. Else it will not be visible
@Component({
    components: {...VueAutosuggest, ...{DateSelection}}
})
    /*
    components: {
        VueAutosuggest,
        DateSelection
    }
    */

export default class Entries extends Vue implements Updatable {

    @Prop() range!: DateRange;

    updateRange(range: DateRange) {
        this.$emit('updateRange', range);
    }

    entryData: EntryData[] = [];
    dailyEntryData: DailyEntryData[] = [];

    selectedEntryText: string = "";
    editEntryText: string = "";

    selected: string = "";
    extraMinutes: number = 0;
    view = "daily";

    selectedEntry: EntryData | null = null;

    selectedEntryDaily: DailyEntryData | null = null;
    selectedEntryId: number = 0;

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
        this.updateEntryData();
    }

    getEntryData(): EntryData[] {
        return ipcRenderer.sendSync('get-entry-data');
    }

    updateEntryData(){
        this.entryData = this.getEntryData();
        this.dailyEntryData = this.getDailyEntryData();
    }

    getDailyEntryData(): DailyEntryData[] {
        return ipcRenderer.sendSync('get-daily-entry-data');
    }

    getSelectedEntryText(): string {
        if(this.selectedEntry){
            return this.selectedEntry.entry_text;
        }
        return "";
    }

    getDayName(dateStr: string, locale='en-US'): string {
        var date = new Date(dateStr);
        return date.toLocaleDateString(locale, { weekday: 'long' });
    }

    clickEntry(entry: EntryData) {
        this.selectedEntry = entry;

        this.selectedEntryText = entry.entry_text;
        this.selectedEntryId = 0;

        this.editEntryText = this.selectedEntry.entry_text;
        this.queryCustomer = (this.selectedEntry.customer_name ? this.selectedEntry.customer_name:"" );
        this.queryProject = (this.selectedEntry.project_name?this.selectedEntry.project_name:"")
    }

    clickEntryDaily(entry: DailyEntryData) {

        this.selectedEntryDaily = entry;

        this.selectedEntryId = entry.entry_id;
        this.selectedEntryText = "";

        this.editEntryText = this.selectedEntryDaily.entry_text;
        this.queryCustomer = (this.selectedEntryDaily.customer_name?this.selectedEntryDaily.customer_name:"");
        this.queryProject = (this.selectedEntryDaily.project_name?this.selectedEntryDaily.project_name:"")
    }

    viewDaily(){
        this.view = "daily";
    }

    viewTotals(){
        this.view = "totals";
    }

    protected formatMinutes(seconds:number):string {
        return formatMinutes(seconds);
    }

    protected async addMinutes(): Promise<void> {

        if(this.selectedEntryId !== 0){
            await ipcRenderer.send('add-remove-minutes-to-entry-by-id', this.selectedEntryId, this.extraMinutes);
            this.extraMinutes = 0;
            this.updateEntryData();
        }
        else{
            await ipcRenderer.send('add-remove-minutes-to-entry', this.selectedEntryText, this.extraMinutes);
            this.extraMinutes = 0;
            this.updateEntryData();
        }
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

        if(this.view === "daily" && this.selectedEntryDaily)
        {
            let involvedIds = this.selectedEntryDaily.involved_entry_ids;
            await ipcRenderer.send('update-daily-entry', this.selectedEntryText, this.editEntryText, cust_id, prod_id, involvedIds );
        }
        else{
            await ipcRenderer.send('update-entry', this.selectedEntryText, this.editEntryText, cust_id, prod_id);
        }
        this.updateEntryData();
    }

    update(): void {
    }

    protected async deleteRecord(): Promise<void> {

        if(this.view === "daily" && this.selectedEntryDaily)
        {
            let involvedIds = this.selectedEntryDaily.involved_entry_ids;
            await ipcRenderer.send('delete-daily-entry', involvedIds);
        }
        else{
            await ipcRenderer.send('delete-entry', this.selectedEntryText);
        }
        this.updateEntryData();
    }


    protected async archiveRecord(): Promise<void> {

        if(this.view === "daily" && this.selectedEntryDaily)
        {
            let involvedIds = this.selectedEntryDaily.involved_entry_ids;
            await ipcRenderer.send('archive-daily-entry', involvedIds);
        }
        else{
            alert("not yet implemented")
        }
        this.updateEntryData();
    }


    onSelected(item:any){
        this.selected = item.item;
    }

    getSuggestionValue(suggestion:any) {
        return suggestion.item.name;
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
            <button class="is-pulled-right button" @click="viewTotals">Totals</button>
            <button class="is-pulled-right button" @click="viewDaily">Daily</button>
            <div class="entryinputFlexRow">
                <h3 class="entryinputText">Activity Entries</h3>
            </div>

            <!-- TODO
            <div id="dateSelectionSection" v-if="view==='daily'" class="topSection is-vertical-center">
            <date-selection :range="range" @updateRange="updateRange" />
            </div>
            -->

         </div>
        <div class="section" id="tableSection">

            <div id="entryTableSection" v-if="view==='totals'">
                <table class="table is-narrow" id="entriesTable">
                    <thead>
                        <tr>
                            <th>Entry</th>
                            <th>Customer</th>
                            <th>Project</th>
                            <th>Total Time</th>
                        </tr>
                    </thead>

                    <tbody v-for="entry in this.entryData" :key="entry.entry_id" @click="clickEntry(entry)">
                        <tr class='hover' :class="{selected: selectedEntryText === entry.entry_text}">
                            <td>{{entry.entry_text}}</td>
                            <td>{{entry.customer_name}}</td>
                            <td>{{entry.project_name}}</td>
                            <td>{{formatMinutes(entry.total_time)}}</td>
                        </tr>
                    </tbody>


                </table>
            </div>


            <!---- DAILY ---->

            <div id="entryTableSection" v-if="view==='daily'">
                <table class="table is-narrow" id="entriesTable">
                    <thead>
                        <tr>
                            <th>Entry</th>
                            <th>Customer</th>
                            <th>Project</th>
                            <th>Total Time</th>
                        </tr>
                    </thead>

                    <tbody v-for="day in this.dailyEntryData" :key="day.date">
                        <tr style="background-color: #559cbf; color: white; ">
                            <td>{{getDayName(day.date)}} {{day.date}}</td>
                            <td></td>
                            <td></td>
                            <td></td>
                        </tr>

                        <tr v-for="entry in day.activities" :key="entry.entry_id" @click="clickEntryDaily(entry)" class='hover' :class="{selected: selectedEntryId === entry.entry_id}">
                            <td>{{entry.entry_text}}</td>
                            <td>{{entry.customer_name}}</td>
                            <td>{{entry.project_name}}</td>
                            <td>{{formatMinutes(entry.total_time)}}</td>
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
                        <input v-on:keyup.enter="saveRecord" type="text" v-model="editEntryText">
                    </label>
                </div>
                <div>
                    <label>
                        Customer

                            <vue-autosuggest
                                v-model="queryCustomer"
                                ref="customerText"
                                :suggestions="filteredCustomerOptions"
                                v-on:keyup.enter="saveRecord"
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
                            v-on:keyup.enter="saveRecord"
                            :get-suggestion-value="getSuggestionValue"
                            :input-props="{id:'autosuggest__input_super', placeholder:''}">
                            <div slot-scope="{suggestion}" style="display: flex; align-items: center;">
                                <div style="{ display: 'flex', color: 'navyblue'}">{{suggestion.item.name}}</div>
                            </div>
                        </vue-autosuggest>

                    </label>
                </div>

                <div class="entryinputOption">
                    <button @click="saveRecord()">Save</button>
                    <button @click="deleteRecord()">Delete</button>
                    <button @click="archiveRecord()">Archive</button>
                </div>
                <div>
                    <label>
                        <button @click="addMinutes()">Add or remove minutes</button><br>
                        <input type="text" size="4" v-model="extraMinutes">
                    </label>
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

#dateSelectionSection {
    grid-column: 1 / 3;
    grid-row: 1 / 2;
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

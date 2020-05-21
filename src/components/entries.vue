
<script lang="ts">
import {Component, Vue} from 'vue-property-decorator';
import ipcRenderer from '@/components/ipc_renderer';
import ContentPage from "@/components/contentPage.vue";
import Updatable from "@/components/updatable";

const VueAutosuggest = require('vue-autosuggest');

declare interface EntryData {
    title: string,
        customer_id: number,
        project_id: number,
        total_time: number,
        today_time: number
}

declare interface SuggestCustomerData {
    id: number,
    name: string
}
declare interface CustomerID {
    id: number
}

@Component({
    components: VueAutosuggest
})

export default class Entries extends Vue implements Updatable {

    entryData: EntryData[] = this.getEntryData();
    selectedEntryTitle: string = "";
    editEntryTitle: string = "";
    editEntryCustomerId: number = -1;
    selectedEntry: EntryData | null = null;

    customerText: string = '';
    queryCustomer: string = "";
    selected: string = "";

    getSuggestCustomerData(queryText: string): SuggestCustomerData[] {
        return ipcRenderer.sendSync('get-suggest-customer-data', queryText);
    }

    getCustomerOrInsert(name: string): CustomerID {
        return ipcRenderer.sendSync('get-customer-or-insert', name);
    }

    mounted() {
        this.entryData = this.getEntryData();
        //document.addEventListener("keyup", (event) => this.nextItem(event));
    }

    getEntryData(): EntryData[] {
        return ipcRenderer.sendSync('get-entry-data');
    }

    getSelectedEntryTitle(): string {
        if(this.selectedEntry){
            return this.selectedEntry.title;
        }
        return "";
    }

    clickEntry(entry: EntryData) {
        this.selectedEntry = entry;
        this.selectedEntryTitle = entry.title;
        this.editEntryTitle = this.selectedEntry.title;
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

        await ipcRenderer.send('update-entry', this.selectedEntryTitle, this.editEntryTitle, cust_id, 0);
        this.entryData = this.getEntryData();
    }

    protected async deleteRecord(): Promise<void> {
        await ipcRenderer.send('delete-entry', this.selectedEntryTitle);
        this.entryData = this.getEntryData();
    }

    storeCustomer(customer: SuggestCustomerData ): void {
    }


    update(): void {
    }

    onSelected(item:any){
        this.selected = item.item;
    }

    clickHandler(item:any){

    }

    onInputChange(item:any){
    }

    getSuggestionValue(suggestion:any) {
        return suggestion.item.name;
    }

    focusMe(e:any) {
    }

    get filteredOptions() {
        let sdata = this.getSuggestCustomerData(this.queryCustomer.toLowerCase());

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
                <h3 class="entryinputTitle">Entries</h3>
                <div class="inputOption">
                    <button @click="newRecord()">new</button>
                </div>
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
                            <th>Total Time</th>
                            <th>Time Today</th>
                        </tr>
                    </thead>
                    <tbody v-for="entry in this.entryData" :key="entry.title" @click="clickEntry(entry)">
                        <tr class='hover' :class="{selected: selectedEntryTitle === entry.title}">
                            <td>{{entry.title}}</td>
                            <td>{{entry.customer_id}}</td>
                            <td>{{entry.project_id}}</td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
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
                        <input type="text" v-model="editEntryTitle">
                    </label>
                </div>
                <div>
                    <label>
                        Customer

                            <vue-autosuggest
                                v-model="queryCustomer"
                                ref="customerText"
                                :suggestions="filteredOptions"
                                v-on:keyup.enter="storeCustomer"
                                @focus="focusMe"
                                @click="clickHandler"
                                @input="onInputChange"
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
                        extra time
                        <input type="text" size="4">
                    </label>
                </div>

                <div>
                    <label>
                        Project
                        <input type="text">
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



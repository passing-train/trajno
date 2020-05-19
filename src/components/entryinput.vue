<template>
    <div id="entryinput">
        <div class="section">
            <div class="entryinputFlexRow">
                <h3 class="entryinputTitle">Entry Input</h3>
                <hr id="entryinputHr">
                <div class="entryinputFlexColumn" id="main1">
                    <div class="entryinputOption">
                        <label>
                            Whats going on?

                            <div class="autosuggest-container">
                                <vue-autosuggest
                                    v-model="query"
                                    ref="entryText"
                                    :suggestions="filteredOptions"
                                    v-on:keyup.enter="save"
                                    @focus="focusMe"
                                    @click="clickHandler"
                                    @input="onInputChange"
                                    @selected="onSelected"
                                    :get-suggestion-value="getSuggestionValue"
                                    :input-props="{id:'autosuggest__input', placeholder:'Do you feel lucky, punk?'}">

                                    <div slot-scope="{suggestion}" style="display: flex; align-items: center;">
                                        <div style="{ display: 'flex', color: 'navyblue'}">{{suggestion.item.name}}</div>
                                    </div>
                                </vue-autosuggest>
                            </div>

                        </label>
                    </div>

                    <div class="entryinputOption">
                        <button @click="save()">Save</button>
                    </div>

                </div>
                <div class="entryinputFlexColumn" id="main1">
                </div>
                <span class="entryinputVersion">v{{this.getVersion()}}</span>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import {Component, Vue} from 'vue-property-decorator';
import ipcRenderer from '@/components/ipc_renderer';
import Updatable from "@/components/updatable";
import {shell} from 'electron';

//import { VueAutosuggest } from 'vue-autosuggest';
const VueAutosuggest = require('vue-autosuggest');

declare interface SuggestData {
    id: number,
    name: string
}

@Component({
    components: VueAutosuggest
})

export default class Entryinput extends Vue implements Updatable {

    entryText: string = 'start text';
    query: string = "start text";
    selected: string = "";
    suggestions = [
        {
            data: [
                { id: 1, name: "Frodo"},
                { id: 2, name: "Samwise"},
                { id: 3, name: "Gandalf"},
                { id: 4, name: "Aragorn"}
            ]
        }
    ];

    getSuggestDatas(queryText: string): SuggestData[] {
        return ipcRenderer.sendSync('get-suggest-data', queryText);
    }

    mounted() {
        ipcRenderer.on('wazzup', this.focusWazzup.bind(this))
        this.focusWazzup();
    }

    focusWazzup(){
        let theEntryText = (this.$refs.entryText as Vue);
        let theInput = theEntryText.$el.querySelector("input")
        if(theInput){
            theInput.focus();
            theInput.setSelectionRange(0, theInput.value.length);
        }
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
        let sdata = this.getSuggestDatas(this.query.toLowerCase());
        //console.log(sdata) // FocusEvent

        //let retdata =  [{ id: 1, name: "Hallo"}];

        return [
            {
                data: sdata
            }
        ];

        /*
        return [
            {
                data: this.suggestions[0].data.filter(option => {
                    return option.name.toLowerCase().indexOf(this.query.toLowerCase()) > -1;
                })
            }
        ];
        */
    }

    update(): void {
    }

    protected isDevelopment(): boolean {
        return ipcRenderer.sendSync('is-development');
    }

    protected getVersion(): string {
        return ipcRenderer.sendSync('get-version');
    }

    protected getLastInput(): string {
        return ipcRenderer.sendSync('get-last-entryinput');
    }

    protected save(): void {
        let theEntryText = (this.$refs.entryText as Vue);
        let theInput = theEntryText.$el.querySelector("input")
        if(theInput){
            ipcRenderer.send('set-entryinput', theInput.value);
            ipcRenderer.send('hide-main');
        }
    }

}
</script>

<style>

.autosuggest-container {
    display: flex;
    justify-content: center;
}

#autosuggest {
    width: 100%; display: block;
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

#autosuggest__input {
    padding:0.4em;
    caret-color: #ddd;
    position: relative;
    display: block;
    font-size: 130%;
    height: 60px;
    border: 1px solid #616161;
    border-radius: 3px;
    width: 100%;
    box-sizing: border-box;
}

</style>

<style scoped>

#entryinput {
    display: grid;
    height: 100%;
    margin-left: 10px;
    padding-top: 10px;
}

.entryinputFlexColumn {
    display: flex;
    flex-direction: column;
    text-align: left;
    height: 100%;
    margin: 15px;
}

.entryinputFlexRow {
    display: grid;
    grid-template-columns: 100%;
    grid-template-rows: 10% 86% 4%;
    height: 100%;
    grid-template-areas:
    "header header"
    "main1 main2"
    "footer footer";
}

#main1 {
    grid-area: main1;
    flex-grow: 1;
}

#entryinputHr{
    width: 80%;
    grid-area: header;
    text-align: center;
    align-items: center;
    margin: 2rem 0 0 10% !important;
    height: 1px;
    background: -webkit-gradient(radial, 50% 50%, 0, 50% 50%, 350, from(gray), to(#fff));
}

.entryinputTitle {
    text-align: center;
    grid-area: header;
}

.entryinputLink {
    text-align: left;
    grid-area: footer;
}

.entryinputOption {
    justify-content: flex-start;
    margin-bottom: 10px;
    font-size: 150%;
}
.entryinputOption input
{
    font-size: 150%;
    padding:0.2em;
}


.entryinputVersion {
    text-align: right;
    color: #476582;
    grid-area: footer;

}


</style>

<template>
    <div id="entries">
        <div class="section">
            <div class="entryinputFlexRow">
                <h3 class="entryinputTitle">Entries</h3>
                <hr id="entryinputHr">
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
                    <tbody v-for="entry in this.entryData" :key="entry.title">
                    <tr class='hover'>
                        <td>{{entry.title}}</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>

    </div>
</template>

<script lang="ts">
    import {Component, Vue} from 'vue-property-decorator';
    import ipcRenderer from '@/components/ipc_renderer';
    import ContentPage from "@/components/contentPage.vue";
    import Updatable from "@/components/updatable";

    declare interface EntryData {
        title: string,
        customer: number,
        project: number,
        total_time: number,
        today_time: number
    }

    @Component({
        components: {
        }
    })

    export default class Entries extends Vue implements Updatable {

        entryData: EntryData[] = this.getEntryData();

        mounted() {
            this.entryData = this.getEntryData();
        }

        getEntryData(): EntryData[] {
            return ipcRenderer.sendSync('get-entry-data');
        }


        update(): void {
        }
    }
</script>

<style scoped>
    #entries {
        display: grid;
        grid-template-columns: 1fr;
        height: 100%;
        margin-left: 10px;
    }
    #tableSection {
        overflow: auto;
        display: grid;
    }

#entryTableSection {
    overflow: auto;
}

</style>

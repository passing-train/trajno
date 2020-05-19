<template>
    <div id="customers">
        <div class="section">
            <div class="entryinputFlexRow">
                <h3 class="entryinputTitle">Customers</h3>
                <hr id="entryinputHr">
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import {Component, Vue} from 'vue-property-decorator';
    import ipcRenderer from '@/components/ipc_renderer';
    import ContentPage from "@/components/contentPage.vue";
    import Updatable from "@/components/updatable";

    @Component({
        components: {
        }
    })

    export default class Customers extends Vue implements Updatable {
        update(): void {
        }
    }
</script>

<style scoped>
</style>

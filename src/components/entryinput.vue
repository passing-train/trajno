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
                            <input type="string" v-on:keyup.enter="save" v-model="entryText">
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

    @Component
    export default class Entryinput extends Vue implements Updatable {

        public entryText: string = '';

        autoStartup: boolean = this.hasAutoStart();

        protected toggleAutostart() {
            this.autoStartup = ipcRenderer.sendSync("autostart-toggle", !this.autoStartup);
        }

        protected changePollTime(event: any) {
            this.setSetting('heartbeatPollTime', event.target.value);
        }

        protected changeIdleTime(event: any) {
            this.setSetting('heartbeatIdleTime', event.target.value);
        }

        private hasAutoStart(): boolean {
            return ipcRenderer.sendSync("autostart-isenabled");
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

        protected getSetting(key: string): string {
            return ipcRenderer.sendSync('get-setting', key);
        }

        protected save(): void {
            ipcRenderer.send('set-entryinput', this.entryText);
        }

        protected setSetting(key: string, value: string) {
            return ipcRenderer.sendSync('set-setting', key, value);
        }

        public openGitHub() {
            shell.openExternal("https://github.com/kmteras/timenaut/issues")
        }
    }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->

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
    }

    .entryinputVersion {
        text-align: right;
        color: #476582;
        grid-area: footer;

    }
</style>

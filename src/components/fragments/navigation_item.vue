<template>
    <div class="navigationItem">
        <i v-bind:class="[isActive() ? 'active' : '', 'material-icons']" v-on:click="pressed">{{icon}}</i>
    </div>
</template>

<script lang="ts">
    import {Component, Prop, Vue} from 'vue-property-decorator';

    @Component
    export default class NavigationItem extends Vue {

        @Prop() private icon!: string;
        @Prop() private iconAlt!: string;
        @Prop() private page!: object;
        @Prop() private activePage!: object;
        @Prop() switchPage!: any;

        pressed() {
            this.switchPage(this.page)
        }

        isActive(){
          if(this.page==this.activePage){
            return true;
          }
          else{
            return false;
          }
        }
    }
</script>

<style scoped>
    i {
        font-size: 40px;
        margin-top: -20px;
        margin-left: -20px;
        position: absolute;
        top: 50%;
        left: 50%;
        color: #bbb;
    }

    i:hover {
        color: black;
    }

    i:active {
        color: grey;
    }

    i.active {
        color: white;
    }

    .navigationItem {
        position: relative;
        resize: both;
        min-height: 60px;
        place-items: center center;
        user-select: none;
    }
</style>

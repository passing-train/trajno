<template>
    <div class="navigation">
        <div v-for="item in items" v-bind:key="item.key">
            <navigation-item :icon=item.icon
                             :activePage=page
                             :iconAlt=item.iconAlt
                             :switchPage="switchPage"
                             :page="item.page"/>
        </div>
    </div>
</template>

<script lang="ts">
    import {Component, Prop, Vue} from 'vue-property-decorator';
    import NavigationLogo from "@/components/fragments/navigation_logo.vue";
    import NavigationItem from "@/components/fragments/navigation_item.vue";

    @Component({
        components: {NavigationItem, NavigationLogo}
    })
    export default class Navigation extends Vue {
        @Prop() private items!: object;
        @Prop() page!: any;
        @Prop() switchPage!: any;
    }

</script>

<style scoped>
    .navigation {
        padding-top: 10px;
        background-color: #509bc1;
        display: flex;
        flex-direction: column;
    }
</style>

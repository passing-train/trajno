<script lang="ts">
    import {Component, Vue} from 'vue-property-decorator';
    import ipcRenderer from '@/components/ipc_renderer';
    import ContentPage from "@/components/contentPage.vue";
    import Updatable from "@/components/updatable";

    declare interface CustomerData {
        id: number,
        name: string,
        customer_external_code: string
    }

    @Component({
        components: {
        }
    })

    export default class Customers extends Vue implements Updatable {

        customerData: CustomerData[] = this.getCustomerData();
        selectedCustomerId: number = -1;
        editName: string = "";
        editCode: string = "";
        selectedCustomer: CustomerData | null = null;
        editCustomer: CustomerData | null = null;

        mounted() {
            this.customerData = this.getCustomerData();
        }

        getCustomerData(): CustomerData[] {
            return ipcRenderer.sendSync('get-customer-data');
        }

        getSelectedCustomerName(): string {
            if(this.selectedCustomer){
                return this.selectedCustomer.name;
            }
            return "";
        }

        clickRow(customer: CustomerData) {
            this.selectedCustomer = customer;
            this.selectedCustomerId = customer.id;

            this.editName = this.selectedCustomer.name;
            this.editCode = this.selectedCustomer.customer_external_code;
        }

        protected async save(): Promise<void> {
            await ipcRenderer.send('update-customer', this.selectedCustomerId, this.editName, this.editCode);
            this.customerData = this.getCustomerData();
        }

        protected async deleteRecord(): Promise<void> {
            await ipcRenderer.send('delete-customer', this.selectedCustomerId);
            this.customerData = this.getCustomerData();
        }

        protected async newRecord(): Promise<void> {
            await ipcRenderer.send('new-customer', "no name", "no code");
            this.customerData = this.getCustomerData();
        }
        protected async recordSave(): Promise<void> {
        }

        update(): void {
        }
    }
</script>

<template>
    <div id="customers">
        <div class="section">
            <div class="inputFlexRow">
                <h3 class="inputTitle">Customers</h3>
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
                            <th>Customer</th>
                            <th>Code</th>
                        </tr>
                    </thead>
                    <tbody v-for="customer in this.customerData" :key="customer.id" @click="clickRow(customer)">
                        <tr class='hover' :class="{selected: selectedCustomerId === customer.id}">
                            <td>{{customer.name}}</td>
                            <td>{{customer.customer_external_code}}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="section" id="editSection">
            <div id="col1">
                <div>
                    <label>
                        Customer
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

#customers {
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

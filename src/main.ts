import './assets/main.css';

import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import { createApp } from 'vue';
import App from './App.vue';

import 'primeicons/primeicons.css';
import ConfirmationService from 'primevue/confirmationservice';
import 'primevue/resources/themes/lara-dark-blue/theme.css';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';

const app = createApp(App);

app.use(PrimeVue);
app.use(ToastService);
app.use(ConfirmationService);
app.use(createPinia());

app.directive('tooltip', Tooltip);

app.mount('#app');

import './assets/main.css'

import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import { createPinia } from 'pinia'
import App from './App.vue'

import 'primevue/resources/themes/lara-dark-blue/theme.css'
import 'primeicons/primeicons.css'
import Tooltip from 'primevue/tooltip'
import ToastService from 'primevue/toastservice';

const app = createApp(App)

app.use(PrimeVue)
app.use(ToastService);
app.use(createPinia())

app.directive('tooltip', Tooltip);

app.mount('#app')

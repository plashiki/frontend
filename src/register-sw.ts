import { register } from 'register-service-worker'
import { firebaseMessaging } from '@/plugins/firebase'

register(`${process.env.BASE_URL}sw.js`, {
    registered (registration) {
        firebaseMessaging?.useServiceWorker(registration)
    }
})


import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';


const firebaseConfig = {
  apiKey: "AIzaSyBM0vaQ-xC4XLsXr8_mfuNXH7BdbxiWQ-I",
  authDomain: "rescuebite-ad05a.firebaseapp.com",
  projectId: "rescuebite-ad05a",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
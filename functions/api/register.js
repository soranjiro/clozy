import { reject } from '../_lib.js';
export const onRequest = () => reject('Firebase Authentication を使用してください', 410);

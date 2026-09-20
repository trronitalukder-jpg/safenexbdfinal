cd "e:\All project\safnexbd\backend"
npm run start:dev

 ভবিষ্যতে Google Play Store এ পাবলিশ করার নিয়ম (EAS Build):
যখন আপনি টেস্ট করে সন্তুষ্ট হবেন এবং প্লে-স্টোরে রিলিজ করতে চাইবেন, তখন মাত্র ২টি কমান্ডে প্রোডাকশন রেডি .aab বা ইনস্টলেবল .apk তৈরি করে নেওয়া যাবে:

bash


npm install -g eas-cli
eas login
eas build -p android --profile production
এটি স্বয়ংক্রিয়ভাবে Google Play Store এ জমা দেওয়ার জন্য ফাইল তৈরি করে দেবে।

 npx expo start
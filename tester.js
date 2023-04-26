const phoneNumber = "491234563389";
const phoneRegex = /^\+49\d{10}$/;

if (phoneRegex.test(phoneNumber)) {
  console.log("Valid phone number!");
} else {
  console.log("Invalid phone number.");
}

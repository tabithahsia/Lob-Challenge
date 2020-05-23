'use strict';

//API KEYS
const keys = require('./keys.js');

//COMMAND LINE INTERFACE
var inquirer = require('inquirer');

//LOB
var Lob = require('lob')(keys.keys.LOB_API_KEY);

var axios = require('axios');
var fs = require('fs');
var file = fs.readFileSync(__dirname + '/letter.html').toString();

var myInfo, myAddress, legislatorInfo;

var questions = [
  {
    type: 'input',
    name: 'fullName',
    message: 'What is your full name?',
  },
  {
    type: 'input',
    name: 'addressLine1',
    message: 'What is the first line of your address?'
  },
  {
    type: 'input',
    name: 'addressLine2',
    message: 'What is the second line of your address? (or press Enter to skip)',
  },
  {
    type: 'input',
    name: 'city',
    message: 'What is your city?'
  },
  {
    type: 'input',
    name: 'state',
    message: 'What is your state?'
  },
  {
    type: 'input',
    name: 'zipcode',
    message: 'What is your zipcode?',
    validate: function(value) {
      var pass = value.match(
        /^\d{5}$|^\d{5}-\d{4}$/
      );
      if(pass) {
        return true;
      }
      return 'Please enter a valid zipcode';
    }
  },
  {
    type: 'input',
    name: 'messageToSend',
    message: 'What would you like to say?'
  }
];

inquirer.prompt(questions).then(answers => {
  myInfo = answers;
  myAddress = answers.addressLine1 + ' ' + answers.addressLine2 + ', ' + answers.city + ', ' + answers.state + ' ' + answers.zipcode;
})
.then(() => {
  axios.get('https://www.googleapis.com/civicinfo/v2/representatives?key=' + keys.keys.GOOGLE_API_KEY + '&address=' + myAddress)
   .then(function(response){
     legislatorInfo = response.data.officials[2];
   })
   .catch(error => {
    console.log('The address you entered is not valid');
   })
   .then(() => {
     Lob.addresses.create({
       name: legislatorInfo.name,
       address_line1: legislatorInfo.address[0].line1,
       address_city: legislatorInfo.address[0].city,
       address_state: legislatorInfo.address[0].state,
       address_zip: legislatorInfo.address[0].zip,
       address_country: 'US'
     })
     .then(address => {
       return Lob.letters.create({
         description: 'Letter to legislator',
         to: address.id,
         from: {
           name: myInfo.fullName,
           address_line1: myInfo.addressLine1,
           address_line2: myInfo.addressLine2,
           address_city: myInfo.city,
           address_state: myInfo.state,
           address_zip: myInfo.zipcode,
           address_country: 'US',
         },
         file: file,
         merge_variables: {
           legislatorName: legislatorInfo.name,
           myName: myInfo.fullName,
           message: myInfo.messageToSend,
           date: address.date_created.slice(0, 10)
         },
         color: false
       });
     })
     .then(letter => {
       console.log('here is the URL to your letter:', letter.url);
     })
     .catch(err => {
       console.log(err);
     });
   });
})
.catch(err => {
  console.log(err);
})

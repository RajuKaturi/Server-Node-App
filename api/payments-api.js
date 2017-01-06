'use strict'

const Ach = require('../models/ach');
const base64 = require('base-64');
const config = require('../access/config');
const CreditCard = require('../models/credit-card');
const encodedKey = base64.encode(config.recurly.API_KEY);
const express = require('express');
const router = express.Router();
const request = require('request');
const mongo = require('../access/mongo');
const Donations = require('../models/donations');
let stripe = require('stripe')(config.stripe.PUBLIC_KEY);


// API for  ACH payment
router.post('/ach', postAch);

// APi for  credit card payment
router.post('/creditcard', postCreditCard);

module.exports = router;


function postAch(req, res) {

  let customerId;
  let stripeStatus;
  let defaultSource;
  let defaultSourceForACH;
  let paymentType = 'Bank';
  mongo
    .db
    .collection('ifg_donations')
    .find({'emailId': req.body.email}).toArray()
    .then((data) => {
      if (data == '') {
        stripeStatus = false;
      } else {
        stripeStatus = true;
        customerId = data[0].customerId;
        defaultSource = data[0].defaultSourceForACH;
      }
        function bankAccount(id){
          stripe.subscriptions.create({
              customer:id,
              plan: req.body.data.id,
              metadata: {
                userName: req.body.data.bank_account.name,
                Email: req.body.email,
                Address1: req.body.address1,
                Address2: req.body.address2,
                City: req.body.city,
                State: req.body.state,
                Zip: req.body.zip,
                Country: req.body.country,
                phoneNumber: req.body.phoneNumber
              },
            }, function (err, subscription) {
              if (err) return res.send(444);
              new Donations(subscription, paymentType).save().then(() => {
                return res.send(200);
              }).catch(() => {
                return res.send(444);
              })
            }
          );


        }



      if (req.body.status == true) {
        let plan = stripe.plans.create({
          name: req.body.email,
          id: req.body.data.id,
          interval: 'day',
          currency: 'usd',
          amount: req.body.amount * 100,
        }, function (err, plan) {
          if (err) return res.send(444);
          if (stripeStatus === true) {
            bankAccount(customerId);
          } else {
            stripe.customers.create({
              source: req.body.data.id,
              email: req.body.email,
            }, function (err, customer) {
              if (err) {
                return res.send(444);
              } else {

                stripe.customers.verifySource(
                  customer.id,
                  customer.default_source,
                  {
                    amounts: [32, 45]
                  },
                  function (err, bankAccount) {
                    if (err) return res.send(444);
                    stripe.subscriptions.create({
                        customer: bankAccount.customer,
                        plan: req.body.data.id,
                        metadata: {
                          userName: req.body.data.bank_account.name,
                          Email: req.body.email,
                          Address1: req.body.address1,
                          Address2: req.body.address2,
                          City: req.body.city,
                          State: req.body.state,
                          Zip: req.body.zip,
                          Country: req.body.country,
                          phoneNumber: req.body.phoneNumber
                        },
                      }, function (err, subscription) {
                        if (err) return res.send(444);
                      new Donations(subscription, paymentType).save().then(() => {
                          return res.send(200);
                        }).catch(() => {
                          return res.send(444);
                        })
                      }
                    );

                  });
              }
            });

          }

        });

      } else {
        if (stripeStatus == true) {

          stripe.charges.create({
              amount: req.body.amount * 100,
              currency: 'usd',
              customer: customerId,
              metadata: {
                userName: req.body.data.bank_account.name,
                Email: req.body.email,
                Address1: req.body.address1,
                Address2: req.body.address2,
                City: req.body.city,
                State: req.body.state,
                Zip: req.body.zip,
                Country: req.body.country,
                phoneNumber: req.body.phoneNumber
              },
            }, function (err, charge) {
              if (err) return res.send(444);
            new Donations(charge, paymentType).save().then(() => {
                return res.send(200);
              }).catch(() => {
                return res.send(444);
              })
            }
          )

        } else {

          stripe.customers.create({
            source: req.body.data.id,
            email: req.body.email,
          }, function (err, customer) {
            if (err) return res.send(444);
            stripe.customers.verifySource(
              customer.id,
              customer.default_source,
              {
                amounts: [32, 45]
              }, function (err, bankAccount) {
                if (err) return res.send(444);
                stripe.charges.create({
                    amount: req.body.amount * 100,
                    currency: 'usd',
                    customer: bankAccount.customer,
                    metadata: {
                      userName: req.body.data.bank_account.name,
                      Email: req.body.email,
                      Address1: req.body.address1,
                      Address2: req.body.address2,
                      City: req.body.city,
                      State: req.body.state,
                      Zip: req.body.zip,
                      Country: req.body.country,
                      phoneNumber: req.body.phoneNumber
                    },
                  }, function (err, charge) {
                    if (err) return res.send(444);
                  new Donations(charge, paymentType).save().then(() => {
                      return res.send(200);
                    }).catch(() => {
                        return res.send(444);
                      }
                    )
                  }
                )
              });
          })
        }
      }
    })
    .catch((err) => {
      return res.send(444);
    })
}


function postCreditCard(req, res) {
  let customerId;
  let stripeStatus;
  let FinalData;
  let paymentType = 'Card';
  mongo
    .db
    .collection('ifg_donations')
    .find({'emailId': req.body.email}).toArray()
    .then((data) => {
      FinalData = data;
      if (FinalData == '') {
        stripeStatus = false;
      } else {
        stripeStatus = true;
        customerId = FinalData[0].customerId;
      }

      function cardSingle(id) {
        stripe.charges.create({
          amount: req.body.amount * 100,
          currency: 'usd',
          customer: id,
          metadata: {
            userName: req.body.data.card.name,
            Email: req.body.email,
            Address1: req.body.data.card.address_line1,
            Address2: req.body.data.card.address_line2,
            City: req.body.data.card.address_city,
            State: req.body.data.card.address_state,
            Zip: req.body.data.card.address_zip,
            Country: req.body.data.card.address_country,
            phoneNumber: req.body.phoneNumber

          }
        }, function (err, charge) {
          if (err) return res.send(444);
          new Donations(charge, paymentType).save().then(() => {
            return res.send(200);
          }).catch(() => {
            return res.send(444);
          })


        })
      }

      function creditcardSubscription(id){

        stripe.subscriptions.create({
          customer: id,
          plan: req.body.data.id,
          metadata: {
            userName: req.body.data.card.name,
            Email: req.body.email,
            Address1: req.body.data.card.address_line1,
            Address2: req.body.data.card.address_line2,
            City: req.body.data.card.address_city,
            State: req.body.data.card.address_state,
            Zip: req.body.data.card.address_zip,
            Country: req.body.data.card.address_country,
            phoneNumber: req.body.phoneNumber
          }
        }, function (err, subscription) {
          if (err) return res.send(444);
          new Donations(subscription, paymentType).save().then(() => {
            return res.send(200);
          }).catch(() => {
            return res.send(444);
          })
        });


      }


      if (req.body.status == true) {
        let plan = stripe.plans.create({
          name: req.body.email,
          id: req.body.data.id,
          interval: 'day',
          currency: 'usd',
          amount: req.body.amount * 100,
        }, function (err, plan) {
          if (err) return res.send(444);
          if (stripeStatus == true) {
            customerId = customerId;
            creditcardSubscription(customerId);

          } else {
            stripe.customers.create({
              source: req.body.data.id,
              email: req.body.email,
            }, function (err, customer) {
              if (err) return res.send(444);
              creditcardSubscription(customer.id);

            });

          }

        });


      } else {

         if (stripeStatus == true) {
           cardSingle(customerId);

        } else {
          stripe.customers.create({
            source: req.body.data.id,
            email: req.body.email,
          }, function (err, customer) {
            if (err) return res.send(444);
            cardSingle(customer.id);

          })
        }

      }


    })
    .catch((err) => {
      return res.send(444);
    })


//Sample code....


  // Commenting Up stream code now

  // if (Object.keys(req.body).length === 0) {
  //   return res
  //     .status(422)
  //     .json({message: 'INVALID BODY'});
  // }

  // let paymentData = req.body;
  // if (paymentData.monthlyGiving) {
  //   let url = config.recurly.subscriptionURL;
  //   let body = getMonthlyGivingBody();
  //   let headers = {
  //     'Accept': 'application/xml',
  //     'Authorization': 'Basic ' + encodedKey
  //   };

  //   request
  //     .post({
  //         url: url,
  //         body: body,
  //         headers: headers
  //       },
  //       function (recurlyErr, response, recurlyResponseBody) {
  //         if (recurlyErr) {
  //           console.error(recurlyErr); // ideally this should actually be logging using winston or something
  //           return res
  //             .send(500)
  //             .json({error: 'RECURLY_MONTHLY_GIVING_ERROR'});

  //         } else {
  //           new CreditCard(recurlyResponseBody)
  //             .save()
  //             .then(() => {
  //               return (response.statusCode === 201)
  //                 ? res.json({message: 'success'})
  //                 : res.json({status_code: response.statusCode});
  //             })
  //             .catch((err) => {
  //               console.log(err);
  //               res.status(500).json({error: 'ERROR_SAVING_TRANSACTION'});
  //             });
  //         }
  //       });

  // } else {

  //   let body = getOneTimeGivingBody();
  //   let url = config.recurly.transactionURL;
  //   let headers = {
  //     'Accept': 'application/xml',
  //     'Authorization': 'Basic ' + encodedKey
  //   };

  //   request
  //     .post({
  //         url: url,
  //         body: body,
  //         headers: headers
  //       },
  //       function (recurlyErr, response, recurlyResponseBody) {
  //         if (recurlyErr) {
  //           console.error(recurlyErr);
  //           return res
  //             .send(500)
  //             .json({error: 'RECURLY_ONE_TIME_GIVING_ERROR'});

  //         } else {
  //           new CreditCard(recurlyResponseBody)
  //             .save()
  //             .then(() => {
  //               return (response.statusCode === 201)
  //                 ? res.json({message: 'success'})
  //                 : res.json({status_code: response.statusCode});
  //             })
  //             .catch((err) => {
  //               console.log(err);
  //               res.status(500).json({error: 'ERROR_SAVING_TRANSACTION'});
  //             });
  //         }
  //       });
  // }

  // /////
  // function getMonthlyGivingBody() {
  //   return `
  //       <subscription href="https://kids-discover-test.recurly.com/v2/subscriptions" type="credit_card">
  //         <plan_code>ifgmonthlysb</plan_code>
  //         <unit_amount_in_cents type="integer">${paymentData.amount}</unit_amount_in_cents>
  //         <currency>USD</currency>
  //         <account>
  //           <account_code>${paymentData.emailId}</account_code>
  //           <first_name>${paymentData.firstName}</first_name>
  //           <last_name>${paymentData.lastName}</last_name>
  //           <email>${paymentData.emailId}</email>
  //           <company_name>ifgathering</company_name>
  //           <address>
  //             <address1> ${paymentData.addressOne}</address1>
  //             <address2 nil="nil"/>
  //             <city> ${paymentData.city}</city>
  //             <state>${paymentData.StateCode}</state>
  //             <zip>${paymentData.zipCode}</zip>
  //             <country> ${paymentData.countryList}</country>
  //             <phone nil="nil"/>
  //           </address>
  //           <billing_info type="credit_card">
  //             <first_name>${paymentData.firstName}</first_name>
  //             <last_name>${paymentData.lastName}</last_name>
  //             <address1>${paymentData.addressOne}</address1>
  //             <address2 nil="nil"/>
  //             <city>${paymentData.city}</city>
  //             <state>${paymentData.StateCode}</state>
  //             <zip>${paymentData.zipCode}</zip>
  //             <country>${paymentData.countryList}</country>
  //             <phone nil="nil"/>
  //             <vat_number nil="nil"/>
  //             <number>${paymentData.CCNumber}</number>
  //             <year type="integer">${paymentData.CCYear}</year>
  //             <month type="integer"> ${paymentData.CCMonth}</month>
  //             <verification_value> ${paymentData.CVV}</verification_value>
  //           </billing_info>
  //         </account>
  //       </subscription>`;
  // }

  // function getOneTimeGivingBody() {
  //   return `
  //       <transaction href="https://kids-discover-test.recurly.com/v2/transactions">
  //         <account href="https://kids-discover-test.recurly.com/v2/accounts/${paymentData.emailId}/>
  //         <amount_in_cents type='integer'>${paymentData.amount}</amount_in_cents>
  //         <currency>USD</currency>
  //         <payment_method>credit_card</payment_method>
  //         <account>
  //           <account_code>${paymentData.emailId}</account_code>
  //           <first_name>${paymentData.firstName}</first_name>
  //           <last_name>${paymentData.lastName}</last_name>
  //           <email>${paymentData.emailId}</email>
  //           <company_name>ifgathering</company_name>


  //           <address>
  //             <address1>${paymentData.addressOne}</address1>
  //             <address2 nil='nil'/>
  //             <city>${paymentData.city}</city>
  //             <state>${paymentData.StateCode}</state>
  //             <zip>${paymentData.zipCode}</zip>
  //             <country>${paymentData.countryList}</country>
  //             <phone nil='nil'/>
  //           </address>
  //           <billing_info type='credit_card'>
  //             <first_name>${paymentData.firstName}</first_name>
  //             <last_name>${paymentData.lastName}</last_name>
  //             <address1>${paymentData.addressOne}</address1>
  //             <address2 nil='nil'/>
  //             <city>${paymentData.city}</city>
  //             <state>${paymentData.StateCode}</state>
  //             <zip>${paymentData.zipCode}</zip>
  //             <country>${paymentData.countryList}</country>
  //             <phone nil='nil'/>
  //             <vat_number nil='nil'/>
  //             <year type='integer'>${paymentData.CCYear}</year>
  //             <month type='integer'>${paymentData.CCMonth}</month>
  //             <number>${paymentData.CCNumber}</number>
  //           </billing_info>
  //         </account>
  //       </transaction>`;
  // }

//End of Commenting Up stream code now


}

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cors = require('cors');

var request = require('request');

var index = require('./routes/index');
var users = require('./routes/users');
var api = require('./routes/api');

var app = express();

app.use(cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
app.use('/api',api);

app.get('/recurly', function (req, res) {
    var body = "<transaction href='https://kids-discover-test.recurly.com/v2/transactions'><account href='https://kids-discover-test.recurly.com/v2/accounts/vara.rasuri021@gmail.com'/><amount_in_cents type='integer'>1000</amount_in_cents><currency>USD</currency><payment_method>credit_card</payment_method><account><account_code>vara.rasuri021@gmail.com</account_code><first_name>vAraprasdd</first_name><last_name>rasuri</last_name><email>vara.rasuri021@gmail.com</email><billing_info type='credit_card'><first_name>Varaprasad</first_name><last_name>Rasuri</last_name><address1>123 Main St.</address1><address2 nil='nil'/><city>San Francisco</city><state>CO</state><zip>80912</zip><country>US</country><phone nil='nil'/><vat_number nil='nil'/><year type='integer'>2018</year><month type='integer'>11</month><number>4111-1111-1111-1111</number></billing_info></account></transaction>";
    var url = "https://kids-discover-test.recurly.com/v2/transactions";
    var headers = {
        'Accept': 'application/xml',
        'Authorization': 'Basic N2E0YTI3OTY3ZDY3NGQ2ODg1OTIzOTMzYmNlZjEyZmQ='
    } ;
    request.post({ url: url,body: body,headers: headers}, function(error, response, body) {

        if (!error && response.statusCode == 200) {
            var info = JSON.parse(body);
            console.log(info);
           // return res.send(info);
        } else {
            return res.send(response.body);
        }
    });

});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});
app.use(function(req, res, next) {
  res.Header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type,X-Requested-With,X-Auth-Token');
  res.header('Access-Control-Allow-Methods', 'GET','POST','DELETE,PUT','OPTIONS');
  next();
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



module.exports = app;

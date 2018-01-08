module.exports = function(app, express) {
    var apiRoutes = express.Router(); 
    var userController = require('../controllers/user-controller');
    var transactionController = require('../controllers/tracsaction-controller');
    var jwt = require('jsonwebtoken');
    
    apiRoutes.route('/login')
       .post(userController.login);
    apiRoutes.route('/users').post(userController.addUser);


    // route middleware to verify a token
    apiRoutes.use(function(req, res, next) {

        // check header or url parameters or post parameters for token
        var token = req.body.token || req.query.token || req.headers['x-access-token'];

        // decode token
        if (token) {

            // verifies secret and checks exp
            jwt.verify(token, "superSecret", function(err, decoded) {      
            if (err) {
                return res.json({ success: false, message: 'Failed to authenticate token.' });    
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;    
                next();
            }
            });
        } else {
            // if there is no token
            // return an error
            return res.status(403).send({ 
                success: false, 
                message: 'No token provided.' 
            });

        }
    });
    apiRoutes.route('/transactions')
       .post(transactionController.createTransaction);
    apiRoutes.route('/users')
       .get(userController.listUsers)
      
    apiRoutes.route('/user/:id')
       .get(userController.getUser)
       .put(userController.updateUser)
       .delete(userController.removeUser);
    
    // apiRoutes.route('/transactions')
    //    .post(transactionController.createTransaction);

    app.use('/api', apiRoutes);
};

var async = require('async');
var _ = require('underscore');
module.exports = function(app){
    app.all('/', function(req, res, next){


        /*if(!(req.query.search && req.query.cat)){
            res.end(JSON.stringify({
                'error':'invalid search parameters'
            }));

        }*/

        var objSearch = {
            ResponseGroup:'Images,ItemAttributes',
            SearchIndex: "Blended",//SearchIndex: req.query.cat,//"Books",
            Keywords: app.njax.config.search.products[0]//"Javascript"
        }

        app.prodAdv.call("ItemSearch", objSearch, function(err, result) {
            if(err){
                //console.log(err);
                return next(err);
            }else{
                var sizes = ['large', 'medium'];
                var arrReturn  =[];
                if(result.Items.Item){
                    for(var i in result.Items.Item){
                        if(result.Items.Item[i].ItemAttributes){
                            result.Items.Item[i]._size = sizes[Math.floor(Math.random() * sizes.length)];
                            arrReturn.push(result.Items.Item[i]);
                        }
                    }
                }
                arrReturn = _.shuffle(arrReturn);
                console.log(arrReturn[0]);
                res.render('index', { products: arrReturn });
            }
        })




    });


    /**
     * Model Routes
     */
    require('./model/index')(app);
}
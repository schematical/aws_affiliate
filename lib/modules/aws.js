module.exports = _aws = {
    //TODO: Move this
    shuffle:function(array) {
        var currentIndex = array.length
            , temporaryValue
            , randomIndex
            ;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    },
    pop_interest_results:function(interest, options){
        var sizes = ['medium cat-3','large cat-4','large cat-1', 'medium cat-2', 'medium cat-2', 'medium cat-2'];

        var objSearch = {
            ResponseGroup:'Images,ItemAttributes,Similarities',
            SearchIndex: "Blended",
            Keywords:interest.name
        }
        function _finish(){
            options.arrDeferred.pop();
            if(options.arrDeferred.length == 0){
                var arrReturn = [];
                for(var i in options.results){

                    if(options.results[i].Items.Item){
                        for(var ii in options.results[i].Items.Item){
                            if(options.results[i].Items.Item[ii].ItemAttributes){
                                options.results[i].Items.Item[ii].interest = options.results[i].interest;
                                var product_short_title = options.results[i].Items.Item[ii].ItemAttributes.Title

                                if(product_short_title.length > 50){
                                    product_short_title = product_short_title.substr(0, 40) + '...';
                                }
                                options.results[i].Items.Item[ii].product_short_title = product_short_title;
                                options.results[i].Items.Item[ii].size = sizes[Math.floor(Math.random() * sizes.length)],
                                arrReturn.push(
                                    options.results[i].Items.Item[ii]
                                );
                            }
                        }
                    }
                }
                console.log("Returning " + arrReturn.length +  " results");
                options.done(_aws.shuffle(arrReturn));
            }
        }
        var objDeferred = {
            _done:function(data, interest){

                options.results.push({
                    Items:data.Items,
                    interest: interest
                });
               _finish();
            },
            _error:function(err){

                _finish();
            }
        };
        prodAdv.call("ItemSearch", objSearch, function(err, result) {
            if(err){
                objDeferred._error(err);
            }else{
                objDeferred._done(result, interest);
            }
        });
        options.arrDeferred.push(objDeferred);

    },
    suggestByFriend:function(req, fbuid, funSuccess, funFail){
        req.facebook.api('/' + fbuid + '/likes', function(err, data){
            if(!data || data == null){
                return funFail(data);
            }
            var interests = data.data;
            var options = {
                arrDeferred:[],
                results:[],
                done:funSuccess,
                fail:funFail
            };
            var cats = {};
            for(var i in interests){
                var strAppend = interests[i].name.split(' ')[0];
                if(!cats[interests[i].id]){
                    cats[interests[i].id] = {
                        'id':interests[i].id,
                        'name':interests[i].name,
                        'count':0
                    }
                }
                cats[interests[i].id].count += 1;
                if(interests[i].category){
                    cats[interests[i].category] = {
                        'id':interests[i].category,
                        'name':interests[i].category,// + ' ' + strAppend,
                        'count':0,
                        'parent':{
                            'name':interests[i].name,
                            'id':interests[i].id
                        }
                    };
                    cats[interests[i].category].count += 1;
                }
                if(interests[i].category_list){
                    for(var ii in interests[i].category_list){
                        var cat = interests[i].category_list[ii];
                        if(!cats[cat.id]){
                            cats[cat.id] = {
                                'id':cat.id,
                                'name':cat.name,// + ' ' + strAppend,
                                'count':0,
                                'parent':{
                                    'name':interests[i].name ,
                                    'id':interests[i].id
                                }
                            }
                        }
                        cats[cat.id].count += 1;
                    }
                }
            }
            var cats_array = [];
            for(var i in cats){
                cats_array.push(cats[i]);
            }
            cats_array.sort(function(a,b){
                var a = a.count;
                var b = b.count;
                return a>b?-1:a<b?1:0;
            });


            var search_cats = _aws.shuffle(cats_array).slice(0, 10);
            console.log("Searching " + search_cats.length +  " freind interests for " + fbuid);
            for(var i in search_cats){
                _aws.pop_interest_results(search_cats[i], options);

            }
        });
    }
}
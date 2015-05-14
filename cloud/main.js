// Use AV.Cloud.define to define as many cloud functions as you want.
// For example:
var data_obj = AV.Object.extend("pages_data");

AV.Cloud.define("hello", function(request, response) {
  response.success("Hello world!");
});
AV.Cloud.define("search_music", function(request, response) { 
    var stdout = {"log": ""};
    var title = request.params.tn || "";
    var singer = request.params.sn || "";

    var mlist = [];

    var addlog = function (logstr) {

        stdout.log += (logstr + "\r\n");
    };

    var cb_ok = function (mlist) {

        stdout.data = mlist;
        response.success(stdout);
    };

    var cb_err = function (err) {

        response.error(err.message);
    };

    var getQueryString = function(url,name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
        var r = url.match(reg);
        if (r !== null) return unescape(r[2]);
        return null;
    };

    var cleanText = function(text){

        return text.replace(/<[\s\S]*?>/gi,"");
    };
    
    var enc_url = function(str, pwd) {
        if(pwd === null || pwd.length <= 0) {
            alert("Please enter a password with which to encrypt the message.");
            return null;
        }
        var prand = "";
        for(var i=0; i<pwd.length; i++) {
            prand += pwd.charCodeAt(i).toString();
        }
        var sPos = Math.floor(prand.length / 5);
        var mult = parseInt(prand.charAt(sPos) + prand.charAt(sPos*2) + prand.charAt(sPos*3) + prand.charAt(sPos*4) + prand.charAt(sPos*5));
        var incr = Math.ceil(pwd.length / 2);
        var modu = Math.pow(2, 31) - 1;
        if(mult < 2) {
            alert("Algorithm cannot find a suitable hash. Please choose a different password. \nPossible considerations are to choose a more complex or longer password.");
            return null;
        }
        var salt = Math.round(Math.random() * 1000000000) % 100000000;
        prand += salt;
        while(prand.length > 10) {
            prand = (parseInt(prand.substring(0, 10)) + parseInt(prand.substring(10, prand.length))).toString();
        }
        prand = (mult * prand + incr) % modu;
        var enc_chr = "";
        var enc_str = "";
        for(i=0; i<str.length; i++) {
            enc_chr = parseInt(str.charCodeAt(i) ^ Math.floor((prand / modu) * 255));
            if(enc_chr < 16) {
                enc_str += "0" + enc_chr.toString(16);
            } else enc_str += enc_chr.toString(16);
            prand = (mult * prand + incr) % modu;
        }
        salt = salt.toString(16);
        while(salt.length < 8)salt = "0" + salt;
        enc_str += salt;
        return enc_str;
    };

    var parse_sogou = function(text){

        console.log("a:"+text);
        var k = text.indexOf("<tr>");
        text = text.substr(k);

        console.log("b:"+text);
        var regx=/<tr>[\s\S]*?<\/tr>/;
        var rs=regx.exec(text);

        console.log(rs);
        if ( rs !== null ) {

            text = text.substring(rs[0].length);

            console.log(text);
            for (i = 0; i < 10; i++) {

                rs = regx.exec(text);
                if (rs === null) break;

                console.log(i+":"+rs);
                var regLink = /href="[\s\S]*?"/;
                var val = regLink.exec(rs);
                var dest;

                var obj = {};
                var j;

                obj.link = "";
                obj.singer = "";
                obj.album = "";
                obj.title = "";
                obj.from = "QQ音乐";

                console.log("val:"+val);
                if (val !== null) {
                    dest = val[0];
                    console.log("dest:"+dest);

                    j = dest.indexOf('"');

                    var murl = dest.substring(j + 1, dest.lastIndexOf('"') - 1);

                    obj.link = enc_url(getQueryString(murl, "play"),"music");

                }

                regLink = /href="[\s\S]*?<\/a>/;
                val = regLink.exec(rs);

                if (val !== null) {
                    dest = val[0];

                    j = dest.indexOf(">");
                    if ( j>0 ){
                        dest = dest.substr(j+1);
                    }

                    obj.title = cleanText(dest);
                }
                
                regLink = /div class="name"[\s\S]*?<\/a/;
                val = regLink.exec(rs);

                if (val !== null) {
                    dest = val[0];
                    j = dest.lastIndexOf('>');
                    obj.singer = dest.substring(j + 1, dest.lastIndexOf('<'));
                }
                

                regLink = /<td><a href=[\s\S]*?<\/a/;
                val = regLink.exec(rs);
                if (val !== null) {
                    dest = val[0];
                    j = dest.lastIndexOf('>');
                    obj.album = dest.substring(j + 1, dest.lastIndexOf('<'));
                }

                mlist[i] = obj;

                text = text.substring(rs[0].length);
                if (text === null) break;

            }
        }

    };

    var parse_baidu = function(text){

        var parser = new xml2js.Parser();   //xml -> json
        var json = parser.parseString(text);
        console.log(json);

    };

    //var sUrl = "http://mp3.sogou.com/music.so";
    var sUrl = "http://box.zhangmen.baidu.com/x?op=12&count=1&title=";
    if ( title !== "" ){
        //sUrl += ("?query=" + encodeURIComponent(title));
        sUrl += (title+"$$");
    }

    AV.Cloud.httpRequest({
        url: sUrl,
        success: function(httpResponse) {
            parse_baidu(httpResponse.text);
            cb_ok(mlist);
        },
        error: function(httpResponse) {
            cb_err('Request failed with response code ' + httpResponse.status);
        }
    });

});


AV.Cloud.define("cld_get_tpl_data", function(request, response) {
	    var stdout ={"log":""};

    var tplid = request.params.tplid;



    var addlog = function(logstr){



        stdout.log += (logstr + "\r\n");

    };



    var ConvertTpldata2Json = function(tpldata){



        var tjobj = tpldata.toJSON();

        var pages = tpldata.get("pages");

        var pagesjson = [];

        for ( i=0; i<pages.length; i++){



            var page = pages[i];

            var pagejson = page.toJSON();



            var items = page.get("item_object");

            var itemsjson = [];

            for( j=0; j<items.length; j++ ){



                var item = items[j];

                itemsjson[j]=item.toJSON();

            }



            pagejson.item_object = itemsjson;

            pagesjson[i] = pagejson;

        }

        tjobj.pages = pagesjson;



        return tjobj;

    };



    var cb_ok = function(tpl_data){



        stdout.data = tpl_data;

        response.success(ConvertTpldata2Json(tpl_data));

    };



    var cb_err = function(err){



        response.error(err.message);

    };



    var _execute_array_task = function (objarray, index, cb_task, cb_ok, cb_err) {



        cb_task(objarray[index],

            function (obj) {



                if (index < objarray.length - 1) {

                    _execute_array_task(objarray, index + 1, cb_task, cb_ok, cb_err);

                }

                else {

                    cb_ok(objarray);

                }

            },

            cb_err

        );

    };



    var _fetch_object = function (objarray, index, cb_ok, cb_err) {



        _execute_array_task(objarray, index,

            function (obj, cb_task_ok, cb_task_err) {



                obj.fetch().then(cb_task_ok, cb_task_err);

            },

            function (obj) {

                cb_ok(obj);

            },

            cb_err);

    };



   // var data_obj = AV.Object.extend("pages_data");

    var query = new AV.Query(data_obj);



    query.equalTo("key_id", tplid);

    query.find().then(function (dobjs) {



        if (dobjs.length > 0) {

            var dobj = dobjs[0];

            var pages = dobj.get("pages");



            //获取每个页对象数据

            _fetch_object(pages, 0, function (pages) {



                //addlog("pages:"+ pages[0].toJSON());

                //获取每个page的item数据(elem元素)

                _execute_array_task(pages, 0,

                    function (page, cb_ok, cb_err) {



                        var items = page.get("item_object");

                        _fetch_object(items, 0, cb_ok, cb_err);

                    },

                    function (obj) {



                        var page = dobj.get("pages")[0];

                        if (page.get("item_object")[0].get("item_id") !== null) {

                            //addlog("itemid:"+page.get("item_object")[0].get("item_id"));

                            cb_ok(dobj);

                        } else {

                            cb_err(new AV.Error(3201, "元素数据可能已受到损坏。"));

                        }

                    },

                    cb_err

                );

            }, cb_err);



        } else {

            cb_err(new AV.Error(3202, "指定ID的数据不存在。"));

        }

    }, function (error) {

        cb_err(error);

    }); 
});


AV.Cloud.define("user_update_pwd", function(request, response) {
	
	var phonenum=request.params.phonenum;
var pwd=request.params.pwd;
                    var query = new AV.Query("_User");
                    query.equalTo("username", phonenum);
                    query.first({
                        success: function (results) {
                            response.success(results);
                            //回调函数中修改密码
                            results.set("password", pwd);
                            results.save(null, {
                               success: function (gameScore) {
                                   alert("修改成功!");//跳转到登录
                                  //app.routers.appRouter.navigate("fma/user/login", { replace: true, trigger: true });
                                }
                            });
                        },
                        error: function (error) {
                            alert("修改密码失败：" + error.message);
                        }
                    });
                                
});
AV.Cloud.define("confirm_music_link", function(request, response) {
     var stdout = {"log": ""};
    var urlid = request.params.urlid || "";

    var addlog = function (logstr) {

        stdout.log += (logstr + "\r\n");
    };

    var cb_ok = function (urllink) {

        stdout.data = mlist;
        response.success(stdout);
    };

    var cb_err = function (err) {

        response.error(err.message);
    };

    var dec_url = function (str, pwd) {
        if(str === null || str.length < 8) {
            alert("A salt value could not be extracted from the encrypted message because it's length is too short. The message cannot be decrypted.");
            return;
        }
        if(pwd === null || pwd.length <= 0) {
            alert("Please enter a password with which to decrypt the message.");
            return;
        }
        var prand = "";
        for(var i=0; i<pwd.length; i++) {
            prand += pwd.charCodeAt(i).toString();
        }
        var sPos = Math.floor(prand.length / 5);
        var mult = parseInt(prand.charAt(sPos) + prand.charAt(sPos*2) + prand.charAt(sPos*3) + prand.charAt(sPos*4) + prand.charAt(sPos*5));
        var incr = Math.round(pwd.length / 2);
        var modu = Math.pow(2, 31) - 1;
        var salt = parseInt(str.substring(str.length - 8, str.length), 16);
        str = str.substring(0, str.length - 8);
        prand += salt;
        while(prand.length > 10) {
            prand = (parseInt(prand.substring(0, 10)) + parseInt(prand.substring(10, prand.length))).toString();
        }
        prand = (mult * prand + incr) % modu;
        var enc_chr = "";
        var enc_str = "";
        for(i=0; i<str.length; i+=2) {
            enc_chr = parseInt(parseInt(str.substring(i, i+2), 16) ^ Math.floor((prand / modu) * 255));
            enc_str += String.fromCharCode(enc_chr);
            prand = (mult * prand + incr) % modu;
        }
        return enc_str;
    }

    var urllink = dec_url(urlid,"music");
    cb_ok(urllink);

});
AV.Cloud.define("user_update_personal", function(request, response) {
  var userid = request.params.userid;
 var column_name = request.params.column_name;
 var column_val = request.params.column_val; 
  
 var query = new AV.Query("_User");
 query.equalTo("objectId", userid);
 query.first({
     success: function (results) { 
         results.set(column_name, column_val);  
         results.save(null,{
             success: function (msg) {
                 response.success(msg);
             }
         });
     },
     error: function (error) {
         response.error(err.message);
     }
 })
});
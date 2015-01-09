
function Parser(rule,start_state_index,debug){
    if(typeof rule !== "object")
        rule = [];
    if(typeof start_state_index === "undefined")
        start_state_index = "start";
    if(typeof debug === "undefined")
        debug = false;
    var digest = false;
    var _attr = {};
    var stack_level = 0;

    var var_dump = function(msg){
        if(!debug) return;
        space = "";
        for (var i = 0; i < stack_level; i++) space += "   ";
        console.log(space + "> " + msg);
    };

    var join_ele = function(arr,key){
        var tmp;
        for(var i in arr){
            if(!tmp)
                tmp = "";
            else
                tmp += " | ";
            if(typeof arr[i] === "object")
                tmp+= arr[i][key];
            else if(typeof arr[i] === "function")
                tmp+= "<action>";
            else
                tmp+= arr[i];
        }
        if(!tmp)
            tmp = "";
        return tmp;
    };

    var self = {
        set_input:function(input){
            digest = input;
        },
        parse:function(nter,attr){
            var option = rule[nter];
            var expand = false;
            var tmp;
            var exception = [
                "Parser Error: Unknown syntax on nter [" + nter + "]",
                "Remaining: [ " + self.print_digest() + " ]",
                "Expecting: [" + join_ele(expand,"nter") + "]"
            ];
            var exception_msg = exception.join("\n");

            if(digest.length == 0 && option[""])
                expand = option[""];
            else{
                for(var ter in option){
                    if(ter == digest[0].type)
                        expand = option[ter];
                }
            }
            if(!expand)
                throw exception_msg;
            if(!attr)
                attr = {};

            var_dump("nter: " + nter);
            var_dump("## " + exception[1]);
            var_dump("## " + exception[2]);
            stack_level++;

            for(var i = 0; i < expand.length; i++)
                attr[i] = {};
            for(var i in expand){
                switch(typeof expand[i]){
                case "string": // this is a terminal
                    if(!digest[0])
                        throw exception;
                    var_dump("ter: " + digest[0].type);
                    if(expand[i] != digest[0].type)
                        throw exception;
                    for(var j in digest[0])
                        attr[i][j] = digest[0][j];
                    digest.shift();
                    break;
                case "object": // this is an non-terminal
                    for(var j in expand[i])
                        attr[i][j] = expand[i][j];
                    attr[i] = self.parse(expand[i].nter,attr[i]);
                    break;
                case "function": // this is an action
                    var_dump("action");
                    tmp = (expand[i])(attr);
                    if(tmp)
                        attr = tmp;
                    break;
                default:
                    throw "Parser Rule Error: Type "+(typeof expand[i])+" not allowed in expansion!";
                }
            }

            stack_level--;

            return attr;
        },
        scan:function(input){
            self.set_input(input);
            _attr = self.parse(start_state_index);
            return _attr;
        },
        get_result:function(){
            return _attr;
        },
        print_digest:function(){
            return join_ele(digest,"type");
        }
    };

    return self;
}

if(require.main === module){
    var readlineSync = require('readline-sync');
    var Lexer = require('./Lexer.js');

    var parser_rule = {
        "start":{
            "term":[
                "term",
                function(attr){ attr[2].val = attr[0].lexval + " "; return attr; },
                {nter:"expr"},
                function(attr){ console.log(attr[2].val); },
            ],
        },
        "expr":{
            "+":[
                "+",
                "term",
                function(attr){ attr[3].val = attr.val + attr[1].lexval + " + "; return attr; },
                {nter:"expr"},
                function(attr){ attr.val = attr[3].val; return attr; },
            ],
            "-":[
                "-",
                "term",
                function(attr){ attr[3].val = attr.val + attr[1].lexval + " - "; return attr; },
                {nter:"expr"},
                function(attr){ attr.val = attr[3].val; return attr; },
            ],
            "":[]
        }
    };

    var lexer_rule = {
        "start":{
            "term":"[A-Za-z0-9]",
            "+":"\\+",
            "-":"\\-",
            "ignored":" |\n",
        },
        "term":{
            "term":"[A-Za-z0-9]",
            "Accepted":true
        },
        "+":{
            "Accepted":true
        },
        "-":{
            "Accepted":true
        }
    }

    var input;
    var lex,par;
    lex = Lexer(lexer_rule);
    if(process.argv[2] == "--debug")
        par = Parser(parser_rule,undefined,true);
    else
        par = Parser(parser_rule);

    var lex_result,par_result;

    while((input = readlineSync.question('> ')) != "exit"){
        try{
            console.log("Lexer starting: ======================");
            lex_result = lex.scan(input);
            console.log("Lexer result: ======================");
            console.log(lex_result);

            console.log("Parser starting: ======================");
            par_result = par.scan(lex_result);
            console.log("Parser result: ======================");
            console.log(par_result);
        }catch(msg){
            console.log(msg);
        }
    }
}
else
    module.exports = Parser;

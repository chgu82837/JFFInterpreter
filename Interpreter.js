var readlineSync = require('readline-sync');
var Lexer = require('./Lexer.js');
var Parser = require('./Parser.js');

var parser_rule = {
    "start":{
        "(":[
            {nter:"expression"},
            function(a){
                a[2].val = a[0].val;
                return a;
            },
            {nter:"stmt_t"},
            function(a){
                a.val = a[2].val;
                console.log("Result: " + a.val);
                return a;
            },
        ],
        "number":[
            {nter:"expression"},
            function(a){
                a[2].val = a[0].val;
                return a;
            },
            {nter:"stmt_t"},
            function(a){
                a.val = a[2].val;
                console.log("Result: " + a.val);
                return a;
            },
        ],
    },
    "stmt_t":{
        ";":[
            ";",{nter:"expression"},
            function(a){
                a[4].val0 = a.val;
                a[4].val1 = a[1].val;
                return a;
            },
            ";",{nter:"stmt_u"},
            function(a){
                a.val = a[4].val;
                return a;
            },
        ],
        "":[]
    },
    "stmt_u":{
        "+":[
            function(a){
                if(a.val0 > a.val1)
                    a[2].val = a.val0;
                else
                    a[2].val = a.val1;
                return a;
            },
            "+",{nter:"stmt_t"},
            function(a){
                 a.val = a[2].val;
                return a;
            }
        ],
        "-":[
            function(a){
                if(a.val0 < a.val1)
                    a[2].val = a.val0;
                else
                    a[2].val = a.val1;
                return a;
            },
            "-",{nter:"stmt_t"},
            function(a){
                 a.val = a[2].val;
                return a;
            }
        ],
    },
    "expression":{
        "(":[
            {nter:"term"},
            function(a){
                a[2].val = a[0].val;
                return a;
            },
            {nter:"expression_t"},
            function(a){
                a.val = a[2].val;
                return a;
            },
        ],
        "number":[
            {nter:"term"},
            function(a){
                a[2].val = a[0].val;
                return a;
            },
            {nter:"expression_t"},
            function(a){
                a.val = a[2].val;
                return a;
            },
        ],
    },
    "expression_t":{
        "+":[
            "+",{nter:"expression"},
            function(a){
                a.val += a[1].val;
                return a;
            },
        ],
        "-":[
            "-",{nter:"expression"},
            function(a){
                a.val -= a[1].val;
                return a;
            },
        ],
        "":[],
        ";":[],
        ")":[],
    },
    "term":{
        "(":[
            {nter:"factor"},
            function(a){
                a[2].val = a[0].val;
                return a;
            },
            {nter:"term_t"},
            function(a){
                a.val = a[2].val;
                return a;
            },
        ],
        "number":[
            {nter:"factor"},
            function(a){
                a[2].val = a[0].val;
                return a;
            },
            {nter:"term_t"},
            function(a){
                a.val = a[2].val;
                return a;
            },
        ],
    },
    "term_t":{
        "*":[
            "*",{nter:"term"},
            function(a){
                a.val *= a[1].val;
                return a;
            },
        ],
        "/":[
            "/",{nter:"term"},
            function(a){
                a.val /= a[1].val;
                return a;
            },
        ],
        "+":[],
        "-":[],
        ";":[],
        "":[],
        ")":[],
    },
    "factor":{
        "(":[
            "(",{nter:"expression"},")",
            function(a){
                a.val = a[1].val;
                return a;
            },
        ],
        "number":[
            "number",
            function(a){
                a.val = parseFloat(a[0].lexval);
                return a;
            },
        ],
    }
};

var lexer_rule = {
    "start":{
        "number":"[0-9]",
        ";":";",
        "+":"\\+",
        "-":"\\-",
        "*":"\\*",
        "/":"/",
        "(":"\\(",
        ")":"\\)",
        "ignored":" |\n",
    },
    "number":{
        "number":"[0-9]|\\.",
        "number_e":"E",
        "Accepted":true
    },
    "number_e":{
        "number":"[0-9]",
        "number_e":"\\+|\\-",
    },
    ";":{
        "Accepted":true
    },
    "+":{
        "Accepted":true
    },
    "-":{
        "Accepted":true
    },
    "*":{
        "Accepted":true
    },
    "/":{
        "Accepted":true
    },
    "(":{
        "Accepted":true
    },
    ")":{
        "Accepted":true
    }
}

var input;
var lex,par;
var debug = process.argv[2] == "--debug";
lex = Lexer(lexer_rule,undefined,debug);
par = Parser(parser_rule,undefined,debug);

function var_dump(msg){
    if(debug)
        console.log(msg);
}

var lex_result,par_result;

// var fs = require('fs');
// var contents = fs.readFileSync('README.md', 'utf8').toString();
var contents = "Hello world. This is a simple caculator\n";
console.log(contents + "Please input: (input 'exit' to exit)");

while((input = readlineSync.question('> ')) != "exit"){
    try{
        var_dump("Lexer starting: ======================");
        lex_result = lex.scan(input);
        var_dump("Lexer result: ======================");
        var_dump(lex_result);

        var_dump("Parser starting: ======================");
        par_result = par.scan(lex_result);
        var_dump("Parser result: ======================");
        var_dump(par_result);
    }catch(msg){
        console.log(msg);
    }
}


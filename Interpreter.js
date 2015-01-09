var readlineSync = require('readline-sync');
var Lexer = require('./Lexer.js');
var Parser = require('./Parser.js');

var symbol_table = {};

var parser_rule = {
    "start":{
        "char":[
            {nter:"E"},
        ],
        "int":[
            {nter:"E"},
        ],
        "print":[
            {nter:"E"},
        ],
        "|":[
            {nter:"E"},
        ]
    },
    "E":{
        "char":[
            "char","id","=","{","letter",
            function(attr){attr[6].val = [attr[4].lexval]; return attr; },
            {nter:"L"},
            function(attr){ symbol_table[attr[1].lexval] = attr[6].val; return attr;},
            "}",";",{nter:"E"}
        ],
        "int":[
            "int","id","=","{","digit",
            function(attr){attr[6].val = [parseInt(attr[4].lexval)]; return attr; },
            {nter:"D"},
            function(attr){ symbol_table[attr[1].lexval] = attr[6].val; return attr;},
            "}",";",{nter:"E"}
        ],
        "print":[
            "print","(",{nter:"T"},
            function(attr){attr[4].val = attr[2].val; return attr;},
            {nter:"A"},")",
            function(attr){
                if(attr[4].result)
                    console.log(attr[4].result);
                else
                    console.log(attr[2].val);
            },
            ";",{nter:"E"}
        ],
        "|":[
            "|",{nter:"T"},"|",
            function(attr){ console.log("Count: " + attr[1].val.length); }
        ],
        "":[]
    },
    "L":{
        ",":[
            ",","letter",
            function(attr){ attr.val.push(attr[1].lexval); attr[3].val = attr.val; return attr;},
            {nter:"L"},
            function(attr){attr.val = attr[3].val; return attr;}
        ],
        "}":[]
    },
    "D":{
        ",":[
            ",","digit",
            function(attr){ attr.val.push(parseInt(attr[1].lexval)); attr[3].val = attr.val; return attr;},
            {nter:"D"},
            function(attr){attr.val = attr[3].val; return attr;}
        ],
        "}":[]
    },
    "T":{
        "id":[
            {nter:"R"},
            function(attr){attr[2].val = attr[0].val; return attr;},
            {nter:"Y"},
            function(attr){
                if(attr[2].result)
                    attr.val = attr[2].result;
                else
                    attr.val = symbol_table[attr[0].val];
                return attr;
            }
        ]
    },
    "Y":{
        "+":[
            "+",{nter:"R"},
            function(attr){
                var op1 = (attr.inter) ? attr.inter : symbol_table[attr.val];
                var op2 = symbol_table[attr[1].val];
                var result = op1.concat([]);
                var i;
                for (var k in op2) {
                    for (i = 0; i < result.length; i++) {
                        if(op2[k] == result[i])
                            break;
                    }
                    result[i] = op2[k];
                }
                attr.result = result;
                attr[3].inter = result;
                return attr;
            },
            {nter:"Y"},
            function(attr){
                if(attr[3].result){
                    attr.result = attr[3].result;
                    return attr;
                }
            },
        ],
        "-":[
            "-",{nter:"R"},
            function(attr){
                var op1 = (attr.inter) ? attr.inter : symbol_table[attr.val];
                var op2 = symbol_table[attr[1].val];
                var result = op1.concat([]);
                for (var k in op2) {
                    for (i = 0; i < result.length; i++) {
                        if(op2[k] == result[i])
                            result.splice(i,1);
                    }
                }
                attr.result = result;
                attr[3].inter = result;
                return attr;
            },
            {nter:"Y"},
            function(attr){
                if(attr[3].result){
                    attr.result = attr[3].result;
                    return attr;
                }
            },
        ],
        "*":[
            "*",{nter:"R"},
            function(attr){
                var op1 = (attr.inter) ? attr.inter : symbol_table[attr.val];
                var op2 = symbol_table[attr[1].val];
                var result = [];
                for (var k in op1) {
                    for(var j in op2){
                        if(op1[k]==op2[j])
                            result.push([op1[k]]);
                        else
                            result.push([op1[k],op2[j]]);
                    }
                }
                attr.result = result;
                attr[3].inter = result;
                return attr;
            },
            {nter:"Y"},
            function(attr){
                if(attr[3].result){
                    attr.result = attr[3].result;
                    return attr;
                }
            },
        ],
        ".":[
            ".",{nter:"R"},
            function(attr){
                var op1 = (attr.inter) ? attr.inter : symbol_table[attr.val];
                var op2 = symbol_table[attr[1].val];
                var result = [];
                for (var k in op1) {
                    for(var j in op2){
                        if(op1[k] == op2[j])
                            result.push(op1[k]);
                    }
                }
                attr.result = result;
                attr[3].inter = result;
                return attr;
            },
            {nter:"Y"},
            function(attr){
                if(attr[3].result){
                    attr.result = attr[3].result;
                    return attr;
                }
            },
        ],
        "avg":[],
        "total":[],
        ")":[],
        "|":[]
    },
    "R":{
        "id":[
            "id",
            function(attr){attr.val = attr[0].lexval; return attr;}
        ],
        "|":[]
    },
    "A":{
        "avg":[
            "avg",
            function(attr){
                var sum = 0;
                for(var k in attr.val){
                    if(typeof attr.val[k] !== "number")
                        throw "Some elements are not number!";
                    sum += attr.val[k];
                }
                attr.result = "Average: " + (sum/attr.val.length);
                return attr;
            }
        ],
        "total":[
            "total",
            function(attr){
                var sum = 0;
                for(var k in attr.val){
                    if(typeof attr.val[k] !== "number")
                        throw "Some elements are not number!";
                    sum += attr.val[k];
                }
                attr.result = "Total: " + (sum);
                return attr;
            }
        ],
        ")":[]
    }
};

var lexer_rule = {
    "start":{
        "char":"char",
        "int":"int",
        "print":"print",
        "avg":"avg",
        "total":"total",
        "digit":"[0-9]",
        "letter":"[a-z]",
        "id":"[A-Z]",
        "+":"\\+",
        "-":"\\-",
        "*":"\\*",
        ",":",",
        ";":";",
        "(":"\\(",
        ")":"\\)",
        "=":"=",
        "{":"\\{",
        "}":"\\}",
        "|":"\\|",
        ".":"\\.",
        "ignored":" |\n",
    },
    "char":{
        "Accepted":true
    },
    "int":{
        "Accepted":true
    },
    "print":{
        "Accepted":true
    },
    "avg":{
        "Accepted":true
    },
    "total":{
        "Accepted":true
    },
    "digit":{
        "digit":"[0-9]",
        "Accepted":true
    },
    "letter":{
        "Accepted":true
    },
    "id":{
        "id":"[A-Z]",
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
    ",":{
        "Accepted":true
    },
    ";":{
        "Accepted":true
    },
    "(":{
        "Accepted":true
    },
    ")":{
        "Accepted":true
    },
    "=":{
        "Accepted":true
    },
    "{":{
        "Accepted":true
    },
    "}":{
        "Accepted":true
    },
    "|":{
        "Accepted":true
    },
    ".":{
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

require('fs').readFile('README.md', 'utf8', function (err,data) {
    if(!err)
        console.log(data + "Please input: (input 'exit' to exit)");
    while((input = readlineSync.question('> ')) != "exit"){
        try{
            // console.log("Lexer starting: ======================");
            lex_result = lex.scan(input);
            // console.log("Lexer result: ======================");
            // console.log(lex_result);

            // console.log("Parser starting: ======================");
            par_result = par.scan(lex_result);
            // console.log("Parser result: ======================");
            // console.log(par_result);

            // console.log("symbol_table:");
            // console.log(symbol_table);
        }catch(msg){
            console.log(msg);
        }
    }
});


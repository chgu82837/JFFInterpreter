
function Lexer(rule,start_state_index,debug){
    if(typeof rule !== "object")
        rule = [];
    if(typeof start_state_index === "undefined")
        start_state_index = "start";
    if(typeof debug === "undefined")
        debug = false;
    var digest = false;
    var accept_transition = "Accepted";
    var ignore_transition = "ignored";
    var ptn = "";
    var self = {
        set_input:function(input){
            digest = input;
        },
        set_start_state_index:function(new_start_state_index){
            start_state_index = new_start_state_index;
        },
        set_accept_transition:function(new_accept_transition){
            accept_transition = new_accept_transition;
        },
        set_ignore_transition:function(new_ignore_transition){
            ignore_transition = new_ignore_transition;
        },
        next_ptn:function(state_index){
            if(typeof digest !== "string")
                throw "Please specify the input!";
            if(state_index == ignore_transition){
                ptn = "";
                return false;
            }
            var accepted = false;
            var tmp = "";
            if(debug)
                console.log("state: " + state_index + " | digest [" + digest + "]");
            for(var tran in rule[state_index]){
                if(tran === accept_transition){
                    accepted = rule[state_index][tran];
                    continue;
                }
                if(typeof rule[state_index][tran] === "string"){
                    // console.log("creating RegExp for " + tran);
                    rule[state_index][tran] = new RegExp("^" + rule[state_index][tran]);
                }
                if(debug)
                    console.log("... " + tran + " : " + rule[state_index][tran]);
                tmp = rule[state_index][tran].exec(digest);
                if(tmp){
                    ptn += tmp[0];
                    digest = digest.replace(tmp[0],"");
                    return self.next_ptn(tran);
                }
            }
            tmp = ptn;
            ptn = "";
            if(accepted){
                if(typeof accepted === "function")
                    return accepted(ptn);
                return {type:state_index,lexval:tmp};
            }
            tmp += digest.charAt(0);
            throw "Lexer Error: unknown pattern [" + tmp + "]";
        },
        scan:function(input){
            self.set_input(input);
            tokens = [];
            var new_token;
            while(digest != ""){
                if(new_token = self.next_ptn(start_state_index)){
                    if(debug)
                        console.log("adding: " + new_token);
                    tokens.push(new_token);
                }
            }
            return tokens;
        },
        add_state:function(name,state){
            rule[name] = state;
        }
    };

    return self;
}

if(require.main === module){

    var sample_rule = {
        "start":{
            "for":"for",
            "if":"if",
            "digit":"[0-9]",
            "alpha":"[A-Za-z]",
            "ignored":" |\n",
        },
        "digit":{
            "digit":"[0-9]",
            "Accepted":true
        },
        "alpha":{
            "alpha":"[A-Za-z]",
            "Accepted":true
        },
        "for":{
            "Accepted":true
        },
        "if":{
            "Accepted":true
        }
    };

    var readlineSync = require('readline-sync');
    var input;
    var lex;
    if(process.argv[2] == "--debug")
        lex = new Lexer(sample_rule,undefined,true);
    else
        lex = new Lexer(sample_rule);

    while((input = readlineSync.question('> ')) != "exit"){
        try{
            console.log(lex.scan(input));
        }catch(msg){
            console.log(msg);
        }
    }
}
else
    module.exports = Lexer;

const assert = require('assert');
const $json=require('../index.js');
const $stream=require('stream');
const $check=require('check-types');

describe('JSON Magic', function() {
    describe('parse path', function() {
        it('should parse a pointer path', function() {
            assert.deepEqual($json.parsePath('a/b/c'),['a','b','c'],'Invalid parse');
        });

        it('should parse a pointer path with leading slash', function() {
            assert.deepEqual($json.parsePath('/a/b/c'),['a','b','c'],'Invalid parse');
        });

        it('should parse a dot path', function() {
            assert.deepEqual($json.parsePath('a.b.c'),['a','b','c'],'Invalid parse');
        });

        it('should parse a dot path with leading dot', function() {
            assert.deepEqual($json.parsePath('.a.b.c'),['a','b','c'],'Invalid parse');
        });

        it('should parse unknown separator path', function() {
            assert.deepEqual($json.parsePath('/a.b.c'),['/a','b','c'],'Invalid parse');
        });

        it('should parse ua specified spearator', function() {
            assert.deepEqual($json.parsePath('a$$b$$c','$$'),['a','b','c'],'Invalid parse');
        });

    });

    describe('compile path', function() {

        it('should throw an error on invalid request', function() {
            assert.throws(()=>{$json.compilePath("a,b,c")},Error,'Invalid compile');
        });

        it('should compile a path', function() {
            assert.deepEqual($json.compilePath(['a','b','c']),'/a/b/c','Invalid compile');
        });

        it('should compile a path with dot', function() {
            assert.deepEqual($json.compilePath(['a','b','c'],'.'),'a.b.c','Invalid compile');
        });

        it('should compile a path with separator', function() {
            assert.deepEqual($json.compilePath(['a','b','c'],'$$',true),'a$$b$$c','Invalid compile');
        });
    });

    describe('has', function() {

        it('should check a defined path', function() {
            assert($json.has({a:{b:{c:1}}},'/a/b/c'),'Invalid defined check');
        });

        it('should check a path not defined', function() {
            assert(!$json.has({a:{b:null}},'/a/b/c'),'Invalid defined check');
        });

        it('should check a path defined array', function() {
            assert($json.has({a:{b:[{c:1},{c:2}]}},'/a/b/0/c'),'Invalid defined check');
        });

        it('should check a path not defined array', function() {
            assert(!$json.has({a:{b:[{d:1},{c:2}]}},'/a/b/0/c'),'Invalid defined check');
        });

        it('should check a path not defined array dot', function() {
            assert(!$json.has({a:{b:[{d:1},{c:2}]}},'a.b.0.c'),'Invalid defined check');
        });

        it('should has 1', function() {
            assert($json.has({a:{b:{c:1}}},'a.b'),'Invalid Has');
        });

        it('should has array', function() {
            assert($json.has([{a:{b:{c:1}}}],'0.a.b'),'Invalid Has');
        });

        it('should not has 1', function() {
            assert(!$json.has({a:{b:{c:1}}},'a.x'),'Invalid Has');
        });

        it('should has error null', function() {
            assert(!$json.has(null,'a.x'),'Invalid Has');
        });

        it('should has error string', function() {
            assert(!$json.has('a','a.x'),'Invalid Has');
        });

    });

    describe('get attribute', function() {
        it('should get a value 1 ', function() {
            assert.deepEqual($json.get({a:{b:{c:1}}},'.a.b.c'),1,'Invalid get');
        });

        it('should get a value 2', function() {
            assert.deepEqual($json.get({a:{b:{c:1}}},'a.b'),{c:1},'Invalid get');
        });

        it('should get a value 3', function() {
            assert.deepEqual($json.get({a:{b:{c:1}}},'/a/b'),{c:1},'Invalid get');
        });

        it('should error on get a value on string', function() {
            assert.throws(function(){
                $json.get('xxx','/')
            },Error,"Invalid Error thrown")
        });

        it('should error on get a value on null', function() {
            assert.throws(function(){
                $json.get(null,'/a/x/c')
            },Error,"Invalid Error thrown")
        });

        it('should throw an error on an invalid path', function() {
            assert.throws(function(){
                $json.get({a:{b:{c:1}}},'/a/x/c')
            },Error,"Invalid Error thrown")
        });
    });

    describe('set attribute', function() {

        it('should set a value 1 ', function() {
            let val={};
            $json.set(val,'.a.b.c',1)
            assert.deepEqual(val,{a:{b:{c:1}}},'Invalid set');
        });

        it('should set a value 2', function() {
            let val={};
            $json.set(val,'.a.b',{c:1})
            assert.deepEqual(val,{a:{b:{c:1}}},'Invalid set');
        });

        it('should set a value 3', function() {
            let val={};
            $json.set(val,'/a/b',{c:1})
            assert.deepEqual(val,{a:{b:{c:1}}},'Invalid set');
        });
        it('should set a value 4 ', function() {
            let val={};
            $json.set(val,'a','1')
            assert.deepEqual(val,{a:'1'},'Invalid set');
        });
        it('should set a value 5 ', function() {
            let val=[];
            $json.set(val,'/0','Val1')
            assert.deepEqual(val,['Val1'],'Invalid set');
        });



        it('should set a value 4', function() {
            let val={a:{b:{c:null}}};
            $json.set(val,'/a/b/c',1)
            assert.deepEqual(val,{a:{b:{c:1}}},'Invalid set');
        });

        it('should throw an error on a non object', function() {

            assert.throws(function(){
                let val='xxx';
                $json.set(val,{c:1},'/a/x')
            },Error,"Invalid Error thrown")

        });

        it('should not set a null object', function() {
            assert.throws(function(){
                let val=null;
                $json.set(val,{c:1},'/a/x')
            },Error,"Invalid Error thrown")
        });
    });


    describe('remove attribute', function() {
        it('should remove a value', function() {
            let val={a:{b:{c:1}}};
            $json.remove(val,'/a/b/c')
            assert.deepEqual(val,{a:{b:{}}},'Invalid remove');
        });

        it('should remove a value', function() {
            let val={a:{b:{c:1}}};
            $json.remove(val,'/a/b')
            assert.deepEqual(val,{a:{}},'Invalid remove');
        });
    });


    describe('path dictionary', function() {
        it('should get a pathDict', function() {
            let val={a:{b:{c:1,d:2}}};

            assert.deepEqual($json.pathDict(val),{'/a/b/c':1,'/a/b/d':2},'Invalid paths');
        });

        it('should get a pathDict with dot', function() {
            let val={a:{b:{c:1,d:2}}};
            assert.deepEqual($json.pathDict(val,'dot'),{'a.b.c':1,'a.b.d':2},'Invalid paths');
        });

        it('should get a pathDict with dot 2', function() {
            let val={a:{b:{c:1,d:2},x:'abc'}};
            assert.deepEqual($json.pathDict(val,'dot'),{'a.b.c':1,'a.b.d':2,'a.x':'abc'},'Invalid paths');
        });
    });

    describe('path array', function() {

        it('should get a pathArr', function() {
            let val={a:{b:{c:1,d:2}}};

            assert.deepEqual($json.pathArray(val),[{path:'/a/b/c',value:1},{path:'/a/b/d',value:2}],'Invalid paths');
        });

        it('should get a pathArr with dot', function() {
            let val={a:{b:{c:1,d:2}}};

            assert.deepEqual($json.pathArray(val,'dot'),[{path:'a.b.c',value:1},{path:'a.b.d',value:2}],'Invalid paths');
        });

        it('should get a pathArr with dot 2', function() {
            let val={a:{b:{c:1,d:2},x:'abc'}};
            assert.deepEqual($json.pathArray(val,'dot'),[{path:'a.b.c',value:1},{path:'a.b.d',value:2},{path:'a.x',value:'abc'}],'Invalid paths');
        });

    });

    describe('walk', function() {
        it('should walk', function() {
            let val={a:{b:{c:1,d:2},x:'abc'}};
            let walkedVals={};
            $json.walk(val,function(value,path){
                walkedVals[path]=value;
            });
            assert.deepEqual(walkedVals,{'/a/b/c':1,'/a/b/d':2,'/a/x':'abc'},'Invalid walk');
        });


        it('should walk dot', function() {
            let val={a:{b:{c:1,d:2},x:'abc'}};
            let walkedVals={};
            $json.walk(val,function(value,path){
                walkedVals[path]=value;
            },'.');
            assert.deepEqual(walkedVals,{'a.b.c':1,'a.b.d':2,'a.x':'abc'},'Invalid walk');
        });

        it('should walk string', function() {
            let val="abc";
            let walkedVals="";
            $json.walk(val,function(value,path){
                assert.equal(path,"/","Invalid path");
                assert.equal(value,"abc","invalid value")
            });
        });
    });


    describe('rename key', function() {
        it('should not rename key', function() {
            let val={a:{b:{c:1,d:2},x:'abc'}};

            val=$json.renameKey(val,(key,path)=>{
                return key;
            });
            assert.deepEqual(val,{a:{b:{c:1,d:2},x:'abc'}},'Invalid key rename');
        });

        it('should rename a key', function() {
            let val={a:{b:{c:1,d:2},x:'abc'}};

            val=$json.renameKey(val,(key,path)=>{
                if (key==="c")return "r";
            });
            assert.deepEqual(val,{a:{b:{r:1,d:2},x:'abc'}},'Invalid key rename');
        });

        it('should rename a key with array', function() {
            let val={a:{b:[{c:1,d:2},{c:4,d:5}],x:'abc'}};

            val=$json.renameKey(val,(key,path)=>{
                if (key==="c")return "r";
                else if (key==="x")return "x2";
            });
            assert.deepEqual(val,{a:{b:[{r:1,d:2},{r:4,d:5}],x2:'abc'}},'Invalid key rename');
        });


        it('should rename complex', function() {
            let val={"$uuid":"269d84c7-356c-3e41-953f-d5938e3fcfcf","$etag":"2018-11-06T14:39:53Z","$actxUser":"xxx","$actxLogin":"xxxx","$actxFolder":"XXXXX","$actxSolution":"X3","$actxLan":"ENG","$actxLanIso":"en-US","$actxNbLeg":"1","$actxLegCur":"ZAF","BPAINVNAM":"Midrand Test 001","BPAPYRNAM":"Midrand Test 001","ABCCLS":1,"ACCCOD":"BPC01","BCGCOD":"BPC01","BCGCOD_REF":{"$title":"Internal Deb","$description":"Internal Debtors"},"BPAINV":"TEST001","BPAINV_REF":{"$description":"Midrand Test 001","$title":""},"BPAPYR":"TEST001","BPAPYR_REF":{"$description":"Midrand Test 001","$title":""},"BPCBPSNUM":"","BPCCDTISR":"","BPCCDTISR_REF":{"$title":""},"BPCGRU":"12001","BPCINV":"12001","BPCNUM":"12001","BPCPYR":"12001","BPCPYR_REF":{"$title":"TEST003","$description":"amathole"},"BPCRSK":"12001","BPCSHO":"TEST003","BPCSNCDAT":"2017-11-05","BPCSTA":false,"BPCTYP":1,"BPCBPD":[{"$uuid":"162a3e90-5e95-4a49-a573-172f0c746be5","BPC_BPD_BPAADD":"1","BPC_BPD_BPAADD_REF":{"$title":""},"BP__BPD_BPAADDNAM":"","BPCLOC":"","BPCLOC_REF":{"$title":""},"BPC_BPD_BPDADDFLG":false,"BPTNUM":"","BPTNUM_REF":{"$title":""},"CLADLVTEX":null,"CLAPRPTEX":null,"BPCBPDC_BPDNAM":["Test003"],"BPCBPDC_REP":[{"REPNUM":"","$title":""},{"REPNUM":"","$title":""}],"DAYLTI":0,"DLVPIO":1,"DLVTEX":"","DRN":1,"EECICT":"","EECICT_REF":{"$title":""},"EECINCRAT":0,"EECLOC":1,"BPC_BPD_EECNUM":"","ENAFLG":true,"FFWADD":"","FFWADD_REF":{"$title":""},"FFWNUM":"","FFWNUM_REF":{"$title":""},"ICTCTY":"","BPC_BPD_LAN":"ENG","BPC_BPD_LAN_REF":{"$title":"American","$description":"English - American"},"MDL":"","MDL_REF":{"$title":""},"NDEFLG":false,"NPRFLG":false,"PRPTEX":"","RCPFCY":"","RCPFCY_REF":{"$title":""},"SCOLOC":"","SCOLOC_REF":{"$title":""},"STOFCY":"","STOFCY_REF":{"$title":""},"UVYCOD":"","UVYDAY1":true,"UVYDAY2":true,"UVYDAY3":true,"UVYDAY4":true,"UVYDAY5":true,"UVYDAY6":true,"UVYDAY7":true,"BPC_BPD_VACBPR":"","BPC_BPD_VACBPR_REF":{"$title":""},"BPC_BPD_VACBPR_LEG":"","BPC_BPD_VACBPR_LEG_REF":{"$title":""},"$properties":{"BPC_BPD_BPAADD":{"$isDisabled":true,"$isMandatory":true}}},{"$uuid":"a259e7dc-a2d6-0b46-a8d4-8fc90bd3c667","BPC_BPD_BPAADD":"2","BPC_BPD_BPAADD_REF":{"$title":""},"BP__BPD_BPAADDNAM":"","BPCLOC":"","BPCLOC_REF":{"$title":""},"BPC_BPD_BPDADDFLG":false,"BPTNUM":"","BPTNUM_REF":{"$title":""},"CLADLVTEX":null,"CLAPRPTEX":null,"BPCBPDC_BPDNAM":["Test001"],"BPCBPDC_REP":[{"REPNUM":"","$title":""},{"REPNUM":"","$title":""}],"DAYLTI":0,"DLVPIO":1,"DLVTEX":"","DRN":1,"EECICT":"","EECICT_REF":{"$title":""},"EECINCRAT":0,"EECLOC":1,"BPC_BPD_EECNUM":"","ENAFLG":true,"FFWADD":"","FFWADD_REF":{"$title":""},"FFWNUM":"","FFWNUM_REF":{"$title":""},"ICTCTY":"","BPC_BPD_LAN":"ENG","BPC_BPD_LAN_REF":{"$title":"American","$description":"English - American"},"MDL":"","MDL_REF":{"$title":""},"NDEFLG":false,"NPRFLG":false,"PRPTEX":"","RCPFCY":"","RCPFCY_REF":{"$title":""},"SCOLOC":"","SCOLOC_REF":{"$title":""},"STOFCY":"","STOFCY_REF":{"$title":""},"UVYCOD":"","UVYDAY1":true,"UVYDAY2":true,"UVYDAY3":true,"UVYDAY4":true,"UVYDAY5":true,"UVYDAY6":true,"UVYDAY7":true,"BPC_BPD_VACBPR":"","BPC_BPD_VACBPR_REF":{"$title":""},"BPC_BPD_VACBPR_LEG":"","BPC_BPD_VACBPR_LEG_REF":{"$title":""},"$properties":{"BPC_BPD_BPAADD":{"$isDisabled":true,"$isMandatory":true}}},{"$uuid":"5e5a0bb1-68b4-404e-b146-4e4e664f45b5","BPC_BPD_BPAADD":"KRUGER_AVENUE","BPC_BPD_BPAADD_REF":{"$description":"58 KRUGER AVENUE LYTTELTON","$title":""},"BP__BPD_BPAADDNAM":"58 KRUGER AVENUE LYTTELTON","BPCLOC":"","BPCLOC_REF":{"$title":""},"BPC_BPD_BPDADDFLG":false,"BPTNUM":"","BPTNUM_REF":{"$title":""},"CLADLVTEX":null,"CLAPRPTEX":null,"BPCBPDC_BPDNAM":["Test00311"],"BPCBPDC_REP":[{"REPNUM":"","$title":""},{"REPNUM":"","$title":""}],"DAYLTI":0,"DLVPIO":1,"DLVTEX":"","DRN":1,"EECICT":"","EECICT_REF":{"$title":""},"EECINCRAT":0,"EECLOC":1,"BPC_BPD_EECNUM":"","ENAFLG":true,"FFWADD":"","FFWADD_REF":{"$title":""},"FFWNUM":"","FFWNUM_REF":{"$title":""},"ICTCTY":"","BPC_BPD_LAN":"ENG","BPC_BPD_LAN_REF":{"$title":"American","$description":"English - American"},"MDL":"","MDL_REF":{"$title":""},"NDEFLG":false,"NPRFLG":false,"PRPTEX":"","RCPFCY":"","RCPFCY_REF":{"$title":""},"SCOLOC":"","SCOLOC_REF":{"$title":""},"STOFCY":"","STOFCY_REF":{"$title":""},"UVYCOD":"","UVYDAY1":true,"UVYDAY2":true,"UVYDAY3":true,"UVYDAY4":true,"UVYDAY5":true,"UVYDAY6":true,"UVYDAY7":true,"BPC_BPD_VACBPR":"","BPC_BPD_VACBPR_REF":{"$title":""},"BPC_BPD_VACBPR_LEG":"","BPC_BPD_VACBPR_LEG_REF":{"$title":""},"$properties":{"BPC_BPD_BPAADD":{"$isDisabled":true,"$isMandatory":true}}},{"$uuid":"fdafc967-e208-f54b-8174-ba53b6731705","BPC_BPD_BPAADD":"TEST001","BPC_BPD_BPAADD_REF":{"$description":"Midrand Test 001","$title":""},"BP__BPD_BPAADDNAM":"Midrand Test 001","BPCLOC":"","BPCLOC_REF":{"$title":""},"BPC_BPD_BPDADDFLG":true,"BPTNUM":"","BPTNUM_REF":{"$title":""},"CLADLVTEX":null,"CLAPRPTEX":null,"BPCBPDC_BPDNAM":["Test003"],"BPCBPDC_REP":[{"REPNUM":"","$title":""},{"REPNUM":"","$title":""}],"DAYLTI":0,"DLVPIO":1,"DLVTEX":"","DRN":1,"EECICT":"","EECICT_REF":{"$title":""},"EECINCRAT":0,"EECLOC":1,"BPC_BPD_EECNUM":"","ENAFLG":true,"FFWADD":"","FFWADD_REF":{"$title":""},"FFWNUM":"","FFWNUM_REF":{"$title":""},"ICTCTY":"","BPC_BPD_LAN":"ENG","BPC_BPD_LAN_REF":{"$title":"American","$description":"English - American"},"MDL":"","MDL_REF":{"$title":""},"NDEFLG":false,"NPRFLG":false,"PRPTEX":"","RCPFCY":"","RCPFCY_REF":{"$title":""},"SCOLOC":"","SCOLOC_REF":{"$title":""},"STOFCY":"","STOFCY_REF":{"$title":""},"UVYCOD":"","UVYDAY1":true,"UVYDAY2":true,"UVYDAY3":true,"UVYDAY4":true,"UVYDAY5":true,"UVYDAY6":true,"UVYDAY7":true,"BPC_BPD_VACBPR":"","BPC_BPD_VACBPR_REF":{"$title":""},"BPC_BPD_VACBPR_LEG":"","BPC_BPD_VACBPR_LEG_REF":{"$title":""},"$properties":{"BPC_BPD_BPAADD":{"$isDisabled":true,"$isMandatory":true}}}],"BETFCY":false,"BPCBPRBPA":[{"$uuid":"a9efa409-aaf9-ba4d-9617-8b8664739347","ADRVAL":false,"BPR_BPA_BPAADD":"KRUGER_AVENUE","BPR_BPA_BPAADD_REF":{"$description":"58 KRUGER AVENUE LYTTELTON","$title":""},"BPAADDLIG1":"KRUGER AVENUE","BPAADDLIG2":"58 KRUGER AVENUE","BPAADDLIG3":"LYTTELTON MANOR","BPADEFFLG":false,"BPADES":"58 KRUGER AVENUE LYTTELTON","BPR_BPA_BPANUM":"12001","BPR_BPA_BPATYP":1,"BPCBPRBPACOLTEL":[{"$uuid":"9912ffe1-5e2e-8c4a-8e57-fbd588ded04c","TELNUM":"0112342345","TELTYP":1},{"$uuid":"eb4f331a-8af6-5d43-9528-995bb6f8003d","TELNUM":"","TELTYP":2},{"$uuid":"a1d73091-a5e7-684e-a843-8966c28273cf","TELNUM":"","TELTYP":3},{"$uuid":"15529ddf-daef-d745-a3de-b3a117263e55","TELNUM":"","TELTYP":4},{"$uuid":"63f931dd-4df8-a649-b158-03ed04b9827c","TELNUM":"","TELTYP":5}],"BPCBPRBPACOLWEB":[{"$uuid":"96e74777-c4f6-984f-b6df-aef0c53f9022","WEBADR":"test@test.com","WEBTYP":1},{"$uuid":"c271a26f-c1de-bc49-9f76-95d0b11fb544","WEBADR":"","WEBTYP":2},{"$uuid":"19899a96-9247-324c-9bc6-8b40adc56c06","WEBADR":"","WEBTYP":3},{"$uuid":"df8a1e92-7efe-fd47-977d-4712397268c1","WEBADR":"","WEBTYP":4},{"$uuid":"6ad689fa-3841-4949-a89f-148cc9537748","WEBADR":"","WEBTYP":5}],"BPC_BPA_CRY":"ZA","BPC_BPA_CRY_REF":{"$title":"South Africa","$description":"South Africa"},"CRYNAM":"South Africa","CTY":"CENTURION","EXTNUM":"","FCYWEB":"","POSCOD":"0157","POSCOD_REF":{"$title":""},"SAT":"","SAT_REF":{"$title":""},"$properties":{"BPR_BPA_BPATYP":{"$isDisabled":true,"$isMandatory":true},"BPR_BPA_BPANUM":{"$isDisabled":true,"$isMandatory":true},"BPR_BPA_BPAADD":{"$isDisabled":true,"$isMandatory":true}}},{"$uuid":"78633eaf-9167-6c44-b1e1-42f0c5805cb2","ADRVAL":false,"BPR_BPA_BPAADD":"ST-PAULS-ROAD-ARCADIA","BPR_BPA_BPAADD_REF":{"$description":"ST-PAULS-ROAD-ARCADIA","$title":""},"BPAADDLIG1":"0","BPAADDLIG2":"0","BPAADDLIG3":"0","BPADEFFLG":true,"BPADES":"ST-PAULS-ROAD-ARCADIA","BPR_BPA_BPANUM":"12001","BPR_BPA_BPATYP":1,"BPCBPRBPACOLTEL":[{"$uuid":"0d93e70c-b572-d849-9389-f29c45d60719","TELNUM":"","TELTYP":1},{"$uuid":"7d99862e-7141-2b4d-b577-f9fa3e61bcd1","TELNUM":"","TELTYP":2},{"$uuid":"51f1f2bd-d6ab-d643-a515-e62a7f849ad5","TELNUM":"","TELTYP":3},{"$uuid":"7b04d168-33c4-ca42-812d-262029f92f93","TELNUM":"","TELTYP":4},{"$uuid":"67faaf82-360a-d74b-bc16-a28db12c9e1a","TELNUM":"","TELTYP":5}],"BPCBPRBPACOLWEB":[{"$uuid":"bacc1c92-6d28-7b49-b48f-cd4a2d8a8c72","WEBADR":"","WEBTYP":1},{"$uuid":"3b31e034-4f3d-4042-9de7-811945828018","WEBADR":"","WEBTYP":2},{"$uuid":"09bdb965-024b-c04b-82d6-83aff662a3ef","WEBADR":"","WEBTYP":3},{"$uuid":"1c247d10-1885-5f40-a329-64a4e6085ea2","WEBADR":"","WEBTYP":4},{"$uuid":"e0b40126-4fcd-d84b-8aa9-b34e39ae4c8c","WEBADR":"","WEBTYP":5}],"BPC_BPA_CRY":"ZA","BPC_BPA_CRY_REF":{"$title":"South Africa","$description":"South Africa"},"CRYNAM":"South Africa","CTY":"CRM","EXTNUM":"","FCYWEB":"www.companysite.here","POSCOD":"0000","POSCOD_REF":{"$title":""},"SAT":"","SAT_REF":{"$title":""},"$properties":{"BPR_BPA_BPATYP":{"$isDisabled":true,"$isMandatory":true},"BPR_BPA_BPANUM":{"$isDisabled":true,"$isMandatory":true},"BPR_BPA_BPAADD":{"$isDisabled":true,"$isMandatory":true}}},{"$uuid":"04b7d9c4-10e6-fe45-8c84-1dbd559d6385","ADRVAL":false,"BPR_BPA_BPAADD":"ST_PAULS_ROAD_ARCADIA","BPR_BPA_BPAADD_REF":{"$description":"ST-PAULS-ROAD-ARCADIA","$title":""},"BPAADDLIG1":"0","BPAADDLIG2":"0","BPAADDLIG3":"0","BPADEFFLG":false,"BPADES":"ST-PAULS-ROAD-ARCADIA","BPR_BPA_BPANUM":"12001","BPR_BPA_BPATYP":1,"BPCBPRBPACOLTEL":[{"$uuid":"290db47d-953f-0641-9678-0d240cbf8e92","TELNUM":"","TELTYP":1},{"$uuid":"09b9fa10-e57f-c348-9ee7-21bf236a4ba6","TELNUM":"","TELTYP":2},{"$uuid":"35e1ab2a-8887-0843-ab95-efbe831a60a3","TELNUM":"","TELTYP":3},{"$uuid":"6ef191bb-fa35-574b-98f5-5523e1b16775","TELNUM":"","TELTYP":4},{"$uuid":"6c575620-30b5-d34a-a695-6e0e11b70030","TELNUM":"","TELTYP":5}],"BPCBPRBPACOLWEB":[{"$uuid":"36beceda-6e66-594c-a308-421815ba25c4","WEBADR":"","WEBTYP":1},{"$uuid":"2b957b18-fb59-fb4b-91ed-ac2239072716","WEBADR":"","WEBTYP":2},{"$uuid":"7ae6fbb7-db30-cd46-8584-cc906127f8b3","WEBADR":"","WEBTYP":3},{"$uuid":"794c2963-8594-6743-aa5b-96c318e34046","WEBADR":"","WEBTYP":4},{"$uuid":"a3b4091c-77f0-ba4f-a694-1361a914c7d5","WEBADR":"","WEBTYP":5}],"BPC_BPA_CRY":"ZA","BPC_BPA_CRY_REF":{"$title":"South Africa","$description":"South Africa"},"CRYNAM":"","CTY":"Harare","EXTNUM":"","FCYWEB":"","POSCOD":"200144","POSCOD_REF":{"$title":""},"SAT":"","SAT_REF":{"$title":""},"$properties":{"BPR_BPA_BPATYP":{"$isDisabled":true,"$isMandatory":true},"BPR_BPA_BPANUM":{"$isDisabled":true,"$isMandatory":true},"BPR_BPA_BPAADD":{"$isDisabled":true,"$isMandatory":true}}},{"$uuid":"c12d66d3-a088-c34b-a1a4-2a3afe2cb202","ADRVAL":false,"BPR_BPA_BPAADD":"TEST001","BPR_BPA_BPAADD_REF":{"$description":"Midrand Test 001","$title":""},"BPAADDLIG1":"MUTARE","BPAADDLIG2":"MASVINGO","BPAADDLIG3":"HARARE","BPADEFFLG":false,"BPADES":"Midrand Test 001","BPR_BPA_BPANUM":"12001","BPR_BPA_BPATYP":1,"BPCBPRBPACOLTEL":[{"$uuid":"affa5194-e8e0-6b4d-9e2c-ee3080587067","TELNUM":"","TELTYP":1},{"$uuid":"4af92dcf-4d2d-fa45-a212-c073039b75f6","TELNUM":"","TELTYP":2},{"$uuid":"ea33da29-d437-ee4f-af64-9dc14628a333","TELNUM":"","TELTYP":3},{"$uuid":"0df08ee6-5642-b140-985e-d524220a6d90","TELNUM":"","TELTYP":4},{"$uuid":"38c5c67a-5144-084e-9269-89e3eff27fd2","TELNUM":"","TELTYP":5}],"BPCBPRBPACOLWEB":[{"$uuid":"51415074-cf02-f94c-81ed-e160c145d4b4","WEBADR":"","WEBTYP":1},{"$uuid":"adac5aa2-eb1f-7743-baa9-7c2f2f1b74a1","WEBADR":"","WEBTYP":2},{"$uuid":"12d113e2-25f5-8d4b-839d-32e01ce5833d","WEBADR":"","WEBTYP":3},{"$uuid":"f3c67d9b-d7ac-b849-91c7-44bd18bcff04","WEBADR":"","WEBTYP":4},{"$uuid":"364ef72d-1d03-7843-b717-9ed79cd4a0c3","WEBADR":"","WEBTYP":5}],"BPC_BPA_CRY":"ZA","BPC_BPA_CRY_REF":{"$title":"South Africa","$description":"South Africa"},"CRYNAM":"","CTY":"BeitBridge","EXTNUM":"","FCYWEB":"http://www.google.com","POSCOD":"8888","POSCOD_REF":{"$title":""},"SAT":"","SAT_REF":{"$title":""},"$properties":{"BPR_BPA_BPATYP":{"$isDisabled":true,"$isMandatory":true},"BPR_BPA_BPANUM":{"$isDisabled":true,"$isMandatory":true},"BPR_BPA_BPAADD":{"$isDisabled":true,"$isMandatory":true}}}],"BPCFLG":true,"BPRACC":false,"BPRFBDMAG":false,"BPRLOG":"","BPSFLG":false,"BPTFLG":false,"BPCBPRCNT":[{"$uuid":"75c512cc-c4b8-944f-9e62-a05d81bc9295","CNTADD":"","CNTADD_REF":{"$title":""},"CNT_BPANUM":"12001","CNT_BPATYP":1,"CNT_CCNCRM":"000000000001948","CNT_CCNCRM_REF":{"$description":"brian","$title":""},"CNTFNC":2,"CNTMSS":"","CNTMSS_REF":{"$title":""},"CNTSRV":"","CNTBIR":"0000-00-00","CNTCSP":"","CNTCSP_REF":{"$title":""},"CNTFBDMAG":false,"CNTFNA":"jaricha","CNTLAN":"ENG","CNTLAN_REF":{"$title":"American","$description":"English - American"},"CNTLNA":"brian","CNTTTL":1,"CNTCRY":"","CNTCRY_REF":{"$title":""},"CNTFAX":"","CNTMOB":"","TCDEFFLG":true,"CNTTEL":"","WEB":"","$properties":{"CNT_CCNCRM":{"$isDisabled":true,"$isMandatory":true},"CNT_BPATYP":{"$isDisabled":true,"$isMandatory":true},"CNT_BPANUM":{"$isDisabled":true,"$isMandatory":true}}}],"CRN":"SA100025440","CRY":"ZA","CRY_REF":{"$title":"South Africa","$description":"South Africa"},"BPC_BPR_CUR":"ZAR","BPC_BPR_CUR_REF":{"$title":"Rand","$description":"South African Rand","$symbol":"","$scale":2,"$precision":13},"BPCBPRC_BPRNAM":["amathole"],"DOOFLG":false,"EECNUM":"","FCY":"","FCY_REF":{"$title":""},"LAN":"ENG","LAN_REF":{"$title":"American","$description":"English - American"},"LEGETT":false,"PPTFLG":false,"PRVFLG":false,"REPFLG":false,"$properties":{"REPCUR":{"$x3Format":""},"CUR":{"$x3Format":""},"BPCNUM":{"$isMandatory":true},"LAN":{"$isMandatory":true},"BPC_BPR_CUR":{"$x3Format":"","$isMandatory":true}},"BUS":"GOVERNMENT","BUS_REF":{"$title":""},"CHGTYP":1,"CLAINVTEX":null,"CLAORDTEX1":null,"COMCAT":1,"COTCHX":"","COTPITRQD":1,"CUR":"ZAR","CUR_REF":{"$title":"Rand","$description":"South African Rand","$symbol":"","$scale":2,"$precision":13},"BPCC_DIE":[{"$uuid":"29881481-c3bb-2249-b6ea-8c5ae893229f","CCE":"","CCE_REF":{"$title":""},"DIE":"AX5","DIE_REF":{"$title":"CUST","$description":"Customer"}},{"$uuid":"e2751f1c-419e-3449-beeb-63ded31646c4","CCE":"","CCE_REF":{"$title":""},"DIE":"AX6","DIE_REF":{"$title":"PROJECTS","$description":"Projects"}}],"BPCC_INVDTAAMT":[{"$uuid":"33d8fe50-47a0-2542-8398-f9f40bcc56a0","INVDTA":1,"INVDTAAMT":0,"INVDTACUR":"","INVDTACUR_REF":{"$title":""},"INVDTADES":"Discount %","INVDTATYP":3},{"$uuid":"2c605de6-662b-ec4b-addf-76f1025aa41f","INVDTA":7,"INVDTAAMT":0,"INVDTACUR":"ZAR","INVDTACUR_REF":{"$title":"Rand","$description":"South African Rand","$symbol":"","$scale":2,"$precision":13},"INVDTADES":"Discount Amo","INVDTATYP":1,"$properties":{"INVDTACUR":{"$x3Format":""}}}],"BPCC_TSCCOD":[{"$uuid":"008bc946-08fc-f440-b5eb-e0b386c95813","TSCCOD":"","TSCCOD_REF":{"$title":""},"TSCCODADI":31},{"$uuid":"0b527d11-1a0f-cd4e-88e4-a4070ea878ea","TSCCOD":"","TSCCOD_REF":{"$title":""},"TSCCODADI":32},{"$uuid":"e6d412e6-077a-0e4b-925e-30294f663a62","TSCCOD":"","TSCCOD_REF":{"$title":""},"TSCCODADI":33},{"$uuid":"d578ee7a-3dc5-3a4e-8194-b3639d1abf11","TSCCOD":"","TSCCOD_REF":{"$title":""},"TSCCODADI":0},{"$uuid":"e8c38636-5e63-124c-acb2-02fc25f8792a","TSCCOD":"","TSCCOD_REF":{"$title":""},"TSCCODADI":0}],"DEP":"","DEP_REF":{"$title":""},"DEP_LEG":"","DEP_LEG_REF":{"$title":""},"DIA":"","DME":1,"DUDCLC":1,"FCTNUM":"","FCTNUM_REF":{"$title":""},"FREINV":2,"FUPMINAMT":0,"FUPTYP":1,"GRP":"","GRP_REF":{"$title":""},"IME":6,"INVCND":"","INVPER":6,"INVTEX":"","LNDAUZ":false,"OCNFLG":false,"ODL":false,"ORDCLE":true,"ORDTEX":"","ORIPPT":"","ORIPPT_REF":{"$title":""},"OSTCTL":1,"PAYBAN":"","PITCDT":0,"PITCPT":1,"PRITYP":1,"PTE":"ZACOD","PTE_REF":{"$title":"COD","$description":"Cash on Delivery"},"PTE_LEG":"ZAF","PTE_LEG_REF":{"$title":"South Africa","$description":"South African legislation"},"SOIPER":1,"TOTPIT":1,"TPMCOD":"","UVYCOD2":"","VACBPR":"ZADOM","VACBPR_REF":{"$title":"Domestic","$description":"South African Domestic"},"VACBPR_LEG":"ZAF","VACBPR_LEG_REF":{"$title":"South Africa","$description":"South African legislation"},"VATEXN":"","BPCPITDEB":0,"CDTISR":0,"CDTISRDAT":"0000-00-00","NULPIO":false,"ORDMINAMT":0,"OST":771.42,"OSTAUZ":0,"REPCUR":"ZAR","REPCUR_REF":{"$title":"Rand","$description":"South African Rand","$symbol":"","$scale":2,"$precision":13}};

            val=$json.renameKey(val,(key,path)=>{
                if (!key)return key;
                if (!$check.string(key))return key;
                if (key.startsWith('$')){
                    key='_' + key.substring(1);
                }
                key=key.replace(/\./g,'_');

                return key;
            });
            assert.deepEqual(val,{"_uuid":"269d84c7-356c-3e41-953f-d5938e3fcfcf","_etag":"2018-11-06T14:39:53Z","_actxUser":"xxx","_actxLogin":"xxxx","_actxFolder":"XXXXX","_actxSolution":"X3","_actxLan":"ENG","_actxLanIso":"en-US","_actxNbLeg":"1","_actxLegCur":"ZAF","BPAINVNAM":"Midrand Test 001","BPAPYRNAM":"Midrand Test 001","ABCCLS":1,"ACCCOD":"BPC01","BCGCOD":"BPC01","BCGCOD_REF":{"_title":"Internal Deb","_description":"Internal Debtors"},"BPAINV":"TEST001","BPAINV_REF":{"_description":"Midrand Test 001","_title":""},"BPAPYR":"TEST001","BPAPYR_REF":{"_description":"Midrand Test 001","_title":""},"BPCBPSNUM":"","BPCCDTISR":"","BPCCDTISR_REF":{"_title":""},"BPCGRU":"12001","BPCINV":"12001","BPCNUM":"12001","BPCPYR":"12001","BPCPYR_REF":{"_title":"TEST003","_description":"amathole"},"BPCRSK":"12001","BPCSHO":"TEST003","BPCSNCDAT":"2017-11-05","BPCSTA":false,"BPCTYP":1,"BPCBPD":[{"_uuid":"162a3e90-5e95-4a49-a573-172f0c746be5","BPC_BPD_BPAADD":"1","BPC_BPD_BPAADD_REF":{"_title":""},"BP__BPD_BPAADDNAM":"","BPCLOC":"","BPCLOC_REF":{"_title":""},"BPC_BPD_BPDADDFLG":false,"BPTNUM":"","BPTNUM_REF":{"_title":""},"CLADLVTEX":null,"CLAPRPTEX":null,"BPCBPDC_BPDNAM":["Test003"],"BPCBPDC_REP":[{"REPNUM":"","_title":""},{"REPNUM":"","_title":""}],"DAYLTI":0,"DLVPIO":1,"DLVTEX":"","DRN":1,"EECICT":"","EECICT_REF":{"_title":""},"EECINCRAT":0,"EECLOC":1,"BPC_BPD_EECNUM":"","ENAFLG":true,"FFWADD":"","FFWADD_REF":{"_title":""},"FFWNUM":"","FFWNUM_REF":{"_title":""},"ICTCTY":"","BPC_BPD_LAN":"ENG","BPC_BPD_LAN_REF":{"_title":"American","_description":"English - American"},"MDL":"","MDL_REF":{"_title":""},"NDEFLG":false,"NPRFLG":false,"PRPTEX":"","RCPFCY":"","RCPFCY_REF":{"_title":""},"SCOLOC":"","SCOLOC_REF":{"_title":""},"STOFCY":"","STOFCY_REF":{"_title":""},"UVYCOD":"","UVYDAY1":true,"UVYDAY2":true,"UVYDAY3":true,"UVYDAY4":true,"UVYDAY5":true,"UVYDAY6":true,"UVYDAY7":true,"BPC_BPD_VACBPR":"","BPC_BPD_VACBPR_REF":{"_title":""},"BPC_BPD_VACBPR_LEG":"","BPC_BPD_VACBPR_LEG_REF":{"_title":""},"_properties":{"BPC_BPD_BPAADD":{"_isDisabled":true,"_isMandatory":true}}},{"_uuid":"a259e7dc-a2d6-0b46-a8d4-8fc90bd3c667","BPC_BPD_BPAADD":"2","BPC_BPD_BPAADD_REF":{"_title":""},"BP__BPD_BPAADDNAM":"","BPCLOC":"","BPCLOC_REF":{"_title":""},"BPC_BPD_BPDADDFLG":false,"BPTNUM":"","BPTNUM_REF":{"_title":""},"CLADLVTEX":null,"CLAPRPTEX":null,"BPCBPDC_BPDNAM":["Test001"],"BPCBPDC_REP":[{"REPNUM":"","_title":""},{"REPNUM":"","_title":""}],"DAYLTI":0,"DLVPIO":1,"DLVTEX":"","DRN":1,"EECICT":"","EECICT_REF":{"_title":""},"EECINCRAT":0,"EECLOC":1,"BPC_BPD_EECNUM":"","ENAFLG":true,"FFWADD":"","FFWADD_REF":{"_title":""},"FFWNUM":"","FFWNUM_REF":{"_title":""},"ICTCTY":"","BPC_BPD_LAN":"ENG","BPC_BPD_LAN_REF":{"_title":"American","_description":"English - American"},"MDL":"","MDL_REF":{"_title":""},"NDEFLG":false,"NPRFLG":false,"PRPTEX":"","RCPFCY":"","RCPFCY_REF":{"_title":""},"SCOLOC":"","SCOLOC_REF":{"_title":""},"STOFCY":"","STOFCY_REF":{"_title":""},"UVYCOD":"","UVYDAY1":true,"UVYDAY2":true,"UVYDAY3":true,"UVYDAY4":true,"UVYDAY5":true,"UVYDAY6":true,"UVYDAY7":true,"BPC_BPD_VACBPR":"","BPC_BPD_VACBPR_REF":{"_title":""},"BPC_BPD_VACBPR_LEG":"","BPC_BPD_VACBPR_LEG_REF":{"_title":""},"_properties":{"BPC_BPD_BPAADD":{"_isDisabled":true,"_isMandatory":true}}},{"_uuid":"5e5a0bb1-68b4-404e-b146-4e4e664f45b5","BPC_BPD_BPAADD":"KRUGER_AVENUE","BPC_BPD_BPAADD_REF":{"_description":"58 KRUGER AVENUE LYTTELTON","_title":""},"BP__BPD_BPAADDNAM":"58 KRUGER AVENUE LYTTELTON","BPCLOC":"","BPCLOC_REF":{"_title":""},"BPC_BPD_BPDADDFLG":false,"BPTNUM":"","BPTNUM_REF":{"_title":""},"CLADLVTEX":null,"CLAPRPTEX":null,"BPCBPDC_BPDNAM":["Test00311"],"BPCBPDC_REP":[{"REPNUM":"","_title":""},{"REPNUM":"","_title":""}],"DAYLTI":0,"DLVPIO":1,"DLVTEX":"","DRN":1,"EECICT":"","EECICT_REF":{"_title":""},"EECINCRAT":0,"EECLOC":1,"BPC_BPD_EECNUM":"","ENAFLG":true,"FFWADD":"","FFWADD_REF":{"_title":""},"FFWNUM":"","FFWNUM_REF":{"_title":""},"ICTCTY":"","BPC_BPD_LAN":"ENG","BPC_BPD_LAN_REF":{"_title":"American","_description":"English - American"},"MDL":"","MDL_REF":{"_title":""},"NDEFLG":false,"NPRFLG":false,"PRPTEX":"","RCPFCY":"","RCPFCY_REF":{"_title":""},"SCOLOC":"","SCOLOC_REF":{"_title":""},"STOFCY":"","STOFCY_REF":{"_title":""},"UVYCOD":"","UVYDAY1":true,"UVYDAY2":true,"UVYDAY3":true,"UVYDAY4":true,"UVYDAY5":true,"UVYDAY6":true,"UVYDAY7":true,"BPC_BPD_VACBPR":"","BPC_BPD_VACBPR_REF":{"_title":""},"BPC_BPD_VACBPR_LEG":"","BPC_BPD_VACBPR_LEG_REF":{"_title":""},"_properties":{"BPC_BPD_BPAADD":{"_isDisabled":true,"_isMandatory":true}}},{"_uuid":"fdafc967-e208-f54b-8174-ba53b6731705","BPC_BPD_BPAADD":"TEST001","BPC_BPD_BPAADD_REF":{"_description":"Midrand Test 001","_title":""},"BP__BPD_BPAADDNAM":"Midrand Test 001","BPCLOC":"","BPCLOC_REF":{"_title":""},"BPC_BPD_BPDADDFLG":true,"BPTNUM":"","BPTNUM_REF":{"_title":""},"CLADLVTEX":null,"CLAPRPTEX":null,"BPCBPDC_BPDNAM":["Test003"],"BPCBPDC_REP":[{"REPNUM":"","_title":""},{"REPNUM":"","_title":""}],"DAYLTI":0,"DLVPIO":1,"DLVTEX":"","DRN":1,"EECICT":"","EECICT_REF":{"_title":""},"EECINCRAT":0,"EECLOC":1,"BPC_BPD_EECNUM":"","ENAFLG":true,"FFWADD":"","FFWADD_REF":{"_title":""},"FFWNUM":"","FFWNUM_REF":{"_title":""},"ICTCTY":"","BPC_BPD_LAN":"ENG","BPC_BPD_LAN_REF":{"_title":"American","_description":"English - American"},"MDL":"","MDL_REF":{"_title":""},"NDEFLG":false,"NPRFLG":false,"PRPTEX":"","RCPFCY":"","RCPFCY_REF":{"_title":""},"SCOLOC":"","SCOLOC_REF":{"_title":""},"STOFCY":"","STOFCY_REF":{"_title":""},"UVYCOD":"","UVYDAY1":true,"UVYDAY2":true,"UVYDAY3":true,"UVYDAY4":true,"UVYDAY5":true,"UVYDAY6":true,"UVYDAY7":true,"BPC_BPD_VACBPR":"","BPC_BPD_VACBPR_REF":{"_title":""},"BPC_BPD_VACBPR_LEG":"","BPC_BPD_VACBPR_LEG_REF":{"_title":""},"_properties":{"BPC_BPD_BPAADD":{"_isDisabled":true,"_isMandatory":true}}}],"BETFCY":false,"BPCBPRBPA":[{"_uuid":"a9efa409-aaf9-ba4d-9617-8b8664739347","ADRVAL":false,"BPR_BPA_BPAADD":"KRUGER_AVENUE","BPR_BPA_BPAADD_REF":{"_description":"58 KRUGER AVENUE LYTTELTON","_title":""},"BPAADDLIG1":"KRUGER AVENUE","BPAADDLIG2":"58 KRUGER AVENUE","BPAADDLIG3":"LYTTELTON MANOR","BPADEFFLG":false,"BPADES":"58 KRUGER AVENUE LYTTELTON","BPR_BPA_BPANUM":"12001","BPR_BPA_BPATYP":1,"BPCBPRBPACOLTEL":[{"_uuid":"9912ffe1-5e2e-8c4a-8e57-fbd588ded04c","TELNUM":"0112342345","TELTYP":1},{"_uuid":"eb4f331a-8af6-5d43-9528-995bb6f8003d","TELNUM":"","TELTYP":2},{"_uuid":"a1d73091-a5e7-684e-a843-8966c28273cf","TELNUM":"","TELTYP":3},{"_uuid":"15529ddf-daef-d745-a3de-b3a117263e55","TELNUM":"","TELTYP":4},{"_uuid":"63f931dd-4df8-a649-b158-03ed04b9827c","TELNUM":"","TELTYP":5}],"BPCBPRBPACOLWEB":[{"_uuid":"96e74777-c4f6-984f-b6df-aef0c53f9022","WEBADR":"test@test.com","WEBTYP":1},{"_uuid":"c271a26f-c1de-bc49-9f76-95d0b11fb544","WEBADR":"","WEBTYP":2},{"_uuid":"19899a96-9247-324c-9bc6-8b40adc56c06","WEBADR":"","WEBTYP":3},{"_uuid":"df8a1e92-7efe-fd47-977d-4712397268c1","WEBADR":"","WEBTYP":4},{"_uuid":"6ad689fa-3841-4949-a89f-148cc9537748","WEBADR":"","WEBTYP":5}],"BPC_BPA_CRY":"ZA","BPC_BPA_CRY_REF":{"_title":"South Africa","_description":"South Africa"},"CRYNAM":"South Africa","CTY":"CENTURION","EXTNUM":"","FCYWEB":"","POSCOD":"0157","POSCOD_REF":{"_title":""},"SAT":"","SAT_REF":{"_title":""},"_properties":{"BPR_BPA_BPATYP":{"_isDisabled":true,"_isMandatory":true},"BPR_BPA_BPANUM":{"_isDisabled":true,"_isMandatory":true},"BPR_BPA_BPAADD":{"_isDisabled":true,"_isMandatory":true}}},{"_uuid":"78633eaf-9167-6c44-b1e1-42f0c5805cb2","ADRVAL":false,"BPR_BPA_BPAADD":"ST-PAULS-ROAD-ARCADIA","BPR_BPA_BPAADD_REF":{"_description":"ST-PAULS-ROAD-ARCADIA","_title":""},"BPAADDLIG1":"0","BPAADDLIG2":"0","BPAADDLIG3":"0","BPADEFFLG":true,"BPADES":"ST-PAULS-ROAD-ARCADIA","BPR_BPA_BPANUM":"12001","BPR_BPA_BPATYP":1,"BPCBPRBPACOLTEL":[{"_uuid":"0d93e70c-b572-d849-9389-f29c45d60719","TELNUM":"","TELTYP":1},{"_uuid":"7d99862e-7141-2b4d-b577-f9fa3e61bcd1","TELNUM":"","TELTYP":2},{"_uuid":"51f1f2bd-d6ab-d643-a515-e62a7f849ad5","TELNUM":"","TELTYP":3},{"_uuid":"7b04d168-33c4-ca42-812d-262029f92f93","TELNUM":"","TELTYP":4},{"_uuid":"67faaf82-360a-d74b-bc16-a28db12c9e1a","TELNUM":"","TELTYP":5}],"BPCBPRBPACOLWEB":[{"_uuid":"bacc1c92-6d28-7b49-b48f-cd4a2d8a8c72","WEBADR":"","WEBTYP":1},{"_uuid":"3b31e034-4f3d-4042-9de7-811945828018","WEBADR":"","WEBTYP":2},{"_uuid":"09bdb965-024b-c04b-82d6-83aff662a3ef","WEBADR":"","WEBTYP":3},{"_uuid":"1c247d10-1885-5f40-a329-64a4e6085ea2","WEBADR":"","WEBTYP":4},{"_uuid":"e0b40126-4fcd-d84b-8aa9-b34e39ae4c8c","WEBADR":"","WEBTYP":5}],"BPC_BPA_CRY":"ZA","BPC_BPA_CRY_REF":{"_title":"South Africa","_description":"South Africa"},"CRYNAM":"South Africa","CTY":"CRM","EXTNUM":"","FCYWEB":"www.companysite.here","POSCOD":"0000","POSCOD_REF":{"_title":""},"SAT":"","SAT_REF":{"_title":""},"_properties":{"BPR_BPA_BPATYP":{"_isDisabled":true,"_isMandatory":true},"BPR_BPA_BPANUM":{"_isDisabled":true,"_isMandatory":true},"BPR_BPA_BPAADD":{"_isDisabled":true,"_isMandatory":true}}},{"_uuid":"04b7d9c4-10e6-fe45-8c84-1dbd559d6385","ADRVAL":false,"BPR_BPA_BPAADD":"ST_PAULS_ROAD_ARCADIA","BPR_BPA_BPAADD_REF":{"_description":"ST-PAULS-ROAD-ARCADIA","_title":""},"BPAADDLIG1":"0","BPAADDLIG2":"0","BPAADDLIG3":"0","BPADEFFLG":false,"BPADES":"ST-PAULS-ROAD-ARCADIA","BPR_BPA_BPANUM":"12001","BPR_BPA_BPATYP":1,"BPCBPRBPACOLTEL":[{"_uuid":"290db47d-953f-0641-9678-0d240cbf8e92","TELNUM":"","TELTYP":1},{"_uuid":"09b9fa10-e57f-c348-9ee7-21bf236a4ba6","TELNUM":"","TELTYP":2},{"_uuid":"35e1ab2a-8887-0843-ab95-efbe831a60a3","TELNUM":"","TELTYP":3},{"_uuid":"6ef191bb-fa35-574b-98f5-5523e1b16775","TELNUM":"","TELTYP":4},{"_uuid":"6c575620-30b5-d34a-a695-6e0e11b70030","TELNUM":"","TELTYP":5}],"BPCBPRBPACOLWEB":[{"_uuid":"36beceda-6e66-594c-a308-421815ba25c4","WEBADR":"","WEBTYP":1},{"_uuid":"2b957b18-fb59-fb4b-91ed-ac2239072716","WEBADR":"","WEBTYP":2},{"_uuid":"7ae6fbb7-db30-cd46-8584-cc906127f8b3","WEBADR":"","WEBTYP":3},{"_uuid":"794c2963-8594-6743-aa5b-96c318e34046","WEBADR":"","WEBTYP":4},{"_uuid":"a3b4091c-77f0-ba4f-a694-1361a914c7d5","WEBADR":"","WEBTYP":5}],"BPC_BPA_CRY":"ZA","BPC_BPA_CRY_REF":{"_title":"South Africa","_description":"South Africa"},"CRYNAM":"","CTY":"Harare","EXTNUM":"","FCYWEB":"","POSCOD":"200144","POSCOD_REF":{"_title":""},"SAT":"","SAT_REF":{"_title":""},"_properties":{"BPR_BPA_BPATYP":{"_isDisabled":true,"_isMandatory":true},"BPR_BPA_BPANUM":{"_isDisabled":true,"_isMandatory":true},"BPR_BPA_BPAADD":{"_isDisabled":true,"_isMandatory":true}}},{"_uuid":"c12d66d3-a088-c34b-a1a4-2a3afe2cb202","ADRVAL":false,"BPR_BPA_BPAADD":"TEST001","BPR_BPA_BPAADD_REF":{"_description":"Midrand Test 001","_title":""},"BPAADDLIG1":"MUTARE","BPAADDLIG2":"MASVINGO","BPAADDLIG3":"HARARE","BPADEFFLG":false,"BPADES":"Midrand Test 001","BPR_BPA_BPANUM":"12001","BPR_BPA_BPATYP":1,"BPCBPRBPACOLTEL":[{"_uuid":"affa5194-e8e0-6b4d-9e2c-ee3080587067","TELNUM":"","TELTYP":1},{"_uuid":"4af92dcf-4d2d-fa45-a212-c073039b75f6","TELNUM":"","TELTYP":2},{"_uuid":"ea33da29-d437-ee4f-af64-9dc14628a333","TELNUM":"","TELTYP":3},{"_uuid":"0df08ee6-5642-b140-985e-d524220a6d90","TELNUM":"","TELTYP":4},{"_uuid":"38c5c67a-5144-084e-9269-89e3eff27fd2","TELNUM":"","TELTYP":5}],"BPCBPRBPACOLWEB":[{"_uuid":"51415074-cf02-f94c-81ed-e160c145d4b4","WEBADR":"","WEBTYP":1},{"_uuid":"adac5aa2-eb1f-7743-baa9-7c2f2f1b74a1","WEBADR":"","WEBTYP":2},{"_uuid":"12d113e2-25f5-8d4b-839d-32e01ce5833d","WEBADR":"","WEBTYP":3},{"_uuid":"f3c67d9b-d7ac-b849-91c7-44bd18bcff04","WEBADR":"","WEBTYP":4},{"_uuid":"364ef72d-1d03-7843-b717-9ed79cd4a0c3","WEBADR":"","WEBTYP":5}],"BPC_BPA_CRY":"ZA","BPC_BPA_CRY_REF":{"_title":"South Africa","_description":"South Africa"},"CRYNAM":"","CTY":"BeitBridge","EXTNUM":"","FCYWEB":"http://www.google.com","POSCOD":"8888","POSCOD_REF":{"_title":""},"SAT":"","SAT_REF":{"_title":""},"_properties":{"BPR_BPA_BPATYP":{"_isDisabled":true,"_isMandatory":true},"BPR_BPA_BPANUM":{"_isDisabled":true,"_isMandatory":true},"BPR_BPA_BPAADD":{"_isDisabled":true,"_isMandatory":true}}}],"BPCFLG":true,"BPRACC":false,"BPRFBDMAG":false,"BPRLOG":"","BPSFLG":false,"BPTFLG":false,"BPCBPRCNT":[{"_uuid":"75c512cc-c4b8-944f-9e62-a05d81bc9295","CNTADD":"","CNTADD_REF":{"_title":""},"CNT_BPANUM":"12001","CNT_BPATYP":1,"CNT_CCNCRM":"000000000001948","CNT_CCNCRM_REF":{"_description":"brian","_title":""},"CNTFNC":2,"CNTMSS":"","CNTMSS_REF":{"_title":""},"CNTSRV":"","CNTBIR":"0000-00-00","CNTCSP":"","CNTCSP_REF":{"_title":""},"CNTFBDMAG":false,"CNTFNA":"jaricha","CNTLAN":"ENG","CNTLAN_REF":{"_title":"American","_description":"English - American"},"CNTLNA":"brian","CNTTTL":1,"CNTCRY":"","CNTCRY_REF":{"_title":""},"CNTFAX":"","CNTMOB":"","TCDEFFLG":true,"CNTTEL":"","WEB":"","_properties":{"CNT_CCNCRM":{"_isDisabled":true,"_isMandatory":true},"CNT_BPATYP":{"_isDisabled":true,"_isMandatory":true},"CNT_BPANUM":{"_isDisabled":true,"_isMandatory":true}}}],"CRN":"SA100025440","CRY":"ZA","CRY_REF":{"_title":"South Africa","_description":"South Africa"},"BPC_BPR_CUR":"ZAR","BPC_BPR_CUR_REF":{"_title":"Rand","_description":"South African Rand","_symbol":"","_scale":2,"_precision":13},"BPCBPRC_BPRNAM":["amathole"],"DOOFLG":false,"EECNUM":"","FCY":"","FCY_REF":{"_title":""},"LAN":"ENG","LAN_REF":{"_title":"American","_description":"English - American"},"LEGETT":false,"PPTFLG":false,"PRVFLG":false,"REPFLG":false,"_properties":{"REPCUR":{"_x3Format":""},"CUR":{"_x3Format":""},"BPCNUM":{"_isMandatory":true},"LAN":{"_isMandatory":true},"BPC_BPR_CUR":{"_x3Format":"","_isMandatory":true}},"BUS":"GOVERNMENT","BUS_REF":{"_title":""},"CHGTYP":1,"CLAINVTEX":null,"CLAORDTEX1":null,"COMCAT":1,"COTCHX":"","COTPITRQD":1,"CUR":"ZAR","CUR_REF":{"_title":"Rand","_description":"South African Rand","_symbol":"","_scale":2,"_precision":13},"BPCC_DIE":[{"_uuid":"29881481-c3bb-2249-b6ea-8c5ae893229f","CCE":"","CCE_REF":{"_title":""},"DIE":"AX5","DIE_REF":{"_title":"CUST","_description":"Customer"}},{"_uuid":"e2751f1c-419e-3449-beeb-63ded31646c4","CCE":"","CCE_REF":{"_title":""},"DIE":"AX6","DIE_REF":{"_title":"PROJECTS","_description":"Projects"}}],"BPCC_INVDTAAMT":[{"_uuid":"33d8fe50-47a0-2542-8398-f9f40bcc56a0","INVDTA":1,"INVDTAAMT":0,"INVDTACUR":"","INVDTACUR_REF":{"_title":""},"INVDTADES":"Discount %","INVDTATYP":3},{"_uuid":"2c605de6-662b-ec4b-addf-76f1025aa41f","INVDTA":7,"INVDTAAMT":0,"INVDTACUR":"ZAR","INVDTACUR_REF":{"_title":"Rand","_description":"South African Rand","_symbol":"","_scale":2,"_precision":13},"INVDTADES":"Discount Amo","INVDTATYP":1,"_properties":{"INVDTACUR":{"_x3Format":""}}}],"BPCC_TSCCOD":[{"_uuid":"008bc946-08fc-f440-b5eb-e0b386c95813","TSCCOD":"","TSCCOD_REF":{"_title":""},"TSCCODADI":31},{"_uuid":"0b527d11-1a0f-cd4e-88e4-a4070ea878ea","TSCCOD":"","TSCCOD_REF":{"_title":""},"TSCCODADI":32},{"_uuid":"e6d412e6-077a-0e4b-925e-30294f663a62","TSCCOD":"","TSCCOD_REF":{"_title":""},"TSCCODADI":33},{"_uuid":"d578ee7a-3dc5-3a4e-8194-b3639d1abf11","TSCCOD":"","TSCCOD_REF":{"_title":""},"TSCCODADI":0},{"_uuid":"e8c38636-5e63-124c-acb2-02fc25f8792a","TSCCOD":"","TSCCOD_REF":{"_title":""},"TSCCODADI":0}],"DEP":"","DEP_REF":{"_title":""},"DEP_LEG":"","DEP_LEG_REF":{"_title":""},"DIA":"","DME":1,"DUDCLC":1,"FCTNUM":"","FCTNUM_REF":{"_title":""},"FREINV":2,"FUPMINAMT":0,"FUPTYP":1,"GRP":"","GRP_REF":{"_title":""},"IME":6,"INVCND":"","INVPER":6,"INVTEX":"","LNDAUZ":false,"OCNFLG":false,"ODL":false,"ORDCLE":true,"ORDTEX":"","ORIPPT":"","ORIPPT_REF":{"_title":""},"OSTCTL":1,"PAYBAN":"","PITCDT":0,"PITCPT":1,"PRITYP":1,"PTE":"ZACOD","PTE_REF":{"_title":"COD","_description":"Cash on Delivery"},"PTE_LEG":"ZAF","PTE_LEG_REF":{"_title":"South Africa","_description":"South African legislation"},"SOIPER":1,"TOTPIT":1,"TPMCOD":"","UVYCOD2":"","VACBPR":"ZADOM","VACBPR_REF":{"_title":"Domestic","_description":"South African Domestic"},"VACBPR_LEG":"ZAF","VACBPR_LEG_REF":{"_title":"South Africa","_description":"South African legislation"},"VATEXN":"","BPCPITDEB":0,"CDTISR":0,"CDTISRDAT":"0000-00-00","NULPIO":false,"ORDMINAMT":0,"OST":771.42,"OSTAUZ":0,"REPCUR":"ZAR","REPCUR_REF":{"_title":"Rand","_description":"South African Rand","_symbol":"","_scale":2,"_precision":13}},'Invalid key rename');
        });


        it('should rename a key for mongo', function() {
            let val={_id:1,"val1":"x","testVal":{$in:["A","C"]}};

            val=$json.renameKey(val,(key, path) => {
                if (key==="_id"){
                    try{
                        $json.set(val,path, {$objectId:$json.get(val,path)});
                    }catch(exp){

                    }
                    return key;
                }else if (!$check.integer(key)&&!key.startsWith('$')) {
                    return 'data.' + key;
                }  else {
                    return key;
                }

            });
            assert.deepEqual(val,{_id:{$objectId:1},"data.val1":"x","data.testVal":{$in:["A","C"]}},'Invalid key rename');
        });

        it('should rename a string ', function() {
            let val="abc";

            val=$json.renameKey(val,(key,path)=>{
                if (key==="c")return "r";
                else if (key==="x")return "x2";
            });
            assert.deepEqual(val,'abc','Invalid key rename');
        });

    });

    describe('change value', function() {
        it('should not change value', function() {
            let val={a:{b:{c:1,d:2},x:'abc'}};

            val=$json.changeValue(val,(val,path)=>{
                return val;
            });
            assert.deepEqual(val,{a:{b:{c:1,d:2},x:'abc'}},'Invalid kchange val');
        });

        it('should change a value', function() {
            let val={a:{b:{c:1,d:2},x:'abc'}};

            val=$json.changeValue(val,(val,path)=>{
               if (val===2)return 20;
               else return val;
            });
            assert.deepEqual(val,{a:{b:{c:1,d:20},x:'abc'}},'Invalid key rename');
        });


        it('should change a value on array', function() {
            let val={a:{b:[{c:1,d:2},{c:2,d:5}],x:'abc'}};

            val=$json.changeValue(val,(val,path)=>{
                if (val===2)return 20;
                else return val;
            });
            assert.deepEqual(val,{a:{b:[{c:1,d:20},{c:20,d:5}],x:'abc'}},'Invalid key rename');
        });

        it('should change a string ', function() {
            let val="abc";

            val=$json.renameKey(val,(key,path)=>{
                if (val===2)return 20;
                else return val;
            });
            assert.deepEqual(val,'abc','Invalid key rename');
        });

    });

    describe('to iso string', function() {
        it('should convert an object to isostring', function() {

            let val={a:{b:{c:1,d:new Date("2017-01-01T23:45:45Z")},x:'2017-01-01'}};
            let walkedVals={};
            val=$json.convertDateTOISOString(val,function(value,path){
                walkedVals[path]=value;
            });
            assert.deepEqual(val,{a:{b:{c:1,d:"2017-01-01T23:45:45.000Z"},x:'2017-01-01'}},'Invalid walk');
        });

        it('should convert an array to isostring ', function() {

            let val=[{a:{b:{c:1,d:new Date("2017-01-01T23:45:45Z")},x:'2017-01-01'}},{a:{b:{c:1,d:new Date("2017-01-01T23:45:45Z")},x:'2017-01-01'}}];
            let walkedVals={};
            val=$json.convertDateTOISOString(val,function(value,path){
                walkedVals[path]=value;
            });
            assert.deepEqual(val,[{a:{b:{c:1,d:"2017-01-01T23:45:45.000Z"},x:'2017-01-01'}},{a:{b:{c:1,d:"2017-01-01T23:45:45.000Z"},x:'2017-01-01'}}],'Invalid walk');
        });
    });


    describe('fix for mongo', function() {
        it('should fix a object for mongo', function() {

            let val={"$a":{"b.a":{c:1,d:"xxx"},x:'2017-01-01'}};
            let walkedVals={};
            val=$json.fixForMongo(val,function(value,path){
                walkedVals[path]=value;
            });
            assert.deepEqual(val,{"_a":{"b_a":{c:1,d:"xxx"},x:'2017-01-01'}},'Invalid fix for mongo');
        });


        it('should fix a object for mongo with array', function() {

            let val={"$a":{"b.a":{c:1,d:"xxx"},$x:[{"$z.y":35},{"$z.y":45}]}};
            let walkedVals={};
            val=$json.fixForMongo(val,function(value,path){
                walkedVals[path]=value;
            });
            assert.deepEqual(val,{"_a":{"b_a":{c:1,d:"xxx"},_x:[{"_z_y":35},{"_z_y":45}]}},'Invalid fix for mongo');
        });

        it('should fix a object for mongo with array 2', function() {

            let val=[{"$a":{"b.a":{c:1,d:"xxx"}}},{$x:[{"$z.y":35},{"$z.y":45}]}];
            let walkedVals={};
            val=$json.fixForMongo(val,function(value,path){
                walkedVals[path]=value;
            });
            assert.deepEqual(val,[{"_a":{"b_a":{c:1,d:"xxx"}}},{_x:[{"_z_y":35},{"_z_y":45}]}],'Invalid fix for mongo');
        });

    });


});

const $check=require('check-types');
const jsonPointer=require('json-pointer');

class Magic{
    constructor(){}

    static parsePath(path,separator){
        if (!path)return null;
        if ($check.array(path))return path;
        if (!$check.string(path))throw new Error('Invalid type for path');

        let sep="/";
        if (separator){
            sep=separator;
        }else{
            if (count(path,'.')>count(path,'/')){
                sep=".";
            }else{
                sep="/";
            }
        }

        if (path.indexOf(sep)>-1){
            if (path.indexOf(sep)===0){
                path=path.substring(sep.length);
            }
            return path.split(sep);
        }else{
            return [path];
        }
    }

    static compilePath(path,seprator,ignoreLeading){
        if (!path)return path;
        if (!$check.array(path))throw new Error('Invalid type for path');
        let sep=seprator||"/";

        if (sep==='.'){
            return path.join('.');
        }else{
            return (ignoreLeading?"":sep) + path.join(sep);
        }

    }

    static has(obj,path){
        if (!obj)return false;
        let pathArr=Magic.parsePath(path);
        let curObj=obj;

        for (let attr of pathArr){
            if (!curObj[attr]){
                return false;
            }else{
                curObj=curObj[attr];
            }
        }
        return true;
    }

    /**
     * Lookup a value in an object by path
     *
     * @param {Object} obj
     * @param {String|Array} path
     * @param {String} separator
     * @returns {*}
     */
    static get (object,path,separator){
        if (!object)throw new Error('Invalid object for get');
        if (!$check.object(object)&&!$check.array(object))throw new Error('Invalid object for get');
        return jsonPointer.get(object,Magic.parsePath(path,separator));
    }

    static set(object,path,value){
        if (!object)throw new Error('Invalid object for set');
        if (!$check.object(object)&&!$check.array(object))throw new Error('Invalid object for set');
        return jsonPointer.set(object,Magic.parsePath(path),value);
    }

    static remove(object,path){
        if (!object)throw new Error('Invalid object for remove');
        if (!$check.object(object)&&!$check.array(object))throw new Error('Invalid object for remove');
        return jsonPointer.remove(object,Magic.parsePath(path));
    }

    static pathDict(object,separator){
        if (separator&&separator.toLowerCase()!=='/'){
            let dict=jsonPointer.dict(object);
            let newDict={};
            for (let k in dict){
                if (!dict.hasOwnProperty(k))continue;
                let newK=k.split('/');
                newK.shift();
                newDict[newK.join('.')]=dict[k];
            }
            return newDict;
        }else{
            return jsonPointer.dict(object);
        }

    }
    
    static pathArray(object,format){
        let dict=jsonPointer.dict(object);
        let newDict=[];

        for (let k in dict){
            if (!dict.hasOwnProperty(k))continue;
            if (format&&format.toLowerCase()==='dot'){
                let newK=k.split('/');
                newK.shift();
                newDict.push({
                    path:newK.join('.'),
                    value:dict[k]
                });
            }else{
                newDict.push({
                    path:k,
                    value:dict[k]
                });
            }
        }

        return newDict;
    }

    static walk(object,iterator,separator) {
        if (!object) return object;
        let sep = separator || "/";

        //if not an object or array, then base path
        if (!$check.object(object) && !$check.array(object)) {
            if (sep === '.') {
                return iterator(object, '');
            } else {
                return iterator(object, sep);
            }
        }

        return jsonPointer.walk(object,  (value, path)=> {
            let newPath = path;

            if (sep !== "/") {
                newPath = Magic.compilePath(Magic.parsePath(path, "/"), separator);
            }
            return iterator(value, newPath);
        });
    }

    static renameKey(object,renamer,separator){
        if (!object)return object;
        let sep=separator||"/";
        if (!renamer)return object;

        //if not an object or array, then base path
        if (!$check.object(object)&&!$check.array(object)){
            return object;
        }

        let renamePaths=[];

        const inner=(curObj,curPath,curKey)=>{
            if ($check.assigned(curKey)){
                let newKey=renamer(curKey,Magic.compilePath(curPath,sep));
                if (newKey&&newKey!==curKey){
                    renamePaths.push({
                        curPath:curPath,
                        newKey:newKey,
                        newPath:curPath.slice(0,curPath.length-1).concat([newKey])
                    });
                }
            }

            if ($check.array(curObj)){
                for (let i=0;i<curObj.length;i++) {
                    inner(curObj[i], curPath.concat(i), i);
                }
            }else if ($check.object(curObj)){
                for (let k in curObj){
                    if (!curObj.hasOwnProperty(k)) continue;
                    inner(curObj[k],curPath.concat(k),k);
                }
            }
        };

        inner(object,[],null);

        for (let renamePath of renamePaths){
            Magic.set(object,renamePath.newPath, Magic.get(object,renamePath.curPath));
        }

        let removePaths=renamePaths.sort((a,b)=>{
           if (a.curPath.length>b.curPath.length)return -1;
           if (a.curPath.length<b.curPath.length)return 1;
           return 0;
        });
        for (let removePath of removePaths){
            Magic.remove(object,removePath.curPath);
        }

        return object;
    }

    static changeValue(object,changer,separator){
        if (!object)return object;
        let sep=separator||"/";
        if (!changer)return object;

        //if not an object or array, then base path
        if (!$check.object(object)&&!$check.array(object)){
            return object;
        }

        let setPaths=[];

        Magic.walk(object,(val,path)=>{
            let newVal=changer(val,path);
            if (newVal!==val){
                setPaths.push({
                    path:path,
                    newVal:newVal
                });
            }
        },sep);

        for (let setPath of setPaths){
            Magic.set(object,setPath.path, setPath.newVal);
        }

        return object;
    }

    static convertDateTOISOString(object){
        Magic.walk(object,function(value,path){
            if ($check.date(value)){
                Magic.set(object,path,value.toISOString());
            }
        });

        return object;
    }

    static fixForMongo(object){
        return Magic.renameKey(object,(key,path)=>{
            if (!key)return key;
            if (!$check.string(key))return key;
            if (key.startsWith('$')){
                key='_' + key.substring(1);
            }
            key=key.replace(/\./g,'_');

            return key;
        });
    }

}

function makeString(object) {
    if (object == null) return '';
    return '' + object;
};


function count(str, substr) {
    str = makeString(str);
    substr = makeString(substr);

    if (str.length === 0 || substr.length === 0) return 0;

    return str.split(substr).length - 1;
}


module.exports=Magic;
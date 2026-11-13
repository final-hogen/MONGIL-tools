/**
 * 独自間数
 */
class MonMath{
  /**
   * 桁数調整
   * @param {number} num 数値
   * @param {number} c 桁
   * @returns 桁丸めた数値
   */
  static toFix(num,c=2){
    return Number(Number(num).toFixed(c));
  }
  /**
   * 配列の中身タス
   * @param {array} array 
   * @returns number
   */
  static plus(array){
    return array.reduce((acc, cur) => acc + cur, 0);
  }
  /**
   * %数値の配列の中身かける
   * @param {array} array 
   * @returns number
   */
  static multi(array){
    return (array.reduce((acc, cur) => acc * (1+(cur/100)), 1)*100)-100;
  }
  /**
   * 配列の中身かける(1足さない)
   * @param {array} array 
   * @returns number
   */
  static normalMulti(array){
    return array.reduce((acc, cur) => acc * (cur/100), 1)*100;
  }
  /**
   * 10%表記から 0.10 等に変更
   * @param {number} num 
   * @returns number
   */
  static toRate1(num){
    return (num/100)+1;
  }
  /**
   * 0.10 から10%表記 等に変更
   * @param {number} num 
   * @returns number
   */
  static toRate100(num){
    return (num-1)*100;
  }
  /**
   * 飽和計算
   * @param {number} value 飽和に使う値
   * @param {number} half   50%になる値
   * @param {number} rate   倍率
   * @returns 計算結果 0～1.0*rate
   */
  static saturate(value,half,rate=1){
    return (value*rate)/(value+half);
  }
  /**
   * オブジェクトデータの合体
   * @param  {...any} data 複数のデータ
   * @returns 合成結果
   */
  static merge(...data){
    const r = {};
    for(const d of data){
      for(const [key,value] of Object.entries(d)){
        if(r[key]===undefined)r[key] = value;
        else r[key] = r[key]  + value;
      }
    }
    return r;
  }
}

class CalcParameter{
  // 加重平均倍率(未定義は1)
  static limitValue={"通常":4/9,"SP":2/9,"ULT":1/9,"スイッチ":1/9,"サポート":1/9,"一般":0/9,"一回":0/9};
  static getLimitValue(name){
    const v = CalcParameter.limitValue[name];
    if(v===undefined)return 1;
    return v;
  }
  constructor(p1,ragulation,preset){
    this.ragulation = ragulation;
    this.preset = preset;
    this.makePparam(p1);
  }
  /**
   * プレイヤーパラメータデータ作成
   * @param {object} source 元データ
   */
  makePparam(source){
    this.data = structuredClone(source);
    this.master = Object.assign({},this.data.status.攻撃,this.data.status.防御,this.data.status.属性,this.data.status.サブ, this.data.character);
    const search = this.searchParameter(this.data);
    this.params = search;
    let max = -1;const keyPrefix = "クラス値";
    let job = keyPrefix+"ウォリアー";
    for(const [key,value] of Object.entries(source.status.サブ)){
      if(!key.startsWith("クラス値"))continue;
      if(value<=max)continue;
      max = value;
      job = key;
    }
    this.master[keyPrefix] = max;
    const name = this.master.name;
    const def = this.preset.character[name];
    if(!def){
      this.master.職業 = job.replace(keyPrefix,"");
    }else{
      this.master.職業 = def.job;
    }
  }
  /**
   * かぶりチェックに使うID作成
   * @param {object} paramData 一つのパラメータ
   * @returns 文字列 かぶりチェック不要の場合はnull
   */
  getDuplicateID(paramData){
    if(paramData.target=="個人")return null;
    const str = [paramData.rootkey,paramData.target,paramData.name,paramData.value].join(":");
    return str;
  }
  /**
   * パラメーターを探す
   * @param {object} data  Jsonデータ
   * @returns 見付けた配列
   */
  searchParameter(data){
    const result = this._searchParameter(data);
    return result;
  }
  /**
   * parameterを探す
   * @param {object} data Jsonデータ
   * @param {string} rootKey ルートのキー
   * @param {string} subkey サブのキー
   * @returns 見付けた配列
   */
  _searchParameter(data,rootKey=null,subkey=null){
    let result = [];
    if(!(data !== null && typeof data === 'object'))return result;

    for(const [key,value] of Object.entries(data)){
      if(key=="parameter"){
        const values = Object.values(value);
        for( const value of values ){
          value.value *= CalcParameter.getLimitValue(value.限定);
          value["rootkey"] = (!rootKey)?(key):(rootKey);
          value["subkey"] = (!subkey)?(""):(subkey);
          value["srcCharacter"] = this.data.character.name;
          value["itemname"] = data.name;
          value["dupid"] = this.getDuplicateID(value);
        }
        result = result.concat(values);
      }else{
        result = result.concat(this._searchParameter(value
          ,(!rootKey)?(key):(rootKey)
          ,(!subkey)?((!rootKey)?(null):(key)):(subkey)
        ));
      }
    }
    return result;
  }
  /**
   * 有効かどうかフィルタリングして返す
   * @param {object} mainMaster p1.masterデータ
   * @returns フィルタしたパラメータ
   */
  filterParameter(mainMaster=null){
    if(!mainMaster)mainMaster = this.master;
    let data = [];
    for(const p of this.params){
      if(this.isEnable(p,mainMaster,this.master))data.push(p);
    }
    return data;
  }
  /**
   * パラメータが有効か判定
   * @param {object} data パラメータデータ
   * @returns true:有効 false:無効
   */
  /**
   * パラメータが有効か判定
   * @param {object} data パラメータデータ
   * @param {object} mainMaster メインキャラのマスターデータ
   * @param {object} myMaster   チェックしている(メンバー)マスターデータ
   * @returns 
   */
  isEnable(data,mainMaster,myMaster){
    // リンクチェック
    if(data.subkey=="サブ1"&&data.リンク)return false;
    if(data.subkey=="サブ2"&&data.リンク)return false;

    //targetチェック
    switch(data.target){
      case "個人":
        if(mainMaster!==myMaster)return false;
        break;
      case "炎":case "氷":case "風":case "雷":case "地":
        if(mainMaster.属性!=data.target)return false;
        break;
      case "近距離":case "遠距離":
        const range = (data.target=="遠距離")?(1):(0);
        if(mainMaster.攻撃距離!=range)return false;
        break;
      case "異属近":
        if(mainMaster===myMaster)return false;
        if(mainMaster.属性==myMaster.属性||mainMaster.攻撃距離!=0)return false;
        break;
      case "異属遠":
        if(mainMaster===myMaster)return false;
        if(mainMaster.属性==myMaster.属性||mainMaster.攻撃距離!=1)return false;
        break;
    }
    
    return true;
  }
}
/**
 * 計算の基本クラス
 */
class CalcBase{
  /**
   * 初期化
   * @param {object} ragulation 
   * @param {CalcParameter} p1 
   * @param {CalcParameter} p2 
   * @param {CalcParameter} p3 
   */
  constructor(ragulation,p1,p2=null,p3=null){
    this.ragulation = ragulation;
    this.calc={}; //計算結果
    this.exchange={}; //計算結果
    this.result={}; //計算結果
    this.alltime = {} //常時発動合計
    this.current = this.calc;
    this.collision = {};  //かぶってるデータ
    this.p1= p1;  //p1が計算の主役
    this.p2 = p2;
    this.p3 = p3;
  }
  /**
   * 指定パラメータのvalue合計値を返す
   * @param {string} name パラメータ名
   * @param {array} params パラメータリスト
   * @returns 合計値(数値)
   */
  getParameter(name,params){
    let data = [];
    for(const p of params){
      if(p.name!=name)continue;
      if(!this.setAlltime(p,name,p.value)){
        data.push(p.value);
      }
    }
    return MonMath.plus(data);
  }
  /**
   * かぶりチェックして合体したパラメータ返す
   * @param {object} p1Params メインキャラパラメータリスト
   * @param {object} p2Params メンバーキャラパラメータリスト
   * @param {object} p3Params メンバーキャラパラメータリスト
   * @param {number} burst バーストモード1 なし0
   * @returns {p:パラメータリスト d:かぶったリスト e:変換パラメータ}
   */
  checkDuplicate(p1Params,p2Params=null,p3Params=null,burst=0){
    const exchangeKeys = new Set(Object.keys(this.p1.ragulation.math.exchange));
    const result=[];
    const exchange=[];
    const duplicate=new Set();
    const check = new Set();
    for(const p of p1Params){
      if((!burst)&&(p.バースト))continue;
      const id = p.dupid;
      if(id){
        if(check.has(id)){
          duplicate.add(id);
          continue;
        }
        check.add(id);
      }
      if(exchangeKeys.has(p.name))exchange.push(p);
      else result.push(p);
    }
    const array = (p2Params==null)?([]):((p3Params==null)?(p2Params):([...p2Params,...p3Params]));
    for(const p of array){
      if((!burst)&&(p.バースト))continue;
      const id = p.dupid;
      if(!id)continue
      if(check.has(id)){
        duplicate.add(id);
        continue;
      }
      check.add(id);
      if(exchangeKeys.has(p.name))exchange.push(p);
      else result.push(p);
    }

    return {"p":result,"e":exchange,"d":Array.from(duplicate)};
  }
  /**
   * コマンド実行
   * @param {object} com コマンド
   * @returns 
   */
  execComCalc(com){
    let v = 0;
    switch(com.com){
      default:throw new Error("unknown com: "+com.com);
      case "string":
        v = this.getComString(com);
        break;
      case "+":
        v = MonMath.plus(this.getComValues(com));
        break;
      case "-":
        v = 0-(MonMath.plus(this.getComValues(com)));
        break;
      case "*":
        v = MonMath.multi(this.getComValues(com));
        break;
      case "×":
        v = MonMath.normalMulti(this.getComValues(com));
        break;
      case "power":
        v = this.getComPower(com);
        break;
      case "saturate":
        v = this.getComSaturate(com);
        break;
      case "weight":
        v = this.getComWeight(com);
        break;
      case "revalltime":
        v = this.getComRevAlltime(com);
        break;
      case "burst":
        if(this.burst==0)return 0;
        else v = MonMath.plus(this.getComValues(com));
        break;
    }
    if(com.max!==undefined)v = Math.min(v,com.max);
    if(com.round!==undefined&&!!com.round)v = Math.round(v);
    if(com.name!==undefined)this.current[com.name] = v;
    return v;
  }
  /**
   * 常時発動の逆算
   * @param {object} com コマンド
   * @returns けっか
   */
  getComRevAlltime(com){
    const rev = MonMath.toRate1(MonMath.plus(this.getComValues(com)));
    const base = MonMath.plus(this.getThatValues(this.p1.master,com.base));
    let v = base / rev ;
    return v;
  }
  /**
   * 重みづけ計算
   * @param {object} com コマンド
   * @returns けっか
   */
  getComWeight(com){
    let v = 0;
    for(const [key,value] of Object.entries(com.weight)){
      v += this.current[key]*CalcParameter.getLimitValue(value);
    }
    return v;
  }
  /**
   * コマンド base * パラメータ*パラメータ*パラメータ*...
   * @param {object} com コマンド
   * @returns けっか
   */
  getComPower(com){
    const value = MonMath.multi(this.getComValues(com));
    const base = this.current[com.base];
    return base*MonMath.toRate1(value);
  }
  /**
   * コマンド飽和計算
   * @param {object} com コマンド
   * @returns けっか
   */
  getComSaturate(com){
    const value = MonMath.plus(this.getComValues(com));
    const half = MonMath.plus(this.getThatValues(this.current,com.half));
    const rate = MonMath.plus(this.getThatValues(this.current,com.rate));
    return MonMath.toRate100(MonMath.saturate(value,half,rate));
  }
  /**
   * コマンドパラメータ実行結果
   * @param {object} com コマンド
   * @returns 配列
   */
  getComValues(com){
    const r=[];
    for(const [key,names] of Object.entries(com)){
      switch(key){
        case "master":
          r.push(...this.getThatValues(this.p1.master,names));
          break;
        case "calc":case "exchange":case "result":case "alltime":
          r.push(...this.getThatValues(this[key],names));
          break;
        case "param":
          r.push(...this.getComParams(names));
          break;
        case "value":
          if(Array.isArray(names))r.push(...names);
          else r.push(names);
          break;
        case "sub":
          r.push(...this.getComExec(names));
          break;
      }
    }
    return r;
  }
  /**
   * その値を取ってくる
   * @param {object} that あれ
   * @param {array} list 取得する名前リスト
   * @returns 取得したデータ配列
   */
  getThatValues(that,list){
    if(!Array.isArray(list))list = [list];

    const r = [];
    for(const name of list){
      const pname = this.getComName(name);
      if(typeof pname==='string'){
        if(that[pname]!==undefined)r.push(that[pname]);
      }else{r.push(pname);}
    }
    return r;
  }
  /**
   * サブコマンドの実行
   * @param {array} list リスト
   * @returns 配列
   */
  getComExec(list){
    if(!Array.isArray(list))return [this.execComCalc(list)];
    const r = [];
    for(const com of list){
      r.push(this.execComCalc(com));
    }
    return r;
  }
  /**
   * 文字コマンド
   * @param {object} com コマンド
   * @returns 文字列
   */
  getComString(com){
    const r = this.getComValues(com);
    const sep = (com.separetor)?(com.separetor):("");
    return r.join(sep);
  }
  /**
   * com"master"の値取得
   * @param {array} list 名前リスト
   * @returns 合計値
   */
  getComParams(list){
    const r =[];
    for(const name of list){
      const n = this.getComName(name);
      if(typeof n==='string'){
        r.push(this.getParameter(n,this.params));
      }else{r.push(n);}
    }
    return r;
  }
  /**
   * 値の名前返す
   * @param {string,object} name  名前かコマンド 
   * @returns 名前
   */
  getComName(name){
    if(typeof name==='string')return name;
    if(typeof name === 'number')return name;
    return this.execComCalc(name);
  }
}
/**
 * メインキャラ一人だけ計算
 */
class CalcSinglePlayer extends CalcBase{
  constructor(ragulation,p1,p2=null,p3=null){
    super(ragulation,p1,p2,p3);
    this.duplicate = [];
    this.params = [];
    this.exchangeParams = [];
    this.burst = 0;
    this.master = this.p1.master;
  }
  /**
   * おひとり様データ計算
   * @param {object} p1 キャラのデータ
   * @param {object} ragulation レギュレーションファイル
   * @param {object} preset プリセットデータ
   * @param {number} burst バースト状態
   * @returns 計算結果 CalcParameter
   */
  static makeSingle(p1,ragulation,preset,burst=0){
    const calcParam = new CalcParameter(p1,ragulation,preset);
    const calc = new CalcSinglePlayer(ragulation,calcParam);
    calc.makeCalc(burst);
    calc.makeExchange({[calc.master.name]:calc.calc})
    calc.makeResult();
    
    return calc;
  }
  /**
   * 常時発動は数字を取っておく
   * @param {object} p パラメータ
   * @param {name} name 名前
   * @param {num} value 値
   * @returns true 常時効果 false それ以外
   */
  setAlltime(p,name,value){
    if(p.target!="常時")return false;
    if(this.alltime[name]===undefined)this.alltime[name]=0;
    this.alltime[name] = this.alltime[name]+value;
    return true;
  }
  /**
   * 計算結果を作る
   */
  makeCalc(burst=0){
    this.burst  = burst;
    const r = {}; // result
    this.current = this.calc = r;
    const p0 = this.p1;
    const master = p0.master;
    // 距離とか属性関係とか絞り込んだパラメータ
    const p0p = p0.filterParameter();
    const p2p = (!this.p2)?(null):(this.p2.filterParameter(master));
    const p3p = (!this.p3)?(null):(this.p3.filterParameter(master));
    // バフ被りチェック
    const checkDup = this.checkDuplicate(p0p,p2p,p3p,burst);
    this.params = checkDup.p;
    this.exchangeParams = checkDup.e;
    this.duplicate = checkDup.d;

    const mathCalc = this.ragulation.math.calc;
    for(const com of mathCalc){
      this.execComCalc(com);
    }
    return r;
  }
  /**
   * 変換系ぜんぶを計算
   * @param {object} namemap {name:calc}のマップ
   * @returns 計算結果
   */
  makeExchange(namemap){
    const r = {};
    this.current = this.exchange = r;
    for(const p of this.exchangeParams){
      const define = this.ragulation.math.exchange[p.name];
      const src = namemap[p.srcCharacter];
      const value = this.calcExchange(define,p,src);
      if(!this.setAlltime(p,define.output,value)){
        r[define.output] = value;
      }
    }
    return r;
  }
  /**
   * 変換計算
   * @param {object} define パラメータ定義
   * @param {object} p        パラメータ
   * @param {object} srcCalc パラメータ発動者の計算結果
   * @returns 計算結果
   */
  calcExchange(define,p,srcCalc){
    if(define.myinput)srcCalc = this.calc;
    let value = srcCalc[define.input];
    if(define.max!==undefined)value = Math.min(value,define.max);
    const rate = p.value/100.0;
    const result = value*rate;
    return result;
  }
  /**
   * 最終評価を計算
   * @returns 計算結果データ
   */
  makeResult(){
    const r = MonMath.merge(this.calc,this.exchange);
    this.current = this.result = r;
    
    const math = this.ragulation.math.result;
    for(const com of math){
      this.execComCalc(com);
    }

    return r;
  }
}

/**
 * 3人用計算
 */
class CalcMultiPlayer{
  static makeMulti(p1,p2,p3,ragulation,preset,burst){
    const r = new CalcMultiPlayer(p1,p2,p3,ragulation,preset);
    r.makeResult(burst);
    return r;
  }
  constructor(p1,p2,p3,ragulation,preset){
    const p1param = new CalcParameter(p1,ragulation,preset);
    const p2param = new CalcParameter(p2,ragulation,preset);
    const p3param = new CalcParameter(p3,ragulation,preset);
    const p1calc = new CalcSinglePlayer(ragulation,p1param,p2param,p3param);
    const p2calc = new CalcSinglePlayer(ragulation,p2param,p1param,p3param);
    const p3calc = new CalcSinglePlayer(ragulation,p3param,p2param,p1param);
    this.calc = {};
    this.param = {};
    this.duplicate = [];
    this.calc.p1 = p1calc;
    this.calc.p2 = p2calc;
    this.calc.p3 = p3calc;
    this.param.p1 = p1param;
    this.param.p2 = p2param;
    this.param.p3 = p3param;
  }
  /**
   * 結果取得
   */
  makeResult(burst=0){
    const p1 = this.calc.p1;
    const p2 = this.calc.p2;
    const p3 = this.calc.p3;
    p1.makeCalc(burst);
    p2.makeCalc(burst);
    p3.makeCalc(burst);
    const namemap = {
      [p1.master.name]:p1.calc,
      [p2.master.name]:p2.calc,
      [p3.master.name]:p3.calc,
    };
    p1.makeExchange(namemap);
    p2.makeExchange(namemap);
    p3.makeExchange(namemap);
    p1.makeResult();
    p2.makeResult();
    p3.makeResult();
    const duplicate = new Set(p1.duplicate,p2.duplicate,p3.duplicate);
    this.duplicate = Array.from(duplicate);
  }
}

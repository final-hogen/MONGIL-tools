/**
 * dpathを扱うためのクラス
 */
class DpathJson{
  constructor(jsonObject=new Object()){
    this.data = jsonObject;
  }
  /**
   * 下の階層まで複製
   * @returns コピーしたでーた
   */
  clone(){
    const cloned = structuredClone(this.data);
    return new DpathJson(cloned);
  }
  /**
   * dpathを解析用の配列に変換
   * @param {string} dpathString 
   * @returns 配列
   */
  static makePathArray(dpathString){
    if(!dpathString)return [];
    return dpathString.split('.')
  }
  /**
   * データ取り出し
   * @param {string} dpath dpath文字列
   */
  fetch(dpath){
    if(!dpath)return this.data;
    return DpathJson._fetch(0,DpathJson.makePathArray(dpath),this.data);
  }
  /**
   * 数値かテキストの状態で数値に変換してセットする
   * @param {string} dpath dpath文字列
   * @param {*} addData 追加するでーた
   */
  setText(dpath,addData){
    const num =(addData=="")?(NaN):(Number(addData));
    if(isNaN(num)){this.set(dpath,addData);}
    else{ this.set(dpath,num); }
  }
  /**
   * データついか(pathの途中がなければpathの途中も作る)
   * @param {string} dpath dpath文字列
   * @param {*} addData 追加するでーた
   */
  set(dpath,addData){
    //if(dpath===undefined||dpath=='undefined')throw Error("dpath undefined!"); //デバッグ用throw
    //if(!dpath&&(addData===null||typeof addData!=='object'))throw Error("addData undefined!");
    if(!dpath)this.data = addData;
    else DpathJson._set(0,DpathJson.makePathArray(dpath),this.data,addData);
  }
  /**
   * データの削除
   * @param {string} dpath dpath文字列
   */
  erase(dpath){
    if(!dpath){
      this.data = {};
    }
    else{
      let  array = DpathJson.makePathArray(dpath);
      const removed =array.pop();
      const parent = DpathJson._fetch(0,array,this.data);
      delete  parent[removed];
    }
  }
  /**
   * dpathに従ってデータを取り出す
   * @param {number} index dpath上の位置
   * @param {Array} dpathArray  dpath分解配列
   * @param {object} nowObject  取り出し対象
   * @returns 
   */
  static _fetch(index, dpathArray,nowObject){
    if(nowObject==null)return null;
    if(index>=dpathArray.length)return nowObject;
    let  obj = nowObject[dpathArray[index]];
    return DpathJson._fetch(index+1,dpathArray,obj)
  }
  /**
   * データついか(pathの途中がなければpathの途中も作る)
   * @param {number} index dpath上の位置
   * @param {Array} dpathArray dpath分解配列
   * @param {object} nowObject 取り出し対象
   * @param {*} addData 
   */
  static _set(index, dpathArray,nowObject,addData){
    const key = dpathArray[index];
    if(index>=(dpathArray.length-1)){
      nowObject[key] = addData;
      return;
    }
    let  check = nowObject[key];
    if(check==null){
      check = {};
      nowObject[key] = check;
    }
    DpathJson._set(index+1,dpathArray,check,addData);
  }
}

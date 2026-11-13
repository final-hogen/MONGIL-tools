
// シンプルなWeb上のデータ読み込み
class DataLoader {
  constructor() {
    this.loadingCount = 0;
    this.finishCallback = null;
  }
  /**
   * 非同期読み込み
   * @param {string} url 読み込みURL
   * @param {object} requestParam パラメータオブジェクトない時null
   * @param {string} callback コールバック関数文字列
   * @param {object} callbackParam コールバックの時に渡すパラメータ
   */
  _load(url, requestParam, callback, callbackParam){
    if(requestParam)url += '?'+ new URLSearchParams(requestParam).toString();
    const that = this;
    ++that.loadingCount;
    that._loading(that, url, callback, callbackParam);
  }
  async _loading(that, url, callback, callbackParam){
    const response = await fetch(url);
    const result = await response.text();
    if(callback)that[callback](result,callbackParam);
    if((--that.loadingCount)<=0){that['onFinish']();}
  }
  /**
   * データ読み込み
   * @param {string} url データのURL
   * @param {object}} onLoadPageに渡すパラメータ callbackParam
   * 終了後onLoadが呼ばれる
   */
  loadWeb(url, callbackParam=null){
    this._load(url,null,'onLoad',callbackParam);
  }
  /**
   * loadPageからの鵜読み込み完了コールバック
   * @param {読み込んだデータ} text 
   * @param {なし} loadDataに渡したパラメータ 
   */
  onLoad(text, params){
  }
  /**
   * 終了時呼び出しコールバックセット
   * @param {function} callback コールバック先
   */
  setFinish(callback){
    this.finishCallback  = callback;
  }
  /**
   * 読み込み中が無くなると呼ばれる
   */
  onFinish(){
    if(this.finishCallback)this.finishCallback();
  }
}

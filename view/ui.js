const XGD_API_KEY = "3a13661a8b28d104fdd1be5a35b96932";

/**
 * 自分専用エラー
 */
class MyCustomError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MyCustomError'; //
  }
}

/**
 * テンプレート扱うクラスの基底
 */
class MakeTemplateTag{
  /**
   * テンプレートから操作ノード作成
   * @param {Element} template テンプレート
   * @param {Element} makedNode ある場合は作成済みのノード
   */
  constructor(template,makedNode=null) {
    this.template = template;
    if(!makedNode){
      makedNode = template.cloneNode(true);
      makedNode.removeAttribute('id');
    }
    this.result = makedNode;
  }
  /**
   * dpath(入力フォームと対応するデータ位置attribute)設定
   * @param {string} myDpath 
   */
  setDpath(myDpath){
    this.result.setAttribute("dpath",myDpath);
  }
  /**
   * タグの内側にテキストを設定
   * @param {Element} node 設定対象
   * @param {string} text 設定内容
   * @param {string} fontSize フォントサイズ（任意）
   * @returns 
   */
  setInnnerText(node,text,fontSize=null){
    if(!node)return;
    if(fontSize)node.style.fontSize = fontSize;
    node.innerHTML = text;
  }
  /**
   * 新しい値設定
   * @param {Element} node 設定対象
   * @param {string} text 設定内容
   * @returns 
   */
  setInputValue(node,text){
    if(!node)return;
    node.value = text;
  }
  /**
   * ディスプレイスタイルを設定
   * @param {Element} node 設定対象
   * @param {*} displayValue "block"とか"none"
   * @returns 
   */
  setDisplay(node,displayValue){
    if(!node)return;
    node.style.display = displayValue;
  }
  /**
   * 透明度設定
   * @param {Element} node 設定対象
   * @param {number} opValue 0から1.0
   * @returns 
   */
  setOpacity(node,opValue){
    if(!node)return;
    node.style.opacity = opValue;
  }
  /**
   * 子要素全削除
   * @param {Element} parent 削除する要素の親ノード
   */
  removeChildAll(parent){
    while (parent.firstChild) {
      parent.removeChild(parent.firstChild);
    }
  }
  /**
   * タグに背景イメージを設定
   * @param {Element} node 設定対象
   * @param {string} imageURL 画像URL
   * @returns 
   */
  setBackgroundImage(node,imageURL){
    if(!node)return;
    node.style.backgroundImage = "url('"+imageURL+"')";
  }
}

// ページに引っ付いた処理の基本機能
class PageExecuter extends DataLoader {
  constructor() {
    super();
    this.template = {};
    this.data = new DpathJson();
    this.define = {};
    this.myRadarChart = {};

    this.settingFileNames = ["ragulation","preset"];//設定ファイル
    // sleep関数
    this.sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  }
  updateViewport() {
    // 画面の横幅が360px未満の場合、強制的に360px固定にする
    var width = (screen.width < 700) ? 700 : 'device-width';
    var content = 'width=' + width + ', initial-scale=1.0';
    document.querySelector('meta[name="viewport"]').setAttribute('content', content);
  }

  /**
   * ファイルを読み込んで呼び返す
   * @param {string} fileptahデータURL
   */
  loadSettings(){
    for(const name of this.settingFileNames){
      this.loadWeb(name+".json",name);
    }
  }
  /**
   * データ読み込み
   * 終了後onShortURLが呼ばれる
   */
  async loadShortURL(){
    this.sleep(100);
    navigator.clipboard.writeText(window.location.href);
    window.open("https://x.gd/","XGD");
    return;
    // API版はURLが長すぎるとダメらしい
    const myURL = window.location.href;
    const param = {"url":myURL,"key":XGD_API_KEY};
    const XGD_URL = 'https://xgd.io/V1/shorten';
    this._load(XGD_URL,param,'onShortURL',null);
  }
  /**
   * loadPageからの鵜読み込み完了コールバック
   * @param {string} loadData 読み込んだデータ
   * @param {object} params loadDataに渡したパラメータ
   */
  onLoad(text, params){
    switch(params){
      default:
        this.define[params] = JSON.parse(text);break;
    }
  }
  /**
   * 短縮URL用コールバック
   * @param {string} text レスポンス
   * @param {object} params null
   */
  onShortURL(text, params){
    const response = JSON.parse(text);
    console.log(response);
    switch(response.status){
      case 200:
        navigator.clipboard.writeText(response.shorturl);
        this.message("短縮URLをクリップボードにコピーしました");
        break;
      default:
        this.message("エラーが発生しました code:"+response.status+": "+response.message);
        break;
    }
  }
  /**
   * タグの値取得
   * @param {Element} tag HTMLタグ
   * @returns タグの値
   */
  getTagvalue(tag){
    return PageExecuter.getTagvalue(tag);
  }
  static getTagvalue(tag){
    if(!tag)return null;
    if(tag.tagName!="INPUT")return tag.value;
    switch(tag.type){
      case "radio":
        if(tag.checked)return tag.value;
        return this.getRadioValue(tag.name);
      case "checkbox":
        return (tag.checked)?(1):(0);
    }
    return tag.value;
  }
  /**
   * タグの値設定
   * @param {Element} tag タグ
   * @param {*} value 値
   */
  setTagvalue(tag,value){
    PageExecuter.setTagvalue(tag,value);
  }
  static setTagvalue(tag,value){
    if(!tag)return;
    if(tag.tagName!="INPUT"){
      tag.value = value;
    }else{
    switch(tag.type){
      case "radio":
        PageExecuter.setRadioValue(tag.name,value);
        break;
      case "checkbox":
        tag.checked = (value)?(true):(false);
        break;
      default:
        tag.value = value;
         break;
      }
    }
  }
  /**
   * 指定のdpathのタグ取得
   * @param {string} dpath ぱす
   * @returns タグ
   */
  getDpathTag(dpath){
    return PageExecuter.getUIDpathTags(dpath)[dpath];
  }
  /**
   * ラジオボタンの値設定
   * @param {string} name ラジオタグのname属性名
   * @param {*} value 設定する値
   */
  setRadioValue(name,value){
    PageExecuter.setRadioValue(name,value);
  }
  static setRadioValue(name,value){
    const selected = document.querySelector('input[name="'+name+'"][value="'+String(value)+'"]');
    selected.checked  = true;
  }
  /**
   * ラジオボタンの値取得
   * @param {string} name 
   * @returns 値
   */
  getRadioValue(name){
    const selectedRadio = document.querySelector('input[name="'+name+'"]:checked');
    if(!selectedRadio)return null;
    return selectedRadio.value;
  }
  /**
   * タグに背景イメージを設定
   * @param {Element} node 設定対象
   * @param {string} imageURL 画像URL
   * @returns 
   */
  setBackgroundImage(node,imageURL){
    if(!node)return;
    node.style.backgroundImage = "url('"+imageURL+"')";
  }
  /**
   * メッセージ表示
   * @param {string} text 
   */
  message(text){
    const dialog = document.getElementById('message_dialog');
    dialog.innerHTML = text;
    dialog.showModal();
    setTimeout(() => {
      if (dialog.open) {
        dialog.close();
      }
    }, 2500);
  }
  /**
   * datalist要素にリストを入れる
   * @param {string} tagid 要素のID
   * @param {Array} stringArray 入れるリスト
   */
  makeDatalist(tagid,stringArray){
    const datalistTag = document.getElementById(tagid);
    for(const name of stringArray){
      const newOption = document.createElement('option');
      newOption.value = name;
      datalistTag.appendChild(newOption);
    }
  }
  /**
   * dpathで始まるデータをHTMLからデータに引き上げる
   * @param {string} dpath 先頭一致dpath
   */
  uploadMultiDpath(dpath=""){
    this.data.erase(dpath); // 一旦削除

    const tags = this.getUIDpathTags(dpath);
    for(const[dpath,tag] of Object.entries(tags)){
      if(!dpath)continue;
      const value = this.getTagvalue(tag);
     this.data.setText(dpath,value);
    }
  }
  /**
   * でーたからすべてのUI更新
   * @param {object} source 全データ
   */
  downloadMultiDpath(dpath=""){

    const allDpathUI = this.getUIDpathTags(dpath);
    for(const[dpath,tag] of Object.entries(allDpathUI)){
      const data = this.data.fetch(dpath);
      if(data===null)continue;
    
      this.setTagvalue(tag,data);
    }
  }
  /**
   * dpathで始まるデータをタグ取得
   * @param {string} dpath 先頭一致dpath
   * @returns dpath名 - タグのセット
   */
  getUIDpathTags(dpath=null){
    return PageExecuter.getUIDpathTags(dpath);
  }
  static getUIDpathTags(dpath=null){
    let  query = "*[dpath]";
    if(!!dpath)query = '*[dpath^="'+dpath+'"]'  //始まり一致
    const items = document.querySelectorAll(query);
    let  result = {};
    items.forEach((item) => {
      const dpath = item.getAttribute("dpath");
      const type = item.getAttribute("type");
      if(!(type=="radio" && !item.checked)){
        result[dpath] = item;
      }
    });
    return result;
  }
  /**
   * 全データを回収
   */
  uploadAll(){
    this.uploadMultiDpath();
  }
  /**
   * クリップボードにコピー
   * @param {*} type 
   * @param {*} data 
   */
  copyToClipbord(type,data){
    const result = {};
    result["id"] = "HOGEN.MONGIL";
    result["type"] = type;
    result["data"] = data;
    const text = JSON.stringify(result);
    navigator.clipboard.writeText(text);
    this.message("クリップボードにコピーしました");
  }
  /**
   * クリップボードからデータた取り出し
   * @returns jsonでーた
   */
  async getFromClipbord(checkType){
    try{
      const text = await navigator.clipboard.readText();
      const jsonData = JSON.parse(text);
      if(jsonData["id"]!="HOGEN.MONGIL")throw new MyCustomError("このページのデータ形式ではありません");
      if(jsonData["type"]!=checkType)throw new MyCustomError("別の場所のデータです");
      return  jsonData["data"]
    }catch(e){
      if (e instanceof MyCustomError) {
        this.message(e.message);
      }else{
        this.message("利用できないデータです");
      }
      return null;
    }
  }
  /**
   * スコア表示
   * @param {string} id 
   * @param {値} value 
   */
  showScore(id,value){
    const tag = document.getElementById(id);
    tag.innerText = Math.round(value).toLocaleString();
  }
  static subitem_note = '<div width="100%" style="font-size: 0.6rem;">※攻撃=攻撃力×攻撃力増加、CRT=クリティカル率×クリティカルダメージ、属性=属性ダメージ増加×属性抵抗減少、防減=防御減少+貫通率<br/>※特別=ボスダメージ×弱点ダメージ×総合ダメージ×追加ダメージ×攻撃速度(×追い打ちダメージ)</div>'
  /**
   * characterの詳細に入れる表示作る
   * @param {string} areaid エリアのID
   * @param {object} result 計算結果のデータ
   */
  showSubitems(areaid,result){
    const area = document.getElementById(areaid);
    area.innerHTML = "";

    const ragulation = this.define.ragulation.graph.subitems;
    for(const [category,items] of Object.entries(ragulation)){
      const h2 = document.createElement("h2");
      h2.innerText = category;
      area.appendChild(h2);
      const subarea = document.createElement("div");
      subarea.setAttribute("class","resultitems");
      area.appendChild(subarea);
      for(const item of items){
        const table = document.createElement("table");
        const type = (!item.type)?(""):(item.type);
        const value = MonMath.toFix(result[item.result]);
        const innerHtml = `<table><tr><th>${item.name}</th></tr><tr><td class="${type}">${value}</td></tr></table>`;
        table.innerHTML = innerHtml;
        subarea.appendChild(table);
      }
      if(category=="グラフの数値"){
        area.insertAdjacentHTML("beforeend",PageExecuter.subitem_note);
      }
    }
  }
  async postShowGraph(){
    // なにもしない
  }
  /**
   * レーダーチャート用の値を取得
   * @param {object} mathResult 計算結果
   * @returns レーダーチャート用の値
   */
  getRadarValue(mathResult){
    const define = this.define.ragulation.graph.rader;
    const result = [];
    for(const p of define){
      result.push(MonMath.saturate(mathResult[p.value],p.half,p.rate));
    }
    return result;
  }
  /**
   * 計算結果をレーダーに
   * @param {object} mathResult 計算結果
   * @param {string} hId IDに使う頭文字
   */
  setRader(mathResult,id="Radar"){
    const d =  this.getRadarValue(mathResult);
    const oldChart = this.myRadarChart[id];
    if(oldChart){
      oldChart.data.datasets[0].data = d;
      oldChart.update();
      return;
    }
    const define = this.define.ragulation.graph.rader;
    const names = define.map(def => def.name);
    const r = {
  //グラフの種類
  type: 'radar',
  //データの設定
  data: {
    labels: names,
    datasets: [{
      //グラフのデータ
      data:d,
      // データライン
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth:1,
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
    }],
  },
  //オプションの設定
  options: {
    scales: {
      r: {
        //グラフの最小値・最大値
        min: 0, max: 1,
        //背景色
        backgroundColor: 'snow',
        //グリッドライン
        grid: {color: 'rgba(54, 72, 54, 0.2)',},
        //アングルライン
        angleLines: {color: 'rgba(54, 72, 54, 0.2)',},
        //各項目のラベル
        //pointLabels: {color: 'blue',},
        ticks: { //目盛り
          stepSize: 0.25,
          display: false,
        },
        pointLabels:{padding:0}
      },
    },
    elements: {point: {radius: 1}},
    plugins: {legend: {display: false}}
  },
};
    const ctx = document.getElementById(id);
    this.myRadarChart[id] = new Chart(ctx,r);  // データ保存用 var
  }
}

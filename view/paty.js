
// ページに引っ付いた処理
class PatyPageExecuter extends PageExecuter {
  constructor() {
    super();
  }
  /**
   * HTML上でDpathのデータを変更したときに呼ぶ
   * @param {string} dpath 
   * @param {string} value 
   */
  changeDpathUIData(dpath,value){
    switch(dpath){
      case "paty.comment":
        this.data.setText(dpath,value);
        break;
    }
  }
  /**
   * 顔画像設定
   * @param {string} name キャラクター名
   */
  setFaceImage(name,tagid="faceimage"){
    const define = this.define.preset.character[name];
    const faceUrl = (define)?(define["face"]):("face/にゃんこ.webp");
    const faceImage = document.getElementById(tagid);
    this.setBackgroundImage(faceImage,faceUrl);
  }
  /**
   * ボタンを押したときの処理
   * @param {*} buttonName 
   */
  pushButton(buttonName){
    switch(true){
      // 詳細ウインドウ
      case buttonName.endsWith(".view.button"):
        this.showbuttonSingle(buttonName);
        break;
      // データコピー
      case buttonName.endsWith(".copy.button"):
        this.copybuttonToClipbprd(buttonName);
        break;
      // データ貼り付け
      case buttonName.endsWith(".paste.button"):
        this.pastebuttonFromClipbprd(buttonName);
        break;
      // 短縮URL
      case "call.shortURL"==buttonName:
        this.loadShortURL();
        break;
    }
  }
  /**
   * コピーボタンからクリップボード作成
   * @param {String} buttonName ボタン名
   */
  showbuttonSingle(buttonName){
    const bname = buttonName.replace(".view.button","");
    this.openSingleWindow(bname);
  }
  /**
   * コピーボタンからクリップボード作成
   * @param {String} buttonName ボタン名
   */
  async copybuttonToClipbprd(buttonName){
    this.sleep(50);
    const bname = buttonName.replace(".copy.button","");
    if(bname!="paty")return;
    let dpath = bname;
    if(dpath=="paty")dpath="";
    const data = this.data.fetch(dpath);
    if(!data)return;
    this.copyToClipbord(bname, data);
  }
  /**
   * クリップボードからデータ貼り付け
   * @param {String} buttonName ボタン名
   */
  async pastebuttonFromClipbprd(buttonName){
    const bname = buttonName.replace(".paste.button","");
    let dpath = bname;
    if(dpath=="paty")dpath="";
    const data = await this.getFromClipbord((!dpath)?("paty"):("single"));
    if(!data)return;
    this.data.set(dpath,data);
    this.downLoadAll();
    await this.postUpdateURL();
  }
  /**
   * URLデータからデータインプット
   */
  async downloadFromURL(){
    const urlParams = new URLSearchParams(window.location.search);
    const monData = urlParams.get('monst');
    if(monData==null)return;
    const rev = await JsonCompresser.unzip(monData);
    this.data.data = rev;
    this.downLoadAll();
    this.setTitle();
  }
  /**
   * でーたからUI更新
   * @param {string} dpath 対象領域
   */
  downloadMultiDpath(dpath=""){
    this.setFaceImage(this.data.fetch("character.name"));
    super.downloadMultiDpath(dpath);
    this.postShowGraph();
  }
  /**
   * でーたからすべてのUI更新
   * @param {object} source 全データ
   */
  downLoadAll(){
    this.downloadMultiDpath();
  }
  uploadMultiDpath(dpath=""){
    //super.uploadMultiDpath(dpath);  //何もしない
  }
  /**
   * タグの値設定上書き
   * @param {Element} tag タグ
   * @param {*} value 値
   */
  setTagvalue(tag,value){
    const dpath = tag.getAttribute("dpath");
    const last = dpath.split(".").at(-1);
    switch(last){
      case "才能開花":
        tag.previousSibling.innerHTML="";
        for(let i=0;i<value;++i){
          tag.previousSibling.appendChild(document.createElement("div"));
        }
        break;
      case "属性":
        tag.previousSibling.style.backgroundImage = 'url(img/'+value+'.webp)';
        break;
      case "攻撃距離":
        tag.previousSibling.innerText = (value)?("遠距離"):("近距離");
        break;
    }
    super.setTagvalue(tag,value);
  }
  /**
   * URLアドレスをデータつきに更新する(非同期)
   */
  async postUpdateURL(){
    if(Object.keys(this.data.data).length<=0)return;
    const result = await JsonCompresser.gzip(this.data.data);
    const url = new URL(window.location);
    url.searchParams.set('monst', result);
    window.history.replaceState({}, '', url);
    this.setTitle();
  }
  /**
   * ページタイトル設定
   */
  setTitle(){
    let title = [this.data.fetch("p1.character.name"),this.data.fetch("p2.character.name"),this.data.fetch("p3.character.name")].join(" ");
    title = title.trim();
    if(!title)document.title =  "パーティーステータス";
    else document.title = title;
  }
  /**
   * グラフ表示をリクエスト
   */
  async postShowGraph(){
    const burst = (document.getElementById("burst_mode").checked)?(1):(0);
    const multi = CalcMultiPlayer.makeMulti(this.data.data.p1,this.data.data.p2,this.data.data.p3,this.define.ragulation, this.define.preset,burst);

    this.showGraph("p1",multi.calc.p1);
    this.showGraph("p2",multi.calc.p2);
    this.showGraph("p3",multi.calc.p3);

    this.showDuplicate(multi.duplicate);
  }
  /**
   * 指定キャラのグラフとか表示
   * @param {string} id p1～p3
   * @param {CalcSinglePlayer} calc p1～p3
   */
  showGraph(id,calc){
    const name = this.data.fetch(id+".character.name");
    if(!name)return;
    this.setFaceImage(name,id+".faceimage");

    this.setRader(calc.result,id+".Radar");
    this.showScore(id+".rスコア",calc.result["スコア"]);
    this.showSubitems(id+".result_subitems",calc.result);
  }
  /**
   * かぶりパラメータを表示
   * @param {array} duplicate かぶったもの
   */
  showDuplicate(duplicate){
    const tag = document.getElementById("duplicate_parameter");
    tag.innerHTML="";
    const mapName = {
      "monring": "モンぷらん",
      "equip": "装備",
      "skill": "スキルバフ"
    };
    for(const src of duplicate){
      const regex = new RegExp(Object.keys(mapName).join("|"), "g");
      const name = src.replace(regex, (matched) => mapName[matched]);
      const child = document.createElement("div");
      child.innerText = name;
      tag.appendChild(child);
    }
  }
  /**
   * ステータス詳細ウインドを開く
   * @param {string} id p1～p3
   */
  async openSingleWindow(id="p1"){
    const name = this.data.fetch(id+".character.name");
    if(!name)return;
    const p0 = this.data.fetch(id);
    const result = await JsonCompresser.gzip(p0);
    const url = new URL("./status.html",window.location);
    url.searchParams.set('monst', result);
    window.open(url.href,"_blank");
  }
}

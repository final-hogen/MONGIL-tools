
// ページに引っ付いた処理
class StatusPageExecuter extends PageExecuter {
  constructor() {
    super();

    // HTML上のIDなどやり取りに使用する名前の確認用
    this.view_names = ["character_view","status_view"]; //各項目の全体
    this.add_areas = ["status_template_area","status_parameter_area","add_style"];  //テンプレートの追加先エリア
    this.templateNames = ["status_template","status_parameter_template","parameter_style_template","parameter_template","skill_buf_template"]; //テンプレートの名前
    this.otherids = ["message_dialog","monst","faceimage","parameter_name_list","character_list","monring_list"]; //その他大勢

    this.init();
  }
  /**
   * 初期化処理
   */
  init(){
    for(const name of this.templateNames){
      this.template[name] = document.getElementById(name);
    }
  }
  /**
   * HTML上でDpathのデータを変更したときに呼ぶ
   * @param {string} dpath 
   * @param {string} value 
   */
  changeDpathUIData(dpath,value){
    switch(dpath){
      case "character.name":
        this.setCharacterName(value);break;
      case "monring.メイン.name":case "monring.サブ1.name":case "monring.サブ2.name":case "monring.伝説.name":
        this.setMonringName(dpath,value);break;
     case "equip.防具.name": case "equip.アーティファクト.name":
        this.setEquipName(dpath,value);break;
    }
    this.data.setText(dpath,value);
  }
  /**
   * キャラクター名再設定
   * @param {string} name 新しいキャラクター名
   * @returns 
   */
  setCharacterName(name){
    const define = this.define.preset.character[name];
    this.setFaceImage(name);
    if(!define)return;
    this.setRadioValue("才能開花",0);
    this.setRadioValue("属性",define["attribute"]);
    this.setRadioValue("攻撃距離",define["longrange"]);
    this.uploadMultiDpath("character");
  }
  /**
   * モンぷらん名前再設定
   * @param {string} dpath ex:monring.サブ2.name
   * @param {string} value 新しい名前
   */
  setMonringName(dpath,value){
    const baseDpath = dpath.replace(".name","");
    const preset = this.define.preset["monring"];
    const result = preset.filter(item => item.name == value);
    if(result.length<=0)return;
    const data = result[0];
    this.data.set(baseDpath,data);
    this.downLoadAll();
  }
  /**
   * 装備名前再設定
   * @param {string} dpath ex:equip.アーティファクト.name
   * @param {string} value 新しい名前
   */
  setEquipName(dpath,value){
    const baseDpath = dpath.replace(".name","");
    const split = baseDpath.split(".");
    const type = (split[1]=="アーティファクト")?("artifact"):("armor");
    const preset = this.define.preset[split[0]];
    const define = preset[type];
    const result = define.filter(item => item.name == value);
    if(result.length<=0)return;
    const data = result[0];
    this.data.set(baseDpath,data);
    this.downLoadAll();
  }
  /**
   * 顔画像設定
   * @param {string} name キャラクター名
   */
  setFaceImage(name){
    const define = this.define.preset.character[name];
    const faceUrl = (define)?(define["face"]):("face/にゃんこ.webp");
    const faceImage = document.getElementById("faceimage");
    this.setBackgroundImage(faceImage,faceUrl);
  }
  /**
   * プリセットデータの初期化
   */
  initPreset(){
    const preset = this.define["preset"];
    if(!preset)return;
    this.makeDatalist("character_list",Object.keys(preset["character"]));
    this.makeDatalist("monring_list",preset["monring"].map(obj => obj.name));
    this.makeDatalist("armor_list",preset.equip["armor"].map(obj => obj.name));
    this.makeDatalist("artifact_list",preset.equip["artifact"].map(obj => obj.name));
  }
  /**
   * ステータス領域初期化
   */
  initStatusData(){
    const ragulation = this.define["ragulation"];
    const allstatus = ragulation["status_data"];
    const subareaTemplate = this.template["status_template"];
    const parameterTemplate = this.template["status_parameter_template"];

    const viewArea = document.getElementById("status_template_area");

    const dpath = "status";
    for(const[key,substatus] of Object.entries(allstatus)){
        let  editor = new StatusSubAreaTag(subareaTemplate);
        let  newItem = editor.makeParameters(dpath, ragulation, parameterTemplate, key, substatus);
        viewArea.appendChild(newItem);
    }
  }
  /**
   * 追加のスタイル設定
   */
  initAddStyle(){
    const styleTemplateTag = this.template["parameter_style_template"];
    const addStyleArea = document.getElementById("add_style");
    const ragulation = this.define["ragulation"];
    const list = Object.keys(ragulation.parameter);

    let template = styleTemplateTag.innerHTML;
    let result = "";
    for(const name of list){
      let ren = template.replaceAll("@value",name);
      const define = ragulation.parameter[name];
      if(!define)continue;
      ren = ren.replaceAll("@icon",define.icon);
      const size = StatusParameterTag.getFontSize(name);
      ren = ren.replaceAll("@size",size);
      result += ren;
    }
    addStyleArea.innerHTML = result;
  }
  /**
   * パラメータの名前選択肢リスト初期化
   */
  initParameterNameList(){
    const ragulation = this.define["ragulation"];
    const template = this.template["parameter_template"];
    MonringParameterTemplate.initialize(template,ragulation);
    ArtifactParameterTemplate.initialize(template,ragulation);
    ArmorParameterTemplate.initialize(template,ragulation);
    SkillbufParameterTemplate.initialize(template,ragulation);
  }
  /**
   * ボタンを押したときの処理
   * @param {*} buttonName 
   */
  pushButton(buttonName){
    switch(true){
      case "skill.buf.add.button"==buttonName:
        this.pushButtonAddSkill(buttonName);
        break;
      //パラメータ追加
      case buttonName.endsWith(".parameter.add.button"):
        this.pushButtonAddParameter(buttonName);
        break;
      //パラメータ削除
      case buttonName.endsWith(".delete.button"):
        if(buttonName.includes("parameter")){
          this.pushButtonDeleteParameter(buttonName);
        }else{
          this.pushButtonDeleteSkill(buttonName);
        }
        break;
      // データコピー
      case buttonName.endsWith(".copy.button"):
        this.copybuttonToClipbprd(buttonName);
        break;
      // データ貼り付け
      case buttonName.endsWith(".paste.button"):
        this.pastebuttonToClipbprd(buttonName);
        break;
      // 短縮URL
      case "call.shortURL"==buttonName:
        this.loadShortURL();
        break;
    }
  }
  /**
   * スキルを追加
   * @param {string} buttonName 
   */
  pushButtonAddSkill(buttonName){
    const baseDpath = buttonName.replace(".add.button","");
    const area = document.getElementById(baseDpath);
    const tag = SkillBufTemplate.addTemplate(this.template["skill_buf_template"],area);
  }
  /**
   * もんぷらん追加ボタン処理
   * @param {string} buttonName ex:monring.メイン.parameter.add.button
   */
  pushButtonAddParameter(buttonName){
    const baseDpath = buttonName.replace(".add.button","");
    const area = document.getElementById(baseDpath);
    const tag = ParameterTemplate.addTemplate(this.template["parameter_template"],area,this.define.ragulation.parameter);
  }
  /**
   * パラメータの削除ボタン
   * @param {string} buttonName 
   */
  pushButtonDeleteParameter(buttonName){
    const dpath = buttonName.replace(".delete.button","");
    const tag = document.getElementById(dpath);
    const area = tag.parentElement;
    tag.remove();
    const baseDpath = area.getAttribute("id");
    ParameterTemplate.renumber(baseDpath,area);
    this.uploadMultiDpath(baseDpath);
  }
  /**
   * パラメータの削除ボタン
   * @param {string} buttonName 
   */
  pushButtonDeleteSkill(buttonName){
    const dpath = buttonName.replace(".delete.button","");
    const tag = document.getElementById(dpath);
    const area = tag.parentElement;
    tag.remove();
    const baseDpath = area.getAttribute("id");
    SkillBufTemplate.renumber(baseDpath,area);
    this.uploadMultiDpath(baseDpath);
  }
  /**
   * コピーボタンからクリップボード作成
   * @param {String} buttonName ボタン名
   */
  async copybuttonToClipbprd(buttonName){
    this.sleep(50);
    const bname = buttonName.replace(".copy.button","");
    let dpath = bname;
    if(dpath=="single")dpath="";
    const data = this.data.fetch(dpath);
    if(!data)return;
    this.copyToClipbord(bname, data);
  }
  /**
   * クリップボードからデータ貼り付け
   * @param {String} buttonName ボタン名
   */
  async pastebuttonToClipbprd(buttonName){
    const bname = buttonName.replace(".paste.button","");
    let dpath = bname;
    if(dpath=="single")dpath="";
    const data = await this.getFromClipbord(bname);
    if(!data)return;
    this.data.set(dpath,data);
    if(!dpath || dpath.startsWith("character"))this.setFaceImage(this.data.fetch("character.name"));
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
    this.downLoadAll(rev);
    this.uploadAll();
    const charaname = this.data.fetch("character.name");
    this.setFaceImage(charaname);
    this.postShowGraph();
    this.setWindowTitle(charaname);
  }
  /**
   * でーたからUI更新
   * @param {string} dpath 対象領域
   */
  downloadMultiDpath(dpath=""){
    if(!dpath || dpath.startsWith("monring"))this.preDownloadMonringParameter();
    if(!dpath || dpath.startsWith("equip"))this.preDownloadEquipParameter();
    if(!dpath || dpath.startsWith("skill"))this.preDownloadSkillParameter();
    super.downloadMultiDpath(dpath);
  }
  /**
   * でーたからすべてのUI更新
   * @param {object} source 全データ
   */
  downLoadAll(source=null){
    if(source!=null)this.data.data = source;
    this.downloadMultiDpath();
  }
  /** 枠用意 モンプラン */
  preDownloadMonringParameter(){
    const mainTags = ["メイン","サブ1","サブ2","伝説"];
    for(const areaName of mainTags){
      this.preDownloadParameter("monring."+areaName+".parameter");
    }
  }
  /** 枠用意 装備 */
  preDownloadEquipParameter(){
    const mainTags = ["アーティファクト","防具"];
    for(const areaName of mainTags){
      this.preDownloadParameter("equip."+areaName+".parameter");
    }
  }
  /** 枠用意 スキル */
  preDownloadSkillParameter(){
    const skillbuf = this.data.fetch("skill.buf");
    if(!skillbuf)return;
    const bufArea = document.getElementById("skill.buf");
    bufArea.innerHTML="";

    for(const areaName of Object.keys(skillbuf)){
      SkillBufTemplate.addTemplate(this.template["skill_buf_template"],bufArea);
      this.preDownloadParameter("skill.buf."+areaName+".parameter");
    }
  }
  /**
   * パラメータ枠を用意
   * @param {string} bassDpath パラメータ追加位置(ex:monring.メイン.paraeter)
   */
  preDownloadParameter(bassDpath){
    const source = this.data.fetch(bassDpath);
    if(!source)return;
    const paramKeys = Object.keys(source);
    if(paramKeys.length<=0)return;
    //追加
    const area = document.getElementById(bassDpath);
    area.innerHTML="";
    for(const key of paramKeys){
      ParameterTemplate.addTemplate(this.template["parameter_template"],area,this.define.ragulation.parameter);
    }
  }
  /**
   * URLアドレスをデータつきに更新する(非同期)
   */
  async postUpdateURL(){
    this.uploadAll();
    const result = await JsonCompresser.gzip(this.data.data);
    const url = new URL(window.location);
    url.searchParams.set('monst', result);
    window.history.replaceState({}, '', url);
    const charaname = this.data.fetch("character.name");
    this.setWindowTitle(charaname);

    this.postShowGraph();
  }
  /**
   * タイトル設定
   * @param {string} name 
   */
  setWindowTitle(name){
    if(!name)document.title =  "モンギル キャラクターステータス";
    else document.title = name;
  }
  /**
   * グラフ表示をリクエスト
   */
  async postShowGraph(){
    const calc = CalcSinglePlayer.makeSingle(this.data.data,this.define.ragulation,this.define.preset);
    this.setRader(calc.result);
    this.showScore("rスコア",calc.result["スコア"])
    this.showSubitems("result_subitems",calc.result);
    super.postShowGraph();
  }
}

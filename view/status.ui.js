
/**
 * パラメータテンプレートとデータからタグ作成
 */
class StatusParameterTag extends MakeTemplateTag{
  constructor(template,makedNode=null) {
    super(template,makedNode);
  }
  /**
   * JSONからタグを作成
   * @param {string} dpathRoot データパスおや
   * @param {string} name 表示名 ex:"攻撃力"
   * @param {object} jsonData 設定内容を持ったJSON
   * {"type":"number","min":"100","default":"2000","icon":"icon/攻撃力.webp"},
   * @returns 設定終わったタグ
   */
  setFromJson(dpathRoot,name,jsonData){
    const myDpath = dpathRoot+"."+name;
    this.setDpath(myDpath);
    this.setName(name);
    this.setIcon(jsonData["icon"]);
    this.setValue(jsonData["default"]);
    this.setType(jsonData["type"]);
    return this.result;
  }
  /**
   * データ入力ノード取得
   * @returns データ入力ノード
   */
  getValueNoe(){
    return this.result.querySelector("*[name='value']");
  }
  /**
   * dpath(入力フォームと対応するデータ位置attribute)設定
   * @param {string} myDpath 
   */
  setDpath(myDpath){
    let  valueNode = this.getValueNoe();
    valueNode.setAttribute("dpath",myDpath);
  }
  /**
   * タグにパラメータ名前を設定する
   * @param {string} text パラメータ名
   */
  setName(text){
    let  textNode = this.result.querySelector("*[name='name']");
    const fontSize = this.getFontSize(text);
    this.setInnnerText(textNode,text,fontSize);
  }
  /**
   * タグにパラメータ名前を設定する
   * @param {string} url URL
   */
  setIcon(url){
    let  iconNode = this.result.querySelector("*[name='icon']");
    this.setBackgroundImage(iconNode,url);
  }
  /**
   * タグにパラメータ名前を設定する
   * @param {number} numValue 数値 or null
   */
  setValue(numValue){
    if(!numValue)numValue = 0;
    let  valueNode = this.getValueNoe();
    this.setInputValue(valueNode,numValue);
  }
  /**
   * 数値種別を設定
   * @param {string} numType 今のところ"number"と"%"(デフォルト)
   */
  setType(numType){
    let  suffixNode = this.result.querySelector("*[name='suffix']");
    let  dispValue = 1;
    switch(numType){
      case "number":dispValue=0;break;
    }
    this.setOpacity(suffixNode,dispValue);
  }
  /**
   * 文字列から120pxで表示するフォントサイズを割り出す
   * @param {string} text 表示する文字
   * @returns 
   */
  getFontSize(text){
    return StatusParameterTag.getFontSize(text);
  }
  static getFontSize(text){
    const length = Array.from(text).length;
    if(length<=6)return "16px";
    if(length<=9)return "12px";
    return "9px";
  }
}

/**
 * ステータスのサブ(防具など)のエリア
 */
class StatusSubAreaTag extends MakeTemplateTag{
  constructor(template,makedNode=null) {
    super(template,makedNode);
    this.header = this.result.querySelector("H2");
    this.viewArea = this.result.querySelector("[class='status_parameter_area']");
  }
  /**
   * H2たぐに文字設定
   * @param {string} text もじ
   */
  setName(text){
    this.header.textContent = text;
  }
  /**
   * パラメータタグを作成して追加
   * @param {string} pathRoot dpathルート
   * @param {object} regulationJson レギュレーションデータ
   * @param {Element} patrameterTemplate パラメータタグのテンプレート
   * @param {string} name ヘッダに表示する名前
   * @param {Array} jsonData 追加するデータ名一覧
   */
  makeParameters(pathRoot,regulationJson, patrameterTemplate, name, jsonData){
    this.setName(name);
    const myDpath = pathRoot+"."+name;
    // this.setDpath(myDpath);枠はいらぬ

    this.removeChildAll(this.viewArea);
    const parameterDefine = regulationJson["parameter"];
    for(const dataName of jsonData){
      const define = parameterDefine[dataName];
      if(!define)continue;
        let  editor = new StatusParameterTag(patrameterTemplate);
        let  result = editor.setFromJson(myDpath,dataName,define);
        this.viewArea.appendChild(result);
    }
    return this.result;
  }
}

/**
 * パラメータ入力テンプレート
 */
class ParameterTemplate extends MakeTemplateTag{
  constructor(template,makedNode=null) {
    super(template,makedNode);
    this.selectName= this.result.querySelector('[name="name"]');
  }
  /**
   * パラメータ番号をセット
   * @param {number,string} number 
   */
  setNumber(baseDpath, number){
    let myBase = baseDpath+"."+String(number);
    this.result.setAttribute("id",myBase);
    myBase += ".";

    const targets = ["name","value","リンク","バースト","target","限定"];
    for(const name of targets){
      const tag = this.result.querySelector('[name="'+name+'"]');
      tag.setAttribute("dpath",myBase+name);
    }
    const deleteButton = this.result.querySelector('button');
    deleteButton.setAttribute("id",myBase+"delete.button")
  }
  /**
   * 名前変更リスナー追加
   * @param {*} parameterDefine 
   */
  addListener(parameterDefine){
    this.parameterDefine = parameterDefine;
    const that = this;
    const tag = this.selectName;
    tag.addEventListener("change",(event) => {
      that.onChangeName(event);
    });
  }
  /**
   * パラメータの名前が変更されたとき
   * デフォルトせっと
   * @param {Event} event 
   */
  onChangeName(event){
    const value = event.target.value;
    const define = this.parameterDefine[value];
    let defValue = define["default"]
    if(defValue!==undefined)this.setValue("value",defValue);
    defValue = define["target"]
    if(defValue!==undefined)this.setValue("target",defValue);
    defValue = define["限定"]
    if(defValue!==undefined)this.setValue("限定",defValue);
  }
  /**
   * UIに値をセット
   * @param {string} name パラメータのname属性
   * @param {*} value 設定する値
   */
  setValue(name,value){
    const tag = this.result.querySelector('[name="'+name+'"]');
    if(!tag)return;
    PageExecuter.setTagvalue(tag,value);
  }
  /**
   * データから設定
   * @param {object} jsonData 
   */
  setData(jsonData){
    for(const [name,data] of Object.entries(jsonData)){
      this.setValue(name,data);
    }
  }
  /**
   * 親にテンプレートを追加してParameterTemplate返す
   * @param {Element} template parameterテンプレート
   * @param {Element} parentTag   追加先
   * @param {object} parameterDefine   パラメータの定義(ragulation - parameter)
   * @returns 
   */
  static addTemplate(template, parentTag,parameterDefine){
    const baseDpath = parentTag.getAttribute("id");
    let result = null;
    switch(true){
      case baseDpath.startsWith("monring"):
        result = new MonringParameterTemplate(template);break;
      case baseDpath.startsWith("equip.アーティファクト"):
        result = new ArtifactParameterTemplate(template);break;
      case baseDpath.startsWith("equip.防具"):
        result = new ArmorParameterTemplate(template);break;
      case baseDpath.startsWith("skill.buf"):
        result = new SkillbufParameterTemplate(template);break;

      default:throw new Error("unknown type: ",target);
    }
    result.setNumber(baseDpath,parentTag.children.length);
    result.addListener(parameterDefine);
    parentTag.appendChild(result.result);
    return result;
  }
  /**
   * エリアのナンバーを振りなおす
   * @param {string} baseDpath 
   * @param {Element} parentTag 
   */
  static renumber(baseDpath,parentTag){
    for (let i = 0; i < parentTag.children.length; i++){
      const tag = new ParameterTemplate(null, parentTag.children[i]);
      tag.setNumber(baseDpath,i);
    }
  }
  /**
   * 専用名前セレクトボックス作る
   * @param {Element} template パラメータ全体のテンプレート
   * @param {object} ragulation レギュレーションファイル
   * @param {string} targetName 対象名(monring,equip,skillbuf)
   * @returns 作ったタグ
   */
  static makeSelectname(template,ragulation,targetName){
    const selectTemplate= template.querySelector('[name="name"]');
    const selectName = selectTemplate.cloneNode(false);  // 親要素のみ
    const list = ragulation.list[targetName];

    for(const[type,array] of Object.entries(list)){
      const group = document.createElement('optgroup');
      group.setAttribute("label",type);
      for(const name of array){
        const define = ragulation.parameter[name];
        if(!define)throw new Error("undefined parameter: ",name);
        const newOption = document.createElement('option');
        newOption.value = name;
        newOption.textContent = name;
        group.appendChild(newOption);
      }
      selectName.appendChild(group);
    }
    return selectName;
  }
}
/**
 * モンスターリング用パラメータ
 */
class MonringParameterTemplate extends ParameterTemplate{
  constructor(template,makedNode=null) {
    super(template,makedNode);
    if(!MonringParameterTemplate.selectName)throw Error("no define select template",this);
    const clone = MonringParameterTemplate.selectName.cloneNode(true);
    this.selectName.replaceWith(clone);
    this.selectName = clone;
  }
  static selectName = null;
  /**
   * 名前選択初期化
   * @param {Element} template パラメータ全体のテンプレート
   * @param {object} ragulation レギュレーションファイル
   */
  static initialize(template,ragulation){
    MonringParameterTemplate.selectName = ParameterTemplate.makeSelectname(template,ragulation,"monring");
  }
}
/**
 * 装備用パラメータ
 */
class ArtifactParameterTemplate extends ParameterTemplate{
  constructor(template,makedNode=null) {
    super(template,makedNode);
    if(!ArtifactParameterTemplate.selectName)throw Error("no define select template",this);
    const clone = ArtifactParameterTemplate.selectName.cloneNode(true);
    this.selectName.replaceWith(clone);
    this.selectName = clone;
  }
  static selectName = null;
  /**
   * 名前選択初期化
   * @param {Element} template パラメータ全体のテンプレート
   * @param {object} ragulation レギュレーションファイル
   */
  static initialize(template,ragulation){
    ArtifactParameterTemplate.selectName = ParameterTemplate.makeSelectname(template,ragulation,"artifact");
  }
}
/**
 * 装備用パラメータ
 */
class ArmorParameterTemplate extends ParameterTemplate{
  constructor(template,makedNode=null) {
    super(template,makedNode);
    if(!ArmorParameterTemplate.selectName)throw Error("no define select template",this);
    const clone = ArmorParameterTemplate.selectName.cloneNode(true);
    this.selectName.replaceWith(clone);
    this.selectName = clone;
  }
  static selectName = null;
  /**
   * 名前選択初期化
   * @param {Element} template パラメータ全体のテンプレート
   * @param {object} ragulation レギュレーションファイル
   */
  static initialize(template,ragulation){
    ArmorParameterTemplate.selectName = ParameterTemplate.makeSelectname(template,ragulation,"armor");
  }
}
/**
 * スキル用パラメータ
 */
class SkillbufParameterTemplate extends ParameterTemplate{
  constructor(template,makedNode=null) {
    super(template,makedNode);
    if(!SkillbufParameterTemplate.selectName)throw Error("no define select template",this);
    const clone = SkillbufParameterTemplate.selectName.cloneNode(true);
    this.selectName.replaceWith(clone);
    this.selectName = clone;
  }
  static selectName = null;
  /**
   * 名前選択初期化
   * @param {Element} template パラメータ全体のテンプレート
   * @param {object} ragulation レギュレーションファイル
   */
  static initialize(template,ragulation){
    SkillbufParameterTemplate.selectName = ParameterTemplate.makeSelectname(template,ragulation,"skillbuf");
  }
}

/**
 * スキルバフテンプレート
 */
class SkillBufTemplate extends MakeTemplateTag{
  constructor(template,makedNode=null) {
    super(template,makedNode);
  }
  /**
   * パラメータ番号をセット
   * @param {number,string} number 
   */
  setNumber(baseDpath, number){
    let myBase = baseDpath+"."+String(number);
    this.result.setAttribute("id",myBase);
    myBase += ".";  //ex : skill.buf.0.

    const nameTag = this.result.querySelector('[name="skillname"]');
    nameTag.setAttribute("dpath",myBase+"name");
    const areaTag = this.result.querySelector('[name="skilparameter_area"]');
    areaTag.setAttribute("id",myBase+"parameter");
    const deleteButton = this.result.querySelector('[name="skilldelete_button"]');
    deleteButton.setAttribute("id",myBase+"delete.button");
    const addButton = this.result.querySelector('[name="skillparameteradd_button"]');
    addButton.setAttribute("id",myBase+"parameter.add.button");
  }
  /**
   * データから設定
   * @param {object} jsonData 
   */
  setData(jsonData){
    for(const [name,data] of Object.entries(jsonData)){
      //this.setValue(name,data);
    }
  }
  /**
   * 親にテンプレートを追加してParameterTemplate返す
   * @param {Element} template parameterテンプレート
   * @param {Element} parentTag   追加先
   * @returns 
   */
  static addTemplate(template, parentTag){
    const baseDpath = parentTag.getAttribute("id");
    const result = new SkillBufTemplate(template);
    result.setNumber(baseDpath,parentTag.children.length);
    parentTag.appendChild(result.result);
    return result;
  }
  /**
   * エリアのナンバーを振りなおす
   * @param {string} baseDpath 
   * @param {Element} parentTag 
   */
  static renumber(baseDpath,parentTag){
    for (let i = 0; i < parentTag.children.length; i++){
      const tag = new SkillBufTemplate(null, parentTag.children[i]);
      tag.renumber(baseDpath+"."+String(i));
    }
  }
  /**
   * dpathの番号振りなおし
   * @param {string} dpath 新しいdpath
   */
  renumber(dpath){
    const oldDpath = this.result.getAttribute("id");
    this.result.setAttribute("id",dpath);
    this.replacePath("id",oldDpath,dpath);
    this.replacePath("dpath",oldDpath,dpath);
  }
  /**
   * dpathの親部分を入れ替える
   * @param {string} type   id or dpath
   * @param {string} oldPath 元のdpath ex:skill.buf.1
   * @param {string} newPath  変更後dpath ex:skill.buf.0
   */
  replacePath(type,oldPath,newPath){
    const ids = this.result.querySelectorAll("["+type+"]");
    ids.forEach((item) => {
      const oldid = item.getAttribute(type);
      const mydpath = oldid.replace(oldPath,newPath);
      item.setAttribute(type,mydpath);
    });
  }
}

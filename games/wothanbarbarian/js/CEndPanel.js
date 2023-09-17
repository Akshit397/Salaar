function CEndPanel(oSpriteBg){
    var _oTimeOut;
    
    var _oBg;
    var _oGroup;
    
    var _oMsgTextStroke;
    var _oMsgText;
    var _oScoreTextStroke;
    var _oScoreText;
    var _oButRestart;
    var _oButHome;
    
    var _oParent = this;
    
    this._init = function(oSpriteBg){
        
        _oTimeOut = setTimeout(function(){
            playSound("game_over",1,false);
            setVolume("soundtrack",0);
        },1000);
        
        _oBg = createBitmap(oSpriteBg);
        _oBg.on("click",function(){});
        
        _oMsgTextStroke = new createjs.Text(""," 70px "+FONT, "#410701");
        _oMsgTextStroke.x = CANVAS_WIDTH/2+2;
        _oMsgTextStroke.y = (CANVAS_HEIGHT/2)+65;
        _oMsgTextStroke.textAlign = "center";
        _oMsgTextStroke.textBaseline = "alphabetic";
        _oMsgTextStroke.lineWidth = 500; 
        
        _oMsgText = new createjs.Text(""," 70px "+FONT, "#ffb400");
        _oMsgText.x = CANVAS_WIDTH/2;
        _oMsgText.y = (CANVAS_HEIGHT/2)+65;
        _oMsgText.textAlign = "center";
        _oMsgText.textBaseline = "alphabetic";
        _oMsgText.lineWidth = 500;      
        
        _oScoreTextStroke = new createjs.Text(""," 40px "+FONT, "#410701");
        _oScoreTextStroke.x = CANVAS_WIDTH/2+2;
        _oScoreTextStroke.y = (CANVAS_HEIGHT/2) + 132;
        _oScoreTextStroke.textAlign = "center";
        _oScoreTextStroke.textBaseline = "alphabetic";
        _oScoreTextStroke.lineWidth = 500;
        
        _oScoreText = new createjs.Text(""," 40px "+FONT, "#ffb400");
        _oScoreText.x = CANVAS_WIDTH/2;
        _oScoreText.y = (CANVAS_HEIGHT/2) + 132;
        _oScoreText.textAlign = "center";
        _oScoreText.textBaseline = "alphabetic";
        _oScoreText.lineWidth = 500;
        
        _oButRestart = createBitmap(s_oSpriteLibrary.getSprite('but_restart'));
        _oButRestart.x = CANVAS_WIDTH/2+15;
        _oButRestart.y = CANVAS_HEIGHT/2+160;
        _oButRestart.cursor = "pointer";
        
        _oButHome = createBitmap(s_oSpriteLibrary.getSprite('but_home'));
        _oButHome.x = CANVAS_WIDTH/2-105;
        _oButHome.y = CANVAS_HEIGHT/2+160;
        _oButHome.cursor = "pointer";
        
        _oGroup = new createjs.Container();
        _oGroup.alpha = 0;
        _oGroup.visible=false;
        
        _oGroup.addChild(_oBg, _oScoreTextStroke, _oScoreText, _oMsgTextStroke, _oMsgText, _oButRestart, _oButHome);

        s_oStage.addChild(_oGroup);
    };
    
    this.unload = function(){
        if(_oButHome){
            _oButHome.off("mousedown",this._onExit);
            _oButRestart.off("mousedown",this._onRestart);
        }
        clearTimeout(_oTimeOut);
        stopSound("game_over");
        
    };
    
    this._initListener = function(){
        _oButHome.on("mousedown",this._onExit);
        _oButRestart.on("mousedown",this._onRestart);
    };
    
    this.show = function(iScore){
        setVolume("soundtrack",0);
        _oMsgTextStroke.text = TEXT_GAMEOVER;
        _oMsgText.text = TEXT_GAMEOVER;
        
        _oScoreTextStroke.text = TEXT_SCORE + iScore;
        _oScoreText.text = TEXT_SCORE + iScore;
        
        _oGroup.visible = true;
        
        createjs.Tween.get(_oGroup).to({alpha:1 }, 500).call(function() {
            setTimeout(function(){
                setVolume("soundtrack",1);
            },3500);
            _oParent._initListener();
        });
        
        $(s_oMain).trigger("share_event",[iScore]);
        $(s_oMain).trigger("save_score",[iScore]);
    };
    
    this._onExit = function(){
        _oParent.unload();
        setVolume("soundtrack",1);
        s_oStage.removeChild(_oGroup);
        
        s_oGame.onExit();
        
    };
    
    this._onRestart = function(){
        _oParent.unload();

        s_oStage.removeChild(_oGroup);
        stopSound("ceiling");
        stopSound("game_over");
        setVolume("soundtrack",1);
        s_oGame.onRestart();
    };
    
    this._init(oSpriteBg);
    
    return this;
}

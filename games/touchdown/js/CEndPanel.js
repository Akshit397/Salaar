function CEndPanel(){
    var _iStartY;
    var _iEventToLaunch;
    var _aCbCompleted;
    var _aCbOwner;
    var _oListener;
    
    var _oFade;
    var _oTitleText;
    var _oTotScoreText;
    var _oButHome;
    var _oButRestart;
    var _oContainer;
    var _oContainerPanel;
    
    var _oThis = this;

    
    this._init = function(){
        _aCbCompleted=new Array();
        _aCbOwner =new Array();
        
        _oContainer = new createjs.Container();
        _oContainer.visible = false;
        s_oStage.addChild(_oContainer);
        
        _oFade = new createjs.Shape();
        _oFade.graphics.beginFill("black").drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        _oFade.alpha = 0;
        _oListener = _oFade.on("click", function () {});
        _oContainer.addChild(_oFade);
        
       
       
        _oContainerPanel = new createjs.Container();
        _oContainerPanel.x = CANVAS_WIDTH/2;
        _oContainer.addChild(_oContainerPanel);
        
        var oSpriteBg = s_oSpriteLibrary.getSprite("msg_box_wide");
        var oBg = createBitmap(oSpriteBg);
        _oContainerPanel.addChild(oBg);
        
        _oTitleText = new CTLText(_oContainerPanel, 
                    0, 0, oSpriteBg.width, 120, 
                    80, "center", "#ffffff", FONT_GAME, 1,
                    40, 10,
                    "",
                    true, true, true,
                    false );
        
        _oTotScoreText = new CTLText(_oContainerPanel, 
                    0, oSpriteBg.height/2-60, oSpriteBg.width, 80, 
                    80, "center", "#ffffff", FONT_GAME, 1,
                    40, 10,
                    "",
                    true, true, true,
                    false );
        
        _oButHome = new CGfxButton(oSpriteBg.width/2 - 250,oSpriteBg.height/2 + 120,s_oSpriteLibrary.getSprite("but_home"),_oContainerPanel);
        _oButHome.addEventListener(ON_MOUSE_UP,this._onHome,this);
        
        _oButRestart = new CGfxButton(oSpriteBg.width/2 + 250,oSpriteBg.height/2+120,s_oSpriteLibrary.getSprite("but_restart"),_oContainerPanel);
        _oButRestart.addEventListener(ON_MOUSE_UP,this._onRestart,this);
        
        _iStartY = -oSpriteBg.height/2;
        
        _oContainerPanel.regX = oSpriteBg.width/2;
        _oContainerPanel.regY = oSpriteBg.height/2;
    };
    
    this.unload = function(){
        _oButHome.unload();
        _oButRestart.unload();
        
        _oFade.off("click", _oListener);
    };
    
    this.addEventListener = function( iEvent,cbCompleted, cbOwner ){
        _aCbCompleted[iEvent]=cbCompleted;
        _aCbOwner[iEvent] = cbOwner; 
    };
    
    this.show = function(iTotScore,szTitle){
        setVolume("soundtrack",0);
        var oSound;
        if(szTitle === TEXT_CONGRATS){
            oSound = playSound("level_win",1,false);
        }else{
            oSound = playSound("game_over",1,false);
        }
        
        oSound.on('end', function(){
            setVolume("soundtrack",1);
        });

        _oTitleText.refreshText( szTitle);
        _oTotScoreText.refreshText( TEXT_SCORE+": "+iTotScore);
        
        _oFade.alpha=0;
        _oContainerPanel.y = _iStartY;
        _oContainer.visible = true;
        
        createjs.Tween.get(_oFade).to({alpha:0.7}, 500);
        createjs.Tween.get(_oContainerPanel).wait(400).to({y:CANVAS_HEIGHT/2}, 1000,createjs.Ease.bounceOut).call(function(){_oThis.enableButtons();});;
    };
    
    this.hide = function(){
        createjs.Tween.get(_oContainerPanel).to({y:_iStartY}, 1000,createjs.Ease.backIn).call(function(){
                                                                                                        _oContainer.visible = false;
                                                                    
                                                                                                        if(_aCbCompleted[_iEventToLaunch]){
                                                                                                            _aCbCompleted[_iEventToLaunch].call(_aCbOwner[_iEventToLaunch]);
                                                                                                        }
                                                                })
    };
    
    this.enableButtons = function(){
        _oButHome.enable();
        _oButRestart.enable();
    };
    
    this.disableButtons = function(){
        _oButHome.disable();
        _oButRestart.disable();
    };
    
    this._onHome = function(){
        _oThis.disableButtons();
        
        _iEventToLaunch = ON_BACK_MENU;
        
        _oThis.hide();
    };
    
    this._onRestart = function(){
        _oThis.disableButtons();
        
        $(s_oMain).trigger("show_interlevel_ad");
        
        _iEventToLaunch = ON_RESTART;
        
        _oThis.hide();
    };
    
    this._init();
}

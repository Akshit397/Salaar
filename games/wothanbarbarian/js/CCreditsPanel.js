function CCreditsPanel(){
    
    var _oBg;
    var _oButLogo;
    var _oButExit;
    var _oMsgText;
    
    var _oHitArea;
    
    var _oLink;
    
    var _oListener;
    var _pStartPosExit;
    
    this._init = function(){
        
        _oBg = createBitmap(s_oSpriteLibrary.getSprite('credits_panel'));
        s_oStage.addChild(_oBg);
        
        _oHitArea = new createjs.Shape();
        _oHitArea.graphics.beginFill("#0f0f0f").drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        _oHitArea.alpha = 0.01;
        _oListener = _oHitArea.on("click", this._onLogoButRelease);
        s_oStage.addChild(_oHitArea);
                
        var oSprite = s_oSpriteLibrary.getSprite('but_exit');
        _pStartPosExit = {x: CANVAS_WIDTH - (oSprite.height/2)- 100, y: 300};
        _oButExit = new CGfxButton(_pStartPosExit.x, _pStartPosExit.y, oSprite, s_oStage);
        _oButExit.addEventListener(ON_MOUSE_UP, this.unload, this);
       
        _oMsgText = new CFormatText(CANVAS_WIDTH/2, 430, TEXT_CREDITS_DEVELOPED, "#ffb400", s_oStage, "#410701", 40);
		
        oSprite = s_oSpriteLibrary.getSprite('logo_credits');
        _oButLogo = createBitmap(oSprite);
        _oButLogo.regX = oSprite.width/2;
        _oButLogo.regY = oSprite.height/2;
        _oButLogo.x = CANVAS_WIDTH/2;
        _oButLogo.y = 560;
        s_oStage.addChild(_oButLogo);
        
        _oLink = new CFormatText(CANVAS_WIDTH/2, 690, TEXT_LINK1, "#ffb400", s_oStage, "#410701", 40);
       
    };
    
    this.unload = function(){
        _oHitArea.off("click", _oListener);
        
        _oButExit.unload(); 
        _oButExit = null;
        
        _oMsgText.unload();
        
        _oLink.unload();

        s_oStage.removeChild(_oBg);
        s_oStage.removeChild(_oButLogo);
        s_oStage.removeChild(_oHitArea);
    };
    
    this._onLogoButRelease = function(){
        window.open("http://www.codethislab.com/index.php?&l=en");
    };
    
    this._init();
    
    
};



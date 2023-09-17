function CInterface(iScore){
    var _pStartPosAudio;
    var _pStartPosExit;
    var _pStartPosScore;
    var _pStartPosLevel;
    var _pStartPosFullscreen;
    var _pStartPosLeft;
    var _pStartPosRight;
    var _pStartPosJump;
    var _oRollingScore;
	
    var _oAmountScoreText;
    var _oScoreText;
    var _oLevelText;
    var _oButExit;
    var _oPowerUpGUI;
    var _oAudioToggle;
    var _oButFullscreen;
    var _oButLeft;
    var _oButRight;
    var _oButJump;
    var _fRequestFullScreen = null;
    var _fCancelFullScreen = null;
    var _oGUIExpandible;
    var _oAreYouSurePanel;
    var _oFpsText;
    
    this._init = function(iScore){ 
        if(!s_bMobile) {
            //KEY LISTENER
            document.onkeydown   = s_oGame.onKeyDown;
            document.onkeyup   = s_oGame.onKeyUp;
        }else{
            var oSpriteLeft = s_oSpriteLibrary.getSprite("but_left");
            _pStartPosLeft = {x:oSpriteLeft.width/2 + 150,y:CANVAS_HEIGHT-oSpriteLeft.height/2 -20};
            _oButLeft = new CGfxButton(_pStartPosLeft.x,_pStartPosLeft.y,oSpriteLeft,s_oStage);
            _oButLeft.addEventListener(ON_MOUSE_DOWN,this._onLeftDown,this);
            _oButLeft.addEventListener(ON_MOUSE_UP,this._onLeftUp,this);
            
            var oSpriteRight = s_oSpriteLibrary.getSprite("but_right");
            _pStartPosRight = {x:CANVAS_WIDTH - oSpriteRight.width/2 - 150,y:CANVAS_HEIGHT-oSpriteRight.height/2 -20};
            _oButRight = new CGfxButton(_pStartPosRight.x,_pStartPosRight.y,oSpriteRight,s_oStage);
            _oButRight.addEventListener(ON_MOUSE_DOWN,this._onRightDown,this);
            _oButRight.addEventListener(ON_MOUSE_UP,this._onRightUp,this);
            
            var oSpriteJump = s_oSpriteLibrary.getSprite("but_jump");
            _pStartPosJump = {x:CANVAS_WIDTH/2,y:CANVAS_HEIGHT-oSpriteJump.height/2 -20};
            _oButJump = new CGfxButton(_pStartPosJump.x,_pStartPosJump.y,oSpriteJump,s_oStage);
            _oButJump.addEventListener(ON_MOUSE_DOWN,this._onJumpDown,this);
            _oButJump.addEventListener(ON_MOUSE_UP,this._onJumpUp,this);
        }
        
        var oSprite = s_oSpriteLibrary.getSprite('but_exit');
	_pStartPosExit = {x:CANVAS_WIDTH - (oSprite.width/2) -10,y:(oSprite.height/2) +10};
        _oButExit = new CGfxButton(_pStartPosExit.x,_pStartPosExit.y,oSprite,s_oStage);
        _oButExit.addEventListener(ON_MOUSE_UP, this._onExit, this);

        if(DISABLE_SOUND_MOBILE === false || s_bMobile === false){
            _pStartPosAudio = {x:_pStartPosExit.x - oSprite.width,y:_pStartPosExit.y}
            var oSprite = s_oSpriteLibrary.getSprite('audio_icon');
            _oAudioToggle = new CToggle(_pStartPosAudio.x,_pStartPosAudio.y,oSprite,s_bAudioActive,s_oStage);
            _oAudioToggle.addEventListener(ON_MOUSE_UP, this._onAudioToggle, this);
            
            _pStartPosFullscreen = {x: _pStartPosAudio.x - oSprite.width/2,y:_pStartPosAudio.y};
        }else{
            _pStartPosFullscreen = {x:_pStartPosExit.x - oSprite.width,y:_pStartPosExit.y}
        }
        
        var doc = window.document;
        var docEl = doc.documentElement;
        _fRequestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
        _fCancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
        
        if(ENABLE_FULLSCREEN === false){
            _fRequestFullScreen = false;
        }
        
        if (_fRequestFullScreen && screenfull.isEnabled){
            oSprite = s_oSpriteLibrary.getSprite('but_fullscreen');
            

            _oButFullscreen = new CToggle(_pStartPosFullscreen.x,_pStartPosFullscreen.y,oSprite,s_bFullscreen,s_oStage);
            _oButFullscreen.addEventListener(ON_MOUSE_UP, this._onFullscreenRelease, this);
        }
        
        var oSprite = s_oSpriteLibrary.getSprite('but_settings');
        _oGUIExpandible = new CGUIExpandible(_pStartPosExit.x, _pStartPosExit.y, oSprite, s_oStage);
        _oGUIExpandible.addButton(_oButExit);
        
        if(DISABLE_SOUND_MOBILE === false || s_bMobile === false){
            _oGUIExpandible.addButton(_oAudioToggle);
        }
        
        if (_fRequestFullScreen && screenfull.isEnabled){
            _oGUIExpandible.addButton(_oButFullscreen);
        }
        
        
        _pStartPosScore = {x:10,y:40};
        
        _oScoreText = new createjs.Text(TEXT_SCORE,"40px "+FONT_GAME, "#fff");
        _oScoreText.x = _pStartPosScore.x;
        _oScoreText.y = _pStartPosScore.y;
        _oScoreText.textBaseline = "alphabetic";
        _oScoreText.textAlign = "left";
        _oScoreText.shadow = new createjs.Shadow("#000000", 2, 2, 5);
        s_oStage.addChild(_oScoreText);
        
        _oAmountScoreText = new createjs.Text(iScore,"40px "+FONT_GAME, "#fff");
        _oAmountScoreText.x = _oScoreText.x +20;
        _oAmountScoreText.y = _pStartPosScore.y;
        _oAmountScoreText.textBaseline = "alphabetic";
        _oAmountScoreText.textAlign = "left";
        _oAmountScoreText.shadow = new createjs.Shadow("#000000", 2, 2, 5);
        s_oStage.addChild(_oAmountScoreText);

        
        _pStartPosLevel = {x:CANVAS_WIDTH/2,y:40};
        _oLevelText = new createjs.Text(TEXT_LEVEL + " " + s_iLevelSelected,"40px "+FONT_GAME, "#fff");
        _oLevelText.x = _pStartPosLevel.x;
        _oLevelText.y = _pStartPosLevel.y;
        _oLevelText.textBaseline = "alphabetic";
        _oLevelText.textAlign = "center";
        _oLevelText.shadow = new createjs.Shadow("#000000", 2, 2, 5);
        s_oStage.addChild(_oLevelText);
        
        
        
        _oPowerUpGUI = new CPowerUpGui(s_oStage);
        
        _oAreYouSurePanel = new CAreYouSurePanel();
        _oAreYouSurePanel.addEventListener(ON_BUT_YES_DOWN,this._onExitYes,this);
        
        _oRollingScore = new CRollingScore();
        
	this.refreshButtonPos();		
    };
    
    this.unload = function(){
        _oButExit.unload();
        _oButExit = null;
        _oGUIExpandible.unload();
        _oAreYouSurePanel.unload();
        
        if(DISABLE_SOUND_MOBILE === false){
            _oAudioToggle.unload();
            _oAudioToggle = null;
        }
        
        if (_fRequestFullScreen && screenfull.isEnabled){
            _oButFullscreen.unload();
        }
        
       
        if(!s_bMobile) {
            //KEY LISTENER
            document.onkeydown   = null;
            document.onkeyup   = null;
        }else{
            _oButLeft.unload();
            _oButRight.unload();
            _oButJump.unload();
        }
        
        
        s_oStage.removeAllChildren();
	s_oInterface = null;
    };
    
    this.reset = function(iScore,iLevel){
        _oAmountScoreText.text =  iScore;
        _oLevelText.text = TEXT_LEVEL + " " + iLevel;
        _oPowerUpGUI.reset();
    };
	
    this.refreshButtonPos = function(){
        _oScoreText.x = _pStartPosScore.x + s_iOffsetX;
        _oScoreText.y = _pStartPosScore.y + s_iOffsetY;
        
        _oAmountScoreText.x = _oScoreText.x + _oScoreText.getBounds().width + 20;
        _oAmountScoreText.y = _oScoreText.y;
        _oLevelText.y = _pStartPosLevel.y + s_iOffsetY;

        _oGUIExpandible.refreshPos();
        
        if(s_bMobile){
            _oButLeft.setPosition(_pStartPosLeft.x + s_iOffsetX,_pStartPosLeft.y - s_iOffsetY);
            _oButRight.setPosition(_pStartPosRight.x - s_iOffsetX,_pStartPosRight.y - s_iOffsetY);
            _oButJump.setPosition(_pStartPosJump.x,_pStartPosJump.y - s_iOffsetY);
        }
        
        _oPowerUpGUI.refreshButtonPos();
    };
    
    this.refreshScore = function(iScore){
        _oRollingScore.rolling(_oAmountScoreText, null, iScore);
    };
    
    this.refreshPowerUpTime = function(iTimeElapsPowerUp){
        _oPowerUpGUI.refreshTime(iTimeElapsPowerUp);
    };
    
    this.showPowerUpGui = function(){
        _oPowerUpGUI.show();
    };
    
    this.hidePowerUpGui = function(){
        _oPowerUpGUI.hide();
    };
    
    this._onLeftDown = function(){
        s_oGame.moveLeft(true);
    };
    
    this._onRightDown = function(){
        s_oGame.moveRight(true);
    };
    
    this._onJumpDown = function(){
        s_oGame.moveJump(true);
    };
    
    this._onLeftUp = function(){
        s_oGame.moveLeft(false);
    };
    
    this._onRightUp = function(){
        s_oGame.moveRight(false);
    };
    
    this._onJumpUp = function(){
        s_oGame.moveJump(false);
    };
    
    this._onExit = function(){
        _oAreYouSurePanel.show(TEXT_ARE_SURE);
    };

    this._onAudioToggle = function(){
        Howler.mute(s_bAudioActive);
	s_bAudioActive = !s_bAudioActive;
    };
    
    this.resetFullscreenBut = function(){
	if (_fRequestFullScreen && screenfull.isEnabled){
		_oButFullscreen.setActive(s_bFullscreen);
	}
    };
    
    this._onFullscreenRelease = function(){
        if(s_bFullscreen) { 
		_fCancelFullScreen.call(window.document);
	}else{
		_fRequestFullScreen.call(window.document.documentElement);
	}
	
	sizeHandler();
    };
   
    this._onExitYes = function(){
        s_oGame.onExit();  
    };
    
    s_oInterface = this;
    
    this._init(iScore);
    
    return this;
}

var s_oInterface = null;
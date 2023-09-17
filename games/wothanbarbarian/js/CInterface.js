function CInterface(){
    var _oAudioToggle;
    var _oButExit;
    var _oButFullscreen;
    var _fRequestFullScreen = null;
    var _fCancelFullScreen = null;
    
    var _oHelpPanel=null;
    
    var _pStartPosExit;
    var _pStartPosAudio;
    var _pStartPosFullscreen;
    
    var _oShapeLeft;
    var _oShapeRight;
    
    var _pStartPosButtonLeft = {x: 100, y: 835};
    var _oButMovementLeft;
    var _pStartPosButtonRight = {x: CANVAS_WIDTH - 100, y: 835};
    var _oButMovementRight;
    
    var _oScoreTextStroke;
    var _oScoreText;
    var _oScorePos          = {x: 25, y: 60};
    
    var _oCeiling;
    
    this._init = function(){                
        
        if(s_bMobile){
            var oSprite = s_oSpriteLibrary.getSprite('arrow');
            _oButMovementLeft = createBitmap(oSprite);
            _oButMovementLeft.x = _pStartPosButtonLeft.x;
            _oButMovementLeft.y = _pStartPosButtonLeft.y;
            _oButMovementLeft.scaleX = -1;
            s_oStage.addChild(_oButMovementLeft);
            
            _oShapeLeft = new createjs.Shape();
            _oShapeLeft.graphics.beginFill("#ffffff").drawRect(0, 0, CANVAS_WIDTH/2, CANVAS_HEIGHT);
            _oShapeLeft.alpha = 0.01;
            s_oStage.addChild(_oShapeLeft);
            
            _oShapeLeft.on("mousedown", this.buttonPressLeft);
            _oShapeLeft.on("pressup", this.buttonUpLeft);

            var oSprite = s_oSpriteLibrary.getSprite('arrow');
            _oButMovementRight = createBitmap(oSprite);
            _oButMovementRight.x = _pStartPosButtonRight.x;
            _oButMovementRight.y = _pStartPosButtonRight.y;
            s_oStage.addChild(_oButMovementRight);
            
            _oShapeRight = new createjs.Shape();
            _oShapeRight.graphics.beginFill("#ffffff").drawRect(CANVAS_WIDTH/2, 0, CANVAS_WIDTH/2, CANVAS_HEIGHT);
            _oShapeRight.alpha = 0.01;
            s_oStage.addChild(_oShapeRight);
            
            _oShapeRight.on("mousedown", this.buttonPressRight);
            _oShapeRight.on("pressup", this.buttonUpRight);
        }
        
        _oCeiling = new CCeiling(0, 0, s_oSpriteLibrary.getSprite('ceiling'), s_oStage);
        
        var oExitX;        
        
        var oSprite = s_oSpriteLibrary.getSprite('but_exit');
        _pStartPosExit = {x: CANVAS_WIDTH - (oSprite.height/2)- 10, y: (oSprite.height/2) + 10};
        _oButExit = new CGfxButton(_pStartPosExit.x, _pStartPosExit.y, oSprite, s_oStage);
        _oButExit.addEventListener(ON_MOUSE_UP, this._onExit, this);
        
        oExitX = CANVAS_WIDTH - (oSprite.width/2)- 100;
        _pStartPosAudio = {x: oExitX, y: (oSprite.height/2) + 10};
        
        if(DISABLE_SOUND_MOBILE === false || s_bMobile === false){
            var oSprite = s_oSpriteLibrary.getSprite('audio_icon');
            _oAudioToggle = new CToggle(_pStartPosAudio.x,_pStartPosAudio.y,oSprite,s_bAudioActive);
            _oAudioToggle.addEventListener(ON_MOUSE_UP, this._onAudioToggle, this);
            
            oSprite = s_oSpriteLibrary.getSprite('but_fullscreen');
            _pStartPosFullscreen = {x: _pStartPosAudio.x - oSprite.width / 2 - 10, y: _pStartPosAudio.y};
        }else{
           _pStartPosFullscreen = {x: oExitX, y: (oSprite.height/2) + 10};
        }
        
        var doc = window.document;
        var docEl = doc.documentElement;
        _fRequestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
        _fCancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

        if (ENABLE_FULLSCREEN === false) {
            _fRequestFullScreen = false;
        }

        if (_fRequestFullScreen && screenfull.enabled) {
            oSprite = s_oSpriteLibrary.getSprite('but_fullscreen');
            _oButFullscreen = new CToggle(_pStartPosFullscreen.x, _pStartPosFullscreen.y, oSprite, s_bFullscreen, s_oStage);
            _oButFullscreen.addEventListener(ON_MOUSE_UP, this._onFullscreenRelease, this);
        }
        
        _oScoreTextStroke = new createjs.Text("SCORE: 0"," 40px "+FONT, "#410701");
        _oScoreTextStroke.x = _oScorePos.x+2;
        _oScoreTextStroke.y = _oScorePos.y+2;
        _oScoreTextStroke.textAlign = "left";
        _oScoreTextStroke.textBaseline = "alphabetic";
        _oScoreTextStroke.lineWidth = 400;     
        s_oStage.addChild(_oScoreTextStroke);
                
        _oScoreText = new createjs.Text("SCORE: 0"," 40px "+FONT, "#ffb400");
        _oScoreText.x = _oScorePos.x;
        _oScoreText.y = _oScorePos.y;
        _oScoreText.textAlign = "left";
        _oScoreText.textBaseline = "alphabetic";
        _oScoreText.lineWidth = 400;     
        s_oStage.addChild(_oScoreText);
                
        this.refreshButtonPos(s_iOffsetX,s_iOffsetY);
    };
    
    this.buttonPressLeft = function(evt){
        s_oGame.onButtonDown(LEFT_DIR);
    };
    
    this.buttonPressRight = function(evt){
        s_oGame.onButtonDown(RIGHT_DIR);
    };
    
    this.buttonUpLeft = function(){
        s_oGame.onButtonUp(LEFT_DIR);
    };
    
    this.buttonUpRight = function(){
        s_oGame.onButtonUp(RIGHT_DIR);
    };
    
    this.refreshScore = function(iScore){
        _oScoreTextStroke.text = "SCORE: "+iScore;
        _oScoreText.text = "SCORE: "+iScore;
    };
    
    this.unload = function(){
        if(DISABLE_SOUND_MOBILE === false || s_bMobile === false){
            _oAudioToggle.unload();
            _oAudioToggle = null;
        }
        
        _oButExit.unload();
        if(s_bMobile){
            s_oStage.off("mousedown", this.buttonPress);
            s_oStage.off("pressup", this.buttonUp);
        }
        
        if (_fRequestFullScreen && screenfull.enabled) {
            _oButFullscreen.unload();
        }
        
        if(_oHelpPanel!==null){
            _oHelpPanel.unload();
        }
        s_oInterface = null;
    };
    
    this.refreshButtonPos = function(iNewX,iNewY){
        _oButExit.setPosition(_pStartPosExit.x - iNewX,iNewY + _pStartPosExit.y);
        if(DISABLE_SOUND_MOBILE === false || s_bMobile === false){
            _oAudioToggle.setPosition(_pStartPosAudio.x - iNewX,iNewY + _pStartPosAudio.y);
        }        
        
        if (_fRequestFullScreen && screenfull.enabled) {
            _oButFullscreen.setPosition(_pStartPosFullscreen.x - iNewX, _pStartPosFullscreen.y + iNewY);
        }
        
        if(s_bMobile){
            _oButMovementLeft.y  = _pStartPosButtonLeft.y - iNewY;
            _oButMovementRight.y = _pStartPosButtonRight.y - iNewY;
        }
        _oScoreTextStroke.y = _oScorePos.y+iNewY;
        _oScoreText.y = _oScorePos.y+iNewY;
    };

    this._onButHelpRelease = function(){
        _oHelpPanel = new CHelpPanel();
    };
    
    this.onExitFromHelp = function(){
        _oHelpPanel.unload();
    };
    
    this._onAudioToggle = function(){
        Howler.mute(s_bAudioActive);
        s_bAudioActive = !s_bAudioActive;
    };
    
    this._onExit = function(){
        s_oGame.onExit();  
    };
    
    this._onRestart = function(){
        s_oGame.onRestart();  
    };
    
    this.resetFullscreenBut = function(){
	if (_fRequestFullScreen && screenfull.enabled){
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
    
    s_oInterface = this;
    
    this._init();
    
    return this;
}

var s_oInterface = null;
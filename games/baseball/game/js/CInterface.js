function CInterface(){
    var _oAudioToggle;
    var _oButExit;
    
    var _oSpriteScore;
    var _oSpriteBall;
    var _oScoreText;
    var _oScoreText1;
    var _oBallText;
    var _oBallText1;
    var _oButFullscreen;
    var _fRequestFullScreen = null;
    var _fCancelFullScreen = null;
    
    var _pStartPosScore;
    var _oButScore;
    var _pStartPosBall;
    var _oButBall;
    
    var _pStartPositionScoreText;
    var _pStartPositionScore;
    var _pStartPositionBallText;
    var _pStartPosFullscreen;
    
    var _pStartPosExit;
    var _pStartPosAudio;
    
    this._init = function(){                
        var oExitX;        
        
        var oSprite = s_oSpriteLibrary.getSprite('but_exit');
        _pStartPosExit = {x: CANVAS_WIDTH - (oSprite.height/2)- 10, y: (oSprite.height/2) + 10};
        _oButExit = new CGfxButton(_pStartPosExit.x, _pStartPosExit.y, oSprite, s_oStage);
        _oButExit.addEventListener(ON_MOUSE_UP, this._onExit, this);
        
        oExitX = CANVAS_WIDTH - (oSprite.width/2)- 90;
        _pStartPosAudio = {x: oExitX, y: (oSprite.height/2) + 10};
        
        if(DISABLE_SOUND_MOBILE === false || s_bMobile === false){
            var oSprite = s_oSpriteLibrary.getSprite('audio_icon');
            _oAudioToggle = new CToggle(_pStartPosAudio.x,_pStartPosAudio.y,oSprite,s_bAudioActive,s_oStage);
            _oAudioToggle.addEventListener(ON_MOUSE_UP, this._onAudioToggle, this);    
            
            oSprite = s_oSpriteLibrary.getSprite('but_fullscreen');
            _pStartPosFullscreen = {x:_pStartPosAudio.x - oSprite.width/2 - 10,y:_pStartPosAudio.y};
        }else{
            
            _pStartPosFullscreen = {x: oExitX, y: (oSprite.height/2) + 10};
        }
        
        var doc = window.document;
        var docEl = doc.documentElement;
        _fRequestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
        _fCancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
        
        if(ENABLE_FULLSCREEN === false){
            _fRequestFullScreen = false;
        }
        
        if (_fRequestFullScreen && screenfull.enabled){
            oSprite = s_oSpriteLibrary.getSprite('but_fullscreen');

            _oButFullscreen = new CToggle(_pStartPosFullscreen.x,_pStartPosFullscreen.y,oSprite,s_bFullscreen,s_oStage);
            _oButFullscreen.addEventListener(ON_MOUSE_UP, this._onFullscreenRelease, this);
        }
        
        _oSpriteScore = s_oSpriteLibrary.getSprite('score_panel');
        _pStartPosScore = {x: (CANVAS_WIDTH/2)-260, y: 35};
        _oButScore = new CGfxButton(_pStartPosScore.x, _pStartPosScore.y, _oSpriteScore, s_oStage);
        
        _pStartPositionScoreText = {x: (CANVAS_WIDTH/2)-315, y: 47};
        _oScoreText = new createjs.Text(SCORE_TEXT,"30px "+FONT, "#ff0000");
        _oScoreText.x = _pStartPositionScoreText.x;
        _oScoreText.y = _pStartPositionScoreText.y;
        _oScoreText.textAlign = "center";
        _oScoreText.textBaseline = "alphabetic";
        s_oStage.addChild(_oScoreText);
        
        _pStartPositionScore = {x: (CANVAS_WIDTH/2)-150, y: 47};
        _oScoreText1 = new createjs.Text("0","30px "+FONT, "#ff0000");
        _oScoreText1.x = _pStartPositionScore.x;
        _oScoreText1.y = _pStartPositionScore.y;
        _oScoreText1.textAlign = "right";
        _oScoreText1.textBaseline = "alphabetic";
        s_oStage.addChild(_oScoreText1);
        
        _oSpriteBall = s_oSpriteLibrary.getSprite('ball');
        _pStartPosBall = {x: (CANVAS_WIDTH/2)-370, y: 80};
        _oButBall = new CGfxButton(_pStartPosBall.x, _pStartPosBall.y, _oSpriteBall, s_oStage);
        
        _pStartPositionBallText = {x: (CANVAS_WIDTH/2)-350, y: 88};
        _oBallText = new createjs.Text("x "+BALL_TO_THROW,"30px "+FONT2, "#ffffff");
        _oBallText.x = _pStartPositionBallText.x;
        _oBallText.y = _pStartPositionBallText.y;
        _oBallText.textAlign = "left";
        _oBallText.textBaseline = "alphabetic";
        _oBallText.outline = 5;
        s_oStage.addChild(_oBallText);
        
        _oBallText1 = new createjs.Text("x "+BALL_TO_THROW,"30px "+FONT2, "#ff0000");
        _oBallText1.x = _pStartPositionBallText.x;
        _oBallText1.y = _pStartPositionBallText.y;
        _oBallText1.textAlign = "left";
        _oBallText1.textBaseline = "alphabetic";
        s_oStage.addChild(_oBallText1);
        
        this.refreshButtonPos(s_iOffsetX,s_iOffsetY);
    };
    
    this.unload = function(){
        if(DISABLE_SOUND_MOBILE === false || s_bMobile === false){
            _oAudioToggle.unload();
            _oAudioToggle = null;
        }
        if (_fRequestFullScreen && screenfull.enabled){
            _oButFullscreen.unload();
        }
        _oButExit.unload();
        
        s_oInterface = null;
    };
    
    this.refreshButtonPos = function(iNewX,iNewY){
        _oButExit.setPosition(_pStartPosExit.x - iNewX,iNewY + _pStartPosExit.y);
        if(DISABLE_SOUND_MOBILE === false || s_bMobile === false){
            _oAudioToggle.setPosition(_pStartPosAudio.x - iNewX,iNewY + _pStartPosAudio.y);
        } 
        if (_fRequestFullScreen && screenfull.enabled){
            _oButFullscreen.setPosition(_pStartPosFullscreen.x - iNewX,_pStartPosFullscreen.y + iNewY);
        }
        _oButScore.setPosition(_pStartPosScore.x + iNewX,iNewY + _pStartPosScore.y);
        _oButBall.setPosition(_pStartPosBall.x + iNewX,iNewY + _pStartPosBall.y);
        
        _oScoreText.x = _pStartPositionScoreText.x + iNewX;
        _oScoreText1.x = _pStartPositionScore.x + iNewX;
        _oBallText.x = _pStartPositionBallText.x + iNewX;
        _oBallText1.x = _pStartPositionBallText.x + iNewX;
    };
    
    this.viewScore = function(iValue){
        _oScoreText1.text = iValue;
    };
    
    this.viewBallLeft = function(iValue){
        _oBallText.text = "x "+(BALL_TO_THROW-iValue);
        _oBallText1.text = "x "+(BALL_TO_THROW-iValue);
    };
    
    this._onButHelpRelease = function(){
        _oHelpPanel = new CHelpPanel();
    };
    
    this._onButRestartRelease = function(){
        s_oGame.restartGame();
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
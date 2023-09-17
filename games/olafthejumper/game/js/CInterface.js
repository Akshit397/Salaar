function CInterface(iBestScore) {
    var _oAudioToggle;
    
    var _pStartPosAudio;
    var _pStartPosExit;
    var _pStartPosRestart;
    var _pStartPosFullscreen;
    var _oScoreText;
    var _iBestScore;
    var _oBestScoreText;
    var _oButFullscreen;
    var _fRequestFullScreen = null;
    var _fCancelFullScreen = null;
    var _oButExit;
    var _oHitArea;
    var _oEndPanel;
    var _oHandPanel;
    var _oScoreOutline;
    var _oBestScoreOutline;
    
    this._init = function (iBestScore) {
        var oSpriteExit = s_oSpriteLibrary.getSprite('but_exit');
        _iBestScore = iBestScore;
        _pStartPosExit = {x: CANVAS_WIDTH - oSpriteExit.width/2 - 10, y: (oSpriteExit.height / 2) + 10};
        _oHitArea = new createjs.Shape();
        _oHitArea.graphics.beginFill("red").drawRect(0, 10, CANVAS_WIDTH, CANVAS_HEIGHT);
        _oHitArea.alpha = 0.01;
        s_oStage.addChild(_oHitArea);
        _oButExit = new CGfxButton(10, _pStartPosExit.y, oSpriteExit);
        _oButExit.addEventListener(ON_MOUSE_UP, this._onExit, this);
        
        
        

        _oHitArea.on("mousedown", function () { s_oGame.tapScreen() });
        _oHitArea.on("pressup", function () { s_oGame.releaseScreen() });
        
        if (DISABLE_SOUND_MOBILE === false || s_bMobile === false){
            var oSprite = s_oSpriteLibrary.getSprite('audio_icon');
            
            _pStartPosAudio = {x: _pStartPosExit.x - oSpriteExit.width/2 - oSprite.width/4 - 10, y: _pStartPosExit.y};
            _oAudioToggle = new CToggle(_pStartPosAudio.x, _pStartPosAudio.y, oSprite, s_bAudioActive,s_oStage);
            _oAudioToggle.addEventListener(ON_MOUSE_UP, this._onAudioToggle, this);
            _pStartPosFullscreen = {x: _pStartPosAudio.x - oSprite.width/2 - 10,y:_pStartPosAudio.y};
        }else{
            _pStartPosFullscreen = {x: _pStartPosExit.x - oSpriteExit.width - 10, y: _pStartPosExit.y};
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
            
            _pStartPosRestart = {x: _pStartPosFullscreen.x - oSpriteExit.width, y: _pStartPosFullscreen.y};
        }else{
            _pStartPosRestart = {x: _pStartPosFullscreen.x, y: _pStartPosFullscreen.y};
        }
        _oScoreOutline = new createjs.Text("Score" +": 0","42px "+ PRIMARY_FONT, "#000");
        _oScoreOutline.x = CANVAS_WIDTH/2 - 350;
        _oScoreOutline.y = 40;
        _oScoreOutline.outline = 2;

        _oScoreText = new createjs.Text("Score" +": 0","42px "+ PRIMARY_FONT, "#d99b01");
        _oScoreText.x = CANVAS_WIDTH/2 - 350;
        _oScoreText.y = 40;

        _oBestScoreText = new createjs.Text("Best Score: " + iBestScore,"42px "+PRIMARY_FONT, "#d99b01");
        _oBestScoreText.x = CANVAS_WIDTH/2 - 150;
        _oBestScoreText.y = 80;
        _oBestScoreOutline = new createjs.Text("Best Score: " + iBestScore,"42px "+PRIMARY_FONT, "#000");
        _oBestScoreOutline.x = CANVAS_WIDTH/2 - 150;
        _oBestScoreOutline.y = 35;
        _oBestScoreOutline.outline = 2;
        s_oStage.addChild(_oBestScoreOutline);

        s_oStage.addChild(_oBestScoreText);

        s_oStage.addChild(_oScoreOutline);
        s_oStage.addChild(_oScoreText);

        _oEndPanel = new CEndPanel();
        
        if(s_bFirstPlay){
            s_bFirstPlay = false;
            _oHandPanel = new CHelpPanel();
        }
        
        this.refreshButtonPos(s_iOffsetX, s_iOffsetY);
    };

    this.refreshButtonPos = function (iNewX, iNewY) {
        if (DISABLE_SOUND_MOBILE === false || s_bMobile === false) {
            _oAudioToggle.setPosition(_pStartPosAudio.x - iNewX, _pStartPosAudio.y + iNewY);
        }
        if (_fRequestFullScreen && screenfull.enabled){
            _oButFullscreen.setPosition(_pStartPosFullscreen.x - iNewX,_pStartPosFullscreen.y + iNewY);
        }
        _oScoreText.y = 20 + iNewY;
        _oScoreOutline.y = 20 + iNewY;

        _oBestScoreText.y = 20+ iNewY;
        _oBestScoreOutline.y = 20+ iNewY;

        _oButExit.setPosition(_pStartPosExit.x - iNewX, _pStartPosExit.y + iNewY);
        
    };

   this.refreshScore = function(iScore){
       _oScoreText.text = "Score" +": "+iScore;
       _oScoreOutline.text = "Score" +": "+iScore;
            if (_iBestScore < iScore)
            {
                _oBestScoreText.text = "Best Score: " + iScore;
                _oBestScoreOutline.text = "Best Score: " + iScore;
            }
    };
    
    this.unload = function () {
        
        if (DISABLE_SOUND_MOBILE === false || s_bMobile === false) {
            _oAudioToggle.unload();
            _oAudioToggle = null;
        }
        
        if (_fRequestFullScreen && screenfull.enabled){
            _oButFullscreen.unload();
        }

        _oButExit.unload();
        s_oInterface = null;
    };
    
    
    this._onExit = function ()
    {
        s_oGame.unload();
        s_oMain.gotoMenu();
    };

    this.gameOver = function ()
    {
      _oEndPanel.show();  
    };
    this._onAudioToggle = function () {
        Howler.mute(s_bAudioActive);
        s_bAudioActive = !s_bAudioActive;
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

    this._init(iBestScore);

    return this;
}

var s_oInterface = null;
var s_bFirstPlay = true;
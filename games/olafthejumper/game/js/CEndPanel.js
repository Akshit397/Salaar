function CEndPanel(iScore){
    var _oBg;
    var _oFade;
    var _oButExit;
    var _oButRestart;
    var _oScoreText;
    var _oScoreOutline;
    var _oBestScoreText;
    var _oBestScoreOutline;
    var _oThis;

    var _oContainer;
    var _oFadeContainer;
    
    this._init = function(){
        _oContainer = new createjs.Container();
        _oFadeContainer = new createjs.Container();
        s_oStage.addChild(_oFadeContainer);
        s_oStage.addChild(_oContainer);
        _oFade = new createjs.Shape();
        _oFade.graphics.beginFill("black").drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        _oFade.alpha = 0.01;
        _oBg = createBitmap(s_oSpriteLibrary.getSprite("bg_end_panel"));
        _oFadeContainer.addChild(_oFade);
        _oContainer.addChild(_oBg);

        _oScoreText = new createjs.Text(TEXT_YOUR_SCORE+": "+s_oGame.getScore(), "54px " + PRIMARY_FONT, "#d99b01");
        _oScoreOutline = new createjs.Text(TEXT_YOUR_SCORE+": "+s_oGame.getScore(), "54px " + PRIMARY_FONT, "#000");
        if(getItem(SCORE_ITEM_NAME)  !== null)
			if(getItem(SCORE_ITEM_NAME) > s_oGame.getScore()) {
                _oBestScoreText = new createjs.Text(TEXT_BEST_SCORE + ": " + getItem(SCORE_ITEM_NAME), "58px " + PRIMARY_FONT, "#d99b01");
                _oBestScoreOutline = new createjs.Text(TEXT_BEST_SCORE + ": " + getItem(SCORE_ITEM_NAME), "58px " + PRIMARY_FONT, "#000000");
            }
			else {
                _oBestScoreText = new createjs.Text(TEXT_BEST_SCORE + ": " + s_oGame.getScore(), "58px " + PRIMARY_FONT, "#d99b01");
                _oBestScoreOutline = new createjs.Text(TEXT_BEST_SCORE + ": " + s_oGame.getScore(), "58px " + PRIMARY_FONT, "#000000");
            }
        else {
            _oBestScoreText = new createjs.Text(TEXT_BEST_SCORE + ": 0", "58px " + PRIMARY_FONT, "#d99b01");
            _oBestScoreOutline = new createjs.Text(TEXT_BEST_SCORE + ": 0", "58px " + PRIMARY_FONT, "#000");
        }
        _oScoreText.textAlign = "center";
        _oScoreText.textBaseline = "alphabetic";
        _oScoreText.x = _oContainer.getBounds().width/2 ;
        _oScoreText.y = 100;
        _oScoreOutline.textAlign = "center";
        _oScoreOutline.textBaseline = "alphabetic";
        _oScoreOutline.x = _oContainer.getBounds().width/2 ;
        _oScoreOutline.y = 100;
        _oScoreOutline.outline = 3;
        _oBestScoreText.textAlign = "center";
        _oBestScoreText.textBaseline = "alphabetic";
        _oBestScoreText.x = _oContainer.getBounds().width/2;
        _oBestScoreText.y = 170;
        _oBestScoreOutline.textAlign = "center";
        _oBestScoreOutline.textBaseline = "alphabetic";
        _oBestScoreOutline.x = _oContainer.getBounds().width/2;
        _oBestScoreOutline.y = 170;
        _oBestScoreOutline.outline = 3;

        _oContainer.addChild(_oBestScoreOutline);
        _oContainer.addChild(_oBestScoreText);
        _oContainer.addChild(_oScoreOutline);
        _oContainer.addChild(_oScoreText);

        
        _oButExit = new CGfxButton(_oContainer.getBounds().width/2 - 180, 250, s_oSpriteLibrary.getSprite('but_home'), _oContainer);
        _oButExit.addEventListener(ON_MOUSE_UP, this._onExit, this);
        
        
        _oButRestart = new CGfxButton(_oContainer.getBounds().width/2 + 180 ,250, s_oSpriteLibrary.getSprite('but_restart'), _oContainer);
        _oButRestart.addEventListener(ON_MOUSE_UP, this._onRestart, this);
       _oContainer.x = CANVAS_WIDTH/2 - _oContainer.getBounds().width/2;
        _oContainer.y = - _oContainer.getBounds().height;
        
    };
    
    this.unload = function(){
        _oButExit.unload(); 
        _oButExit = null;

        _oButRestart.unload();
        _oButRestart = null;
        
        s_oStage.removeChild(_oContainer);
        s_oStage.removeChild(_oFadeContainer);
    };
    this.show = function ()
    {
        new createjs.Tween.get(_oFade).to({alpha: 0.8}, 1000);
      	new createjs.Tween.get(_oContainer).to({y: 500}, 1000, createjs.Ease.bounceOut);
        _oScoreText.text = TEXT_YOUR_SCORE + " :" + s_oGame.getScore();
        _oScoreOutline.text = TEXT_YOUR_SCORE+ " :" + s_oGame.getScore();
		if(getItem(SCORE_ITEM_NAME)  !== null)
			if(getItem(SCORE_ITEM_NAME) < s_oGame.getScore()) {
		_oBestScoreText.text = TEXT_BEST_SCORE + " :" + s_oGame.getScore();
        _oBestScoreOutline.text = TEXT_BEST_SCORE+ " :" + s_oGame.getScore();
		}
		else {
			_oBestScoreText.text = TEXT_BEST_SCORE + " :" + getItem(SCORE_ITEM_NAME);
			_oBestScoreOutline.text = TEXT_BEST_SCORE+ " :" + getItem(SCORE_ITEM_NAME);
		}
	
    };
    
    this._onExit = function(){
        _oThis.unload();
        s_oGame.onExit();
    };
    
    this._onRestart = function(){
        _oThis.unload();
        s_oGame.restart();
    };
    
    _oThis = this;
    this._init(iScore);
}
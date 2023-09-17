function CPowerUpGui(oParentContainer){
    var _iMaskWidth;
    var _iMaskHeight;
    var _pStartPosPowerUp;
    
    var _oTextTime;
    var _oMask;
    var _oContainer;
    var _oParentContainer = oParentContainer;
    
    this._init = function(){
        var oSpritePowerUpOff = s_oSpriteLibrary.getSprite("powerup_gui_off");
        _iMaskWidth = oSpritePowerUpOff.width;
        _iMaskHeight = oSpritePowerUpOff.height;
        _pStartPosPowerUp = {x:CANVAS_WIDTH-oSpritePowerUpOff.width - 10,y:CANVAS_HEIGHT-oSpritePowerUpOff.height-10};
        
        _oContainer = new createjs.Container();
        _oContainer.x = _pStartPosPowerUp.x;
        _oContainer.y = _pStartPosPowerUp.y;
        _oContainer.visible = false;
        _oParentContainer.addChild(_oContainer);
        
        var oSpriteOff = createBitmap(oSpritePowerUpOff);
        _oContainer.addChild(oSpriteOff);
        
        
        var oSpriteOn = createBitmap(s_oSpriteLibrary.getSprite("powerup_gui_on"));
        _oContainer.addChild(oSpriteOn);
        
        _oMask = new createjs.Shape();
        _oMask.graphics.beginFill("rgba(0,0,0,0.01)").drawRect(0, 0, oSpritePowerUpOff.width, oSpritePowerUpOff.height);
        _oContainer.addChild(_oMask);
        
        oSpriteOn.mask = _oMask;
        
        _oTextTime = new createjs.Text("00:00","20px "+FONT_GAME, "#fff");
        _oTextTime.x = oSpritePowerUpOff.width/2;
        _oTextTime.y = -10;
        _oTextTime.textBaseline = "alphabetic";
        _oTextTime.textAlign = "center";
        _oContainer.addChild(_oTextTime);
    };
    
    this.refreshButtonPos = function(){
        _oContainer.x = _pStartPosPowerUp.x - s_iOffsetX;
        _oContainer.y = _pStartPosPowerUp.y - s_iOffsetY;
    };
    
    this.reset = function(){
        _oContainer.visible = false;
    };
    
    this.show = function(){
        this.refreshTime(0);
        
        _oContainer.x += _iMaskWidth+10;
        _oContainer.visible = true;
        createjs.Tween.get(_oContainer).to({x: _pStartPosPowerUp.x - s_iOffsetX}, 1000, createjs.Ease.backOut);
    };
    
    this.hide = function(){
        createjs.Tween.get(_oContainer).to({x: _oContainer.x+_iMaskWidth+10}, 1000, createjs.Ease.backIn).call(function(){_oContainer.visible = false;});
    };
    
    this.refreshTime = function(iTime){
        _oTextTime.text = formatTime(TIME_EFFECT_POWERUP-iTime);
        
        _oMask.graphics.clear();
        
        var iPerc = 100-Math.floor(iTime/TIME_EFFECT_POWERUP *100);
        var iNewMaskWidth = Math.floor((iPerc * _iMaskWidth) / 100);
        _oMask.graphics.beginFill("rgba(0,0,0,0.01)").drawRect(0, 0, iNewMaskWidth, _iMaskHeight);
    };
    
    this._init();
}
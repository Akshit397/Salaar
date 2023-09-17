function CPowerUp(iX,iY,iType,oParentContainer){

    var _iType;
    var _iWidth;
    var _iHeight;
    var _aCbCompleted;
    var _aCbOwner;
    
    var _oContainer;
    var _oParentContainer = oParentContainer;
    
    this._init = function(iX,iY,iType){
        _iType = iType;
        _aCbCompleted=new Array();
        _aCbOwner =new Array();
        
        _oContainer = new createjs.Container();
        _oContainer.scaleX = _oContainer.scaleY = 0.1;
        _oContainer.x = iX;
        _oContainer.y = iY;
        _oParentContainer.addChild(_oContainer);
        
        _iWidth = 286;
        _iHeight = 404;
        
        var oData = {
            images: [s_oSpriteLibrary.getSprite("power_up_"+_iType)],
            framerate:15,
            // width, height & registration point of each sprite
            frames: {width: _iWidth, height:_iHeight },
            animations: {start: 0, anim: [0,14]}
        };

        var oSpriteSheet = new createjs.SpriteSheet(oData);
        var oSprite = createSprite(oSpriteSheet,"anim",0,0,_iWidth,_iHeight);
        _oContainer.addChild(oSprite);
        
        
        
        /*
        var oShapeRect = new createjs.Shape();
        oShapeRect.graphics.beginFill("red").drawRect(0, 0, _iWidth,_iHeight);
        oShapeRect.alpha = 0.5;
        _oContainer.addChild(oShapeRect);
        */
        _oContainer.regX = _iWidth/2;
        _oContainer.regY = _iHeight/2;
        
        _oContainer.alpha = 0;
        
        var iNewX =  ( (iX - MIN_POWERUP_X)/(MAX_POWERUP_X-MIN_POWERUP_X) ) * 1140; 
        
        new createjs.Tween.get(_oContainer).to({alpha:1},500);
        new createjs.Tween.get(_oContainer).to({scaleX:1,scaleY:1,x:iNewX,y:POWERUP_FINAL_Y},TIME_OPPONENT_RUN*1.5,createjs.Ease.cubicIn).call(function(){
            if(_aCbCompleted[ON_POWERUP_END_MOVE]){
                var oRect = new createjs.Rectangle(iNewX - (_iWidth/2),POWERUP_FINAL_Y - (_iHeight/2),_iWidth,_iHeight);
                _aCbCompleted[ON_POWERUP_END_MOVE].call(_aCbOwner[ON_POWERUP_END_MOVE],oRect,_iType);
                
                _oParentContainer.removeChild(_oContainer);
            }
        });
    };
    
    this.unload = function(){
        _oParentContainer.removeChild(_oContainer);
    };
    
    this.addEventListener = function( iEvent,cbCompleted, cbOwner ){
        _aCbCompleted[iEvent]=cbCompleted;
        _aCbOwner[iEvent] = cbOwner; 
    };

    this.stopTween = function(){
        createjs.Tween.removeTweens(_oContainer);
    };
    
    this._init(iX,iY,iType);
}
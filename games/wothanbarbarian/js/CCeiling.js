function CCeiling(iX,iY,oSprite, oContainer){
    var _iX = iX;
    var _iY = iY;
    
    var _oSprite = oSprite;
    var _oContainer = oContainer;
    var _oObject;
    
    var _oShape;
    
    this._init = function(){
        
        var oData = {   
                    images: [_oSprite], 
                    // width, height & registration point of each sprite
                    frames: {width: CEILING_WIDTH, height: CEILING_HEIGHT, regX: 0, regY: 0}, 
                    animations: {idle:[0, 15, "idle"]}
                };

        var oSpriteSheet = new createjs.SpriteSheet(oData);
        _oObject = createSprite(oSpriteSheet, "idle", 0, 0, 0, 0);

        _oObject.x = _iX;
        _oObject.y = _iY;

        _oContainer.addChild(_oObject);
        
    };
        
    this.getY = function(){
        return _oObject.y;
    };
    
    this.getX = function(){
        return _oObject.x;
    };
    
    this.setPos = function(iNewX, iNewY){
        _oObject.x = iNewX;
        _oObject.y = iNewY;
    };
    
    this.unload = function(){
        _oContainer.removeChild(_oObject);
        _oContainer.removeChild(_oShape);
    };
    
    this._init();
    
}
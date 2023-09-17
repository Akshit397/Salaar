function CBonus(iX,iY,iType, oContainer){
    var _iX = iX;
    var _iY = iY;
    var _iBonusType = iType;
    var _iHalfHeight;
    
    var _oRectangleMeasures;
    
    var _oContainer = oContainer;
    
    var _oObject;
    var _oRectangle;
    
    var _oShape;
    
    this._init = function(){
        if(_iBonusType === SLOW){
            var oSourceImage = s_oSpriteLibrary.getSprite('slow_bonus');
                
            var oData = {   
                        images: [oSourceImage], 
                        // width, height & registration point of each sprite
                        frames: {width: SLOW_WIDTH, height: SLOW_HEIGHT, regX: SLOW_WIDTH/2, regY: SLOW_HEIGHT/2}, 
                        animations: {idle:[0, 29, "idle"]}
                    };
                    
            var oSpriteSheet = new createjs.SpriteSheet(oData);
            _oObject = createSprite(oSpriteSheet, "idle", 0, 0, SLOW_WIDTH/2, SLOW_HEIGHT/2);
            
            var iPosX = (Math.floor((Math.random()* 100)));
            var iValue = Math.random();
            if(iValue === 0){
                iPosX *= -1;
            }
            _oObject.x = _iX+iPosX;
            _oObject.y = _iY+SLOW_HEIGHT/2;
            
            _oContainer.addChild(_oObject);
        }else if(_iBonusType === DESTROY){
            var oSourceImage = s_oSpriteLibrary.getSprite('destroy_bonus');
            
            var oData = {   
                        images: [oSourceImage], 
                        // width, height & registration point of each sprite
                        frames: {width: DESTROY_WIDTH, height: DESTROY_HEIGHT, regX: DESTROY_WIDTH/2, regY: DESTROY_HEIGHT/2}, 
                        animations: {idle:[0, 17, "idle"]}
                    };
                    
            var oSpriteSheet = new createjs.SpriteSheet(oData);
            _oObject = createSprite(oSpriteSheet, "idle", 0, 0, DESTROY_WIDTH/2, DESTROY_HEIGHT/2);
            
            var iPosX = (Math.floor((Math.random()* 100)));
            var iValue = Math.random();
            if(iValue === 0){
                iPosX *= -1;
            }
            _oObject.x = iX+iPosX;
            _oObject.y = iY+DESTROY_HEIGHT/2;
        
            _oContainer.addChild(_oObject);
        }
            
        _oRectangleMeasures = {x: _oObject.x-_oObject.regX, y: _oObject.regY-DESTROY_HEIGHT/2, width: DESTROY_WIDTH, height: DESTROY_HEIGHT};

        _oRectangle = new createjs.Rectangle(_oRectangleMeasures.x, _oRectangleMeasures.y, _oRectangleMeasures.width, _oRectangleMeasures.height);
        _oShape = new createjs.Shape();
        _oShape.graphics.beginFill("#0f0f0f").drawRect(_oRectangleMeasures.x, _oRectangleMeasures.y, _oRectangleMeasures.width, _oRectangleMeasures.height);
        _oShape.alpha = 0.5;
        _oContainer.addChild(_oShape);
    };
    
    this.controlCollision = function(oPlayerRectangle){
        if(_oRectangle.intersection ( oPlayerRectangle ) !== null){
            return true;
        }
        return false;
    };
    
    this.checkIfOverCanvas = function(){
        if(_oObject.y < 0){
            return true;
        }
        return false;
    };
    
    this.move = function(iVelocity){
        _oObject.y+=iVelocity;
        this.refreshRectangle();
    };
    
    this.refreshRectangle = function(){
        if(_iBonusType === SLOW){
            _oRectangleMeasures = {x: _oObject.x-SLOW_WIDTH/2, y: _oObject.y-SLOW_HEIGHT/2, width: SLOW_WIDTH, height: SLOW_HEIGHT+SLOW_HEIGHT/2};
        }else if(_iBonusType === DESTROY){
            _oRectangleMeasures = {x: _oObject.x-DESTROY_WIDTH/2, y: _oObject.y-DESTROY_HEIGHT/2, width: DESTROY_WIDTH, height: DESTROY_HEIGHT+DESTROY_HEIGHT/2};
        }
        _oRectangle.setValues(_oRectangleMeasures.x, _oRectangleMeasures.y, _oRectangleMeasures.width, _oRectangleMeasures.height);
        _oContainer.removeChild(_oShape);
        /*_oShape = new createjs.Shape();
        _oShape.graphics.beginFill("#f0f0f0").drawRect(_oRectangleMeasures.x, _oRectangleMeasures.y, _oRectangleMeasures.width, _oRectangleMeasures.height);
        _oShape.alpha = 0.5;
        _oContainer.addChild(_oShape);*/
    };
    
    this.moveOrizzontal = function(iVelocity){
        _oObject.x+=iVelocity;
    };
    
    this.getRectangle = function(){
        return _oRectangle;
    };
    
    this.getY = function(){
        return _oObject.y;
    };
    
    this.getX = function(){
        return _oObject.x;
    };
    
    this.getType = function(){
        return _iBonusType;
    };
    
    this.unload = function(){
        _oContainer.removeChild(_oObject);
        _oContainer.removeChild(_oShape);
    };
    
    this._init();
    
}
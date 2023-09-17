function CObstacle(iX, iY, iType, oContainer){
    var _iX;
    var _iY;
    var _iBonusType = iType;
    
    var _oRectangleMeasures;
    
    var _oRotatorySaw;
    var _oRotatorySawDestroing;
    
    var _oContainer = oContainer;
    
    var _bDirection = false;
    
    var _oObject;
    var _oRectangle;
    
    var _oShape;
    
    this._init = function(){
        _iX = iX;
        _iY = iY;
        
        if(_iBonusType === ROTARY_SAW){
            
            //ROTATORY SAW DESTROING
            var oPlayerSprite = s_oSpriteLibrary.getSprite("rotary_saw_destroyed");

            var oData = {   
                images: [oPlayerSprite], 
                framerate: 30,
                // width, height & registration point of each sprite
                frames: {width: ROTATORY_SAW_DESTROYED_WIDTH, height: ROTATORY_SAW_DESTROYED_HEIGHT, regX: ROTATORY_SAW_DESTROYED_WIDTH/2, regY: ROTATORY_SAW_DESTROYED_HEIGHT/2}, 
                animations: {idle_breaking:[0, 7, "end"], end:[8]}
            };
            _oRotatorySawDestroing = new createjs.SpriteSheet(oData);
            
            //ROTATORY SAW
            var oSourceImage = s_oSpriteLibrary.getSprite('rotary_saw');
            
            var oData = {   
                        images: [oSourceImage], 
                        framerate: 30,
                        // width, height & registration point of each sprite
                        frames: {width: ROTATORY_SAW_WIDTH, height: ROTATORY_SAW_HEIGHT, regX: ROTATORY_SAW_WIDTH/2, regY: 0}, 
                        animations: {idle:[0, 19, "idle"]}
                    };
                    
            _oRotatorySaw = new createjs.SpriteSheet(oData);
            
            _oObject = createSprite(_oRotatorySaw, "idle", 0, 0, ROTATORY_SAW_WIDTH/2, 0);
            _oObject.x = iX;
            _oObject.y = iY-ROTATORY_SAW_HEIGHT/2;
        
        }            
        
        _oRectangleMeasures = {x: _oObject.x-ROTATORY_SAW_WIDTH/2, y: _oObject.y, width: ROTATORY_SAW_WIDTH, height: ROTATORY_SAW_HEIGHT};

        _oRectangle = new createjs.Rectangle(_oRectangleMeasures.x, _oRectangleMeasures.y, _oRectangleMeasures.width, _oRectangleMeasures.height);
        /*_oShape = new createjs.Shape();
        _oShape.graphics.beginFill("#fff").drawRect(_oRectangleMeasures.x, _oRectangleMeasures.y, _oRectangleMeasures.width, _oRectangleMeasures.height);
        _oShape.alpha = 0.5;
        s_oStage.addChild(_oShape);*/
    };
    
    this.startAnimationDestroyed = function(){
        _oObject.spriteSheet = _oRotatorySawDestroing;
        _oObject.gotoAndPlay("idle_breaking");
    };
    
    this.addOnStage = function(){
        _oContainer.addChild(_oObject);
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
    
    this.setVisibleFalse = function(){
        _oObject.visible = false;
    };
    
    this.setVisibleTrue = function(iX, iY){
        _oObject.visible = true;
        _oObject.spriteSheet = _oRotatorySaw;
        _oObject.gotoAndPlay("idle");
        _oObject.x = iX;
        _oObject.y = iY+5;
    };
    
    this.move = function(iVelocity, iStartX){
        _oObject.y+=iVelocity;
        this.moveOrizzontal(iVelocity, iStartX);
        this.refreshRectangle();
    };
    
    this.moveOrizzontal = function(iVelocity, iStartX){
        iVelocity = iVelocity/2;
        if(_oObject.x > iStartX-50 && !_bDirection){
            _oObject.x+=iVelocity;
        }else if(_oObject.x <= iStartX-50){
            _bDirection = true;
        }

        if(_oObject.x < iStartX+50 && _bDirection){
            _oObject.x-=iVelocity;
        }else if(_oObject.x >= iStartX+50){
            _bDirection = false;
        }
        
    };
    
    this.refreshRectangle = function(){
        _oRectangleMeasures = {x: _oObject.x-ROTATORY_SAW_WIDTH/2, y: _oObject.y+10, width: ROTATORY_SAW_WIDTH, height: ROTATORY_SAW_HEIGHT+40};
        _oRectangle.setValues(_oRectangleMeasures.x, _oRectangleMeasures.y, _oRectangleMeasures.width, _oRectangleMeasures.height);
        /*s_oStage.removeChild(_oShape);
        _oShape = new createjs.Shape();
        _oShape.graphics.beginFill("#fff").drawRect(_oRectangleMeasures.x, _oRectangleMeasures.y, _oRectangleMeasures.width, _oRectangleMeasures.height);
        _oShape.alpha = 0.5;
        s_oStage.addChild(_oShape);*/
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
    };
    
    this._init();
    
}
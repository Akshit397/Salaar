function CPlatform(iX,iY,iType, oPlatformContainer){
    var _iX;
    var _iY;
    var _iType = iType; 
    var _iPlatformWidth;
    var _iPlatformHeight;
    
    var _szState;
    var _szStartingState;
    
    var _bCanBeHitted = true;
    var _bHaveObstacle = false;
    var _bAnimationAlmostThornsOn = false;
    
    var _oPlatform;
    var _oContainerPlatform = oPlatformContainer;
    var _oRectangleMeasures;
    var _oRectangle;
    var _oObstacle;
    
    var _oShape;
    
    this._init = function(){
        _iX = iX;
        _iY = iY;
        
        var oPlatformSprite = s_oSpriteLibrary.getSprite('platforms');
                        
        var framerate = 30;
        
        var oData = {   
            images: [oPlatformSprite], 
            framerate: framerate,
            // width, height & registration point of each sprite
            frames: {width: PLATFORM_WIDTH, height: PLATFORM_HEIGHT, regX: 0, regY: 0}, 
            animations: {normal:[0], binary:[1], thorns_off:[2], thorns_almost_on:[3, 4, "thorns_almost_on"], thorns_on:[5], platform_destroyed:[6, 12, "end"], end:[13]}
        };
        var oSpriteSheet = new createjs.SpriteSheet(oData);
        
        //******************************************************************** TYPE 0
        if(_iType === 0){
            _oPlatform = createSprite(oSpriteSheet, "normal", 0, 0, PLATFORM_WIDTH, PLATFORM_HEIGHT);
            _oPlatform.x = _iX+PLATFORM_WIDTH/2;
            _oPlatform.y = _iY;
            _szStartingState = "normal";
        }
        
        //******************************************************************** TYPE 1
        if(_iType === 1){
            _oPlatform = createSprite(oSpriteSheet, "thorns_off", 0, 0, PLATFORM_WIDTH, PLATFORM_HEIGHT);
            _oPlatform.x = _iX;
            _oPlatform.y = _iY;
            _szStartingState = "thorns_off";
            
        }
        
        //******************************************************************** TYPE 2
        if(_iType === 2){
            _oPlatform = createSprite(oSpriteSheet, "binary", 0, 0, PLATFORM_WIDTH, PLATFORM_HEIGHT);
            _oPlatform.x = _iX;
            _oPlatform.y = _iY;
            _szStartingState = "binary";
            
            _bHaveObstacle = true;
            
            _oObstacle = new CObstacle(_iX, _iY-_oPlatform.regY, ROTARY_SAW, _oContainerPlatform)
        }
        
        //******************************************************************** TYPE 3
        if(_iType === 3){
            _iPlatformWidth = PLATFORM_START_WIDTH;
            _iPlatformHeight = PLATFORM_START_HEIGHT;
            _oPlatform = createBitmap(s_oSpriteLibrary.getSprite('floor_start'));
            _oPlatform.x = _iX;
            _oPlatform.y = _iY;
            _oPlatform.regY = _iPlatformHeight/2;
            
            
        };
        
        _oContainerPlatform.addChild(_oPlatform);
        
        if(_bHaveObstacle){
            _oObstacle.addOnStage();
        }
        
        if(_iType === 3){
            _oPlatform.visible = true;
            _oRectangleMeasures = {x: _oPlatform.x, y: _oPlatform.y+10-_oPlatform.regY, width: _iPlatformWidth, height: _iPlatformHeight};
        }else{
            _oPlatform.visible = false;
            _oRectangleMeasures = {x: _oPlatform.x+60, y: _oPlatform.y+50, width: PLATFORM_WIDTH-150, height: PLATFORM_HEIGHT-100};
        }
        
        _oRectangle = new createjs.Rectangle(_oRectangleMeasures.x, _oRectangleMeasures.y, _oRectangleMeasures.width, _oRectangleMeasures.height);
            /*
        _oShape = new createjs.Shape();
        _oShape.graphics.beginFill("#00ffff").drawRect(_oRectangleMeasures.x, _oRectangleMeasures.y, _oRectangleMeasures.width, _oRectangleMeasures.height);
        _oShape.alpha = 0.5;
        s_oStage.addChild(_oShape);
        */
    };
        
    this.controlCollision = function(oPlayerRectangle){
        if(_bCanBeHitted){
            if(_iType === 0){
                if(_oRectangle.intersects ( oPlayerRectangle )){
                    return PLATFORM;
                }
            }else if(_iType === 1){
                if(_oRectangle.intersects ( oPlayerRectangle )){
                    if(_szState === "thorns_on"){
                        return THORNS;
                    }
                    return PLATFORM;
                }
            }else if(_iType === 2){
                if(_oObstacle.getRectangle().intersects( oPlayerRectangle )){
                    return OBSTACLE;
                }else 
                    if(_oRectangle.intersects ( oPlayerRectangle )){
                    return PLATFORM;
                }
            }else if(_iType === 3){
                if(_oRectangle.intersects ( oPlayerRectangle )){
                    return PLATFORM;
                }
            }
        }
        return -1;
    };
    
    this.setInvisible = function(){
        _oPlatform.visible = false;
    };
    
    this.move = function(iVelocity){
        _oPlatform.y+=iVelocity;
        if(_bHaveObstacle){
            _oObstacle.move(iVelocity, _oPlatform.x+PLATFORM_WIDTH/2);
        }
        this.refreshRectangle();
    };
    
    this.refreshRectangle = function(){
        if(_iType === 3){
            _oRectangleMeasures = {x: _oPlatform.x, y: _oPlatform.y+10-_oPlatform.regY, width: _iPlatformWidth, height: _iPlatformHeight-30};
        }else{
            _oRectangleMeasures = {x: _oPlatform.x+60, y: _oPlatform.y+60, width: PLATFORM_WIDTH-150, height: PLATFORM_HEIGHT-185};
        }
        
        _oRectangle.setValues (_oRectangleMeasures.x, _oRectangleMeasures.y, _oRectangleMeasures.width, _oRectangleMeasures.height);
        /*s_oStage.removeChild(_oShape);
        _oShape = new createjs.Shape();
        _oShape.graphics.beginFill("#00ffff").drawRect(_oRectangleMeasures.x, _oRectangleMeasures.y, _oRectangleMeasures.width, _oRectangleMeasures.height);
        _oShape.alpha = 0.5;
        s_oStage.addChild(_oShape);*/
    };
    
    this.startAnimationDestroyed = function(){
        _oPlatform.gotoAndPlay("platform_destroyed");
        _bCanBeHitted = false;
        if(_bHaveObstacle){
            _oObstacle.startAnimationDestroyed();
        }
    };
    
    this.changeStatusOn = function(iX, iY){
        _oPlatform.x = iX;
        _oPlatform.y = iY;
        _oPlatform.visible = true;
        _oPlatform.alpha = 1;
        _bCanBeHitted = true;
        _oPlatform.gotoAndStop(_szStartingState);
        
        if(_bHaveObstacle){
            _oObstacle.setVisibleTrue(iX+PLATFORM_WIDTH/2, iY);
        }
    };
    
    this.changeStatusOff = function(){
        _oPlatform.x = -150;
        _oPlatform.y = CANVAS_HEIGHT+150;
        _oPlatform.visible = false;
    };
    
    this.spawnThorns = function(){
        if(_bCanBeHitted){
            _oPlatform.gotoAndStop("thorns_on");
            _szState = "thorns_on";
        }
    };
    
    this.playAlmostThornsOnAnimation = function(){
        if(_bCanBeHitted && !_bAnimationAlmostThornsOn){
            _oPlatform.gotoAndPlay("thorns_almost_on");
            _szState = "thorns_almost_on";
            _bAnimationAlmostThornsOn = true;
        }
    };
    
    this.hideThorns = function(){
        if(_bCanBeHitted){
            _oPlatform.gotoAndStop("thorns_off");
            _szState = "thorns_off";
            _bAnimationAlmostThornsOn = false;
        }
    };
    
    this.getRectangle = function(){
        return _oRectangle;
    };
    
    this.getType = function(){
        return _iType;
    };
    
    this.getY = function(){
        return _oPlatform.y;
    };
    
    this.getX = function(){
        return _oPlatform.x;
    };
    
    this.unload = function(){
        _oContainerPlatform.removeChild(_oPlatform); 
        _oPlatform = null;
        _oBonus = null;
    };
    
    this._init();
    
}
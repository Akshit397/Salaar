function CPlayer(oParentContainer){
    var _iVelocity = 0;
    var _iFallingSpeed = PLAYER_SPD_FALLING;
    var _iDir = -1;
    
    var _oPlayer;
    var _oPlayerChained;
    var _oPlayerLeft;
    var _oPlayerRight;
    var _oPlayerHammerLeft;
    var _oPlayerHammerRight;
    var _oPlayerDead;
    var _oParentContainer = oParentContainer;
    var _oRectangleMeasure;
    var _oRectangle;
    var _szState;
    
    var _bFalling = false;
    var _bMoving = false;
    var _bIdle = false;
    var _bHammer = false;
    var _bIsFlipped;
    var _bLeftPressed = false;
    var _bRightPressed = false;
    var _bGameStarted = false;
    
    var _oShape;
    
    this._init = function(){
        //LEFT
        var oPlayerSprite = s_oSpriteLibrary.getSprite("player_left");
        
        var oData = {   
            images: [oPlayerSprite], 
            framerate: 30,
            // width, height & registration point of each sprite
            frames: {width: PLAYER_WIDTH, height: PLAYER_HEIGHT, regX: PLAYER_WIDTH/2, regY: PLAYER_HEIGHT/2}, 
            animations: {idle:[0, 14, "idle"], moving:[15, 31, "moving"], start_falling:[32, 35, "falling"], falling:[34, 35, "falling"], landed:[36, 43, "idle"]}
        };
        _oPlayerLeft = new createjs.SpriteSheet(oData);
        
        //RIGHT
        var oPlayerSprite = s_oSpriteLibrary.getSprite("player_right");
        
        var oData = {   
            images: [oPlayerSprite], 
            framerate: 30,
            // width, height & registration point of each sprite
            frames: {width: PLAYER_WIDTH, height: PLAYER_HEIGHT, regX: PLAYER_WIDTH/2, regY: PLAYER_HEIGHT/2}, 
            animations: {idle:[0, 14, "idle"], moving:[15, 31, "moving"], start_falling:[32, 35, "falling"], falling:[34, 35, "falling"], landed:[36, 43, "idle"]}
        };
        _oPlayerRight = new createjs.SpriteSheet(oData);
        
        //PLAYER WITH HAMMER LEFT
        var oPlayerSprite = s_oSpriteLibrary.getSprite("player_hammer_left");
        
        var oData = {   
            images: [oPlayerSprite], 
            framerate: 30,
            // width, height & registration point of each sprite
            frames: {width: PLAYER_HAMMER_WIDTH, height: PLAYER_HAMMER_HEIGHT, regX: PLAYER_HAMMER_WIDTH/2, regY: PLAYER_HAMMER_HEIGHT/2}, 
            animations: {taking_hammer:[0, 8, "hammer_idle"], hammer_idle:[9, 13, "hammer_idle"]}
        };
        _oPlayerHammerLeft = new createjs.SpriteSheet(oData);
        
        //PLAYER WITH HAMMER RIGHT
        var oPlayerSprite = s_oSpriteLibrary.getSprite("player_hammer_right");
        
        var oData = {   
            images: [oPlayerSprite], 
            framerate: 30,
            // width, height & registration point of each sprite
            frames: {width: PLAYER_HAMMER_WIDTH, height: PLAYER_HAMMER_HEIGHT, regX: PLAYER_HAMMER_WIDTH/2, regY: PLAYER_HAMMER_HEIGHT/2}, 
            animations: {taking_hammer:[0, 8, "hammer_idle"], hammer_idle:[9, 13, "hammer_idle"]}
        };
        _oPlayerHammerRight = new createjs.SpriteSheet(oData);
        
        //CHAINED
        var oPlayerSprite = s_oSpriteLibrary.getSprite("player_start");
        
        var oData = {   
            images: [oPlayerSprite], 
            framerate: 30,
            // width, height & registration point of each sprite
            frames: {width: PLAYER_CHAINED_WIDTH, height: PLAYER_CHAINED_HEIGHT, regX: PLAYER_CHAINED_WIDTH/2, regY: PLAYER_CHAINED_HEIGHT/2}, 
            animations: {idle:[0], breaking_chains:[1, 47]}
        };
        _oPlayerChained = new createjs.SpriteSheet(oData);
        
        _oPlayer = createSprite(_oPlayerChained, "idle", 0, 0, PLAYER_WIDTH, PLAYER_HEIGHT);
        _oPlayer.x = PLAYER_X_START;
        _oPlayer.y = PLAYER_Y_START;
        _oParentContainer.addChild(_oPlayer);
        _oPlayer.on("animationend", this.letGameStart);
        
        _oRectangleMeasure = {x: _oPlayer.x-_oPlayer.regX-20, y: _oPlayer.y+40, width: PLAYER_CHAINED_WIDTH/2-45, height: PLAYER_CHAINED_HEIGHT-(PLAYER_CHAINED_HEIGHT/2)-40};
        
        _oRectangle = new createjs.Rectangle(_oRectangleMeasure.x, _oRectangleMeasure.y, _oRectangleMeasure.width, _oRectangleMeasure.height);
        /*_oShape = new createjs.Shape();
        _oShape.graphics.beginFill("#0000ff").drawRect(_oRectangleMeasure.x, _oRectangleMeasure.y, _oRectangleMeasure.width, _oRectangleMeasure.height);
        _oShape.alpha = 0.5;
        s_oStage.addChild(_oShape);*/
    };
    
    this.letGameStart = function(){
        if(_bGameStarted){
            return;
        }
        _oPlayer.off("animationend", this.letGameStart);
        _oPlayer.spriteSheet = _oPlayerLeft;
        _oParent.playIdleAnimation();
        s_oGame.letGameStart();
        _bGameStarted = true;
    };
    
    this.startGame = function(){
        playSound("wothan_broken_chains",0.5,false);
        _oPlayer.gotoAndPlay("breaking_chains");
        _szState = "breaking_chains";
    };
    
    this.flipSprite = function(iDir){
        if(iDir === GOING_RIGHT){
            if(!_bHammer){
                _iDir = GOING_RIGHT;
                _oPlayer.spriteSheet = _oPlayerRight;
            }else{
                _iDir = GOING_RIGHT;
                _oPlayer.spriteSheet = _oPlayerHammerRight;
            }
        }else if(iDir === GOING_LEFT){
            if(!_bHammer){
                _iDir = GOING_LEFT;
                _oPlayer.spriteSheet = _oPlayerLeft;
            }else{
                _iDir = GOING_LEFT;
                _oPlayer.spriteSheet = _oPlayerHammerLeft;
            }
        }
    };
    
    this.playDeadTween = function(){
        _oPlayer.visible = false;
        
        //PLAYER DEAD
        var oPlayerSprite = s_oSpriteLibrary.getSprite("player_dead");
        _oPlayerDead = createBitmap(oPlayerSprite);
        _oPlayerDead.x = _oPlayer.x;
        _oPlayerDead.y = _oPlayer.y;
        _oPlayerDead.regX = oPlayerSprite.width/2;
        _oPlayerDead.regY = oPlayerSprite.height/2;
        _oParentContainer.addChild(_oPlayerDead);
        
        createjs.Tween.get(_oPlayerDead).to({y: _oPlayerDead.y-100 }, 300, createjs.Ease.CubicIn).call(function() {
            createjs.Tween.get(_oPlayerDead).to({y: CANVAS_HEIGHT+200 }, 700, createjs.Ease.CubicOut).call(function() {
            });
        });
        
        this.spawnGhost();
        
    };
    
    this.spawnGhost = function(){
        var oPlayerSprite = s_oSpriteLibrary.getSprite("ghost");
        
        var oData = {   
            images: [oPlayerSprite], 
            framerate: 30,
            // width, height & registration point of each sprite
            frames: {width: PLAYER_GHOST_WIDTH, height: PLAYER_GHOST_HEIGHT, regX: PLAYER_GHOST_WIDTH/2, regY: PLAYER_GHOST_HEIGHT/2}, 
            animations: {idle:[0, 29, "idle"]}
        };
        var oPlayerGhostSprite = new createjs.SpriteSheet(oData);
        
        var oPlayerGhost = createSprite(oPlayerGhostSprite, "idle", 0, 0, PLAYER_GHOST_WIDTH, PLAYER_GHOST_HEIGHT);
        oPlayerGhost.x = this.getX();
        oPlayerGhost.y = CANVAS_HEIGHT+200;
        
        s_oStage.addChild(oPlayerGhost);
        createjs.Tween.get(oPlayerGhost).wait(1500).to({y: CANVAS_HEIGHT/2-80 }, 1500).call(function() {});
        if(oPlayerGhost.x > CANVAS_WIDTH/2){
            createjs.Tween.get(oPlayerGhost).wait(1500).to({x: oPlayerGhost.x-Math.abs(oPlayerGhost.x-CANVAS_WIDTH/2)/2 }, 500).call(function() {
                createjs.Tween.get(oPlayerGhost).to({x: oPlayerGhost.x+Math.abs(oPlayerGhost.x-CANVAS_WIDTH/2)/2 }, 500).call(function() {
                    createjs.Tween.get(oPlayerGhost).to({x: oPlayerGhost.x-Math.abs(oPlayerGhost.x-CANVAS_WIDTH/2) }, 500).call(function() {
                    });
                });
            });
        }else{
            createjs.Tween.get(oPlayerGhost).wait(1500).to({x: oPlayerGhost.x+Math.abs(CANVAS_WIDTH/2-oPlayerGhost.x)/2 }, 500).call(function() {
                createjs.Tween.get(oPlayerGhost).to({x: oPlayerGhost.x-Math.abs(CANVAS_WIDTH/2-oPlayerGhost.x)/2 }, 500).call(function() {
                    createjs.Tween.get(oPlayerGhost).to({x: oPlayerGhost.x+Math.abs(CANVAS_WIDTH/2-oPlayerGhost.x) }, 500).call(function() {
                    });
                });
            });
        }
    };
    
    this.playFallingAnimation = function(){
        if(_bFalling){
            return;
        }
        _oPlayer.gotoAndPlay("start_falling");
        _szState = "falling";
        _bFalling = true;
        _bIdle    = false;
        _bMoving  = false;
    };
    
    this.playIdleAnimation = function(){
        if(_bIdle){
            return;
        }
        _iFallingSpeed = PLAYER_SPD_FALLING;
        _oPlayer.gotoAndPlay("idle");
        _szState = "idle";
        if(_bFalling){
            playSound("wothan_landing", 1, false);
        }
        _bFalling = false;
        _bIdle    = true;
        _bMoving  = false;
    };
    
    this.playMovingAnimation = function(){
        if(_bMoving){
            return;
        }
        _oPlayer.gotoAndPlay("moving");
        _szState = "moving";
        _bFalling = false;
        _bIdle    = false;
        _bMoving  = true;
    };
    
    this.playerWithHammerOn = function(){
        if(_iDir === GOING_RIGHT){
            _oPlayer.spriteSheet = _oPlayerHammerRight;
        }else if(_iDir === GOING_LEFT){
            _oPlayer.spriteSheet = _oPlayerHammerLeft;
        }
        _oPlayer.gotoAndPlay("taking_hammer");
        _szState = "taking_hammer";
        _bHammer = true;
    };
    
    this.playerWithHammerOff = function(){
        if(_iDir === GOING_RIGHT){
            _oPlayer.spriteSheet = _oPlayerRight;
        }else if(_iDir === GOING_LEFT){
            _oPlayer.spriteSheet = _oPlayerLeft;
        }
        _oPlayer.gotoAndPlay("falling");
        _szState = "falling";
        _bHammer = false;
    };
    
    this.refreshRectangle = function(){
        _oRectangleMeasure = {x: _oPlayer.x-_oPlayer.regX-30, y: _oPlayer.y+50, width: PLAYER_WIDTH-65, height: PLAYER_HEIGHT-(PLAYER_HEIGHT/2)-50};
        _oRectangle.setValues(_oRectangleMeasure.x, _oRectangleMeasure.y, _oRectangleMeasure.width, _oRectangleMeasure.height);
        /*s_oStage.removeChild(_oShape);
        _oShape = new createjs.Shape();
        _oShape.graphics.beginFill("#0000ff").drawRect(_oRectangleMeasure.x, _oRectangleMeasure.y, _oRectangleMeasure.width, _oRectangleMeasure.height);
        _oShape.alpha = 0.5;
        s_oStage.addChild(_oShape);*/
    };
    
    this.playerFalling = function(){
        if(!_bFalling){
            this.playFallingAnimation();
        }
        _iFallingSpeed+=0.2;
        if(_iFallingSpeed >= PLAYER_MAX_SPD_FALLING){
            _iFallingSpeed = PLAYER_MAX_SPD_FALLING;
        }
        
        _oPlayer.y += _iFallingSpeed;
        
        this.refreshRectangle();
    };
    
    this.followPlatform = function(iVelocityObject){
        
        if(_iVelocity !== 0){
            this.playMovingAnimation();
        }else{
            this.playIdleAnimation();
        }
        
        _oPlayer.y += iVelocityObject;
        
        this.refreshRectangle();
    };
    
    this.moveLeft = function(bValue){
        if(bValue){
            _bRightPressed = false;
        }
        _bLeftPressed=bValue;
    };
    
    this.moveRight = function(bValue){
        if(bValue){
            _bLeftPressed = false;
        }
        _bRightPressed=bValue;	
    };
    
    //MOVE THE PLAYER
    this.movePlayer = function(iAcceleration){
        if(_bRightPressed){
            _iVelocity += iAcceleration; 
            if(_iVelocity >= PLAYER_SPD_MAX){
                _iVelocity = PLAYER_SPD_MAX;
            }
            if(_bIsFlipped){
                _bIsFlipped = false;
                this.flipSprite(GOING_LEFT);
            }     
        }else if(_bLeftPressed){
            _iVelocity -= iAcceleration; 
            if(_iVelocity <= -PLAYER_SPD_MAX){
                _iVelocity = -PLAYER_SPD_MAX;
            }
            if(!_bIsFlipped){
                _bIsFlipped = true;
                this.flipSprite(GOING_RIGHT);
            }          
        }else{
            _iVelocity = 0;
            if(!_bFalling){
                this.playIdleAnimation();
            }
        }
        this.addSpeedToPlayer(_iVelocity);

        if(this.getX() > CANVAS_WIDTH){
            this.setPos(0);
        }else if(this.getX() < 0){
            this.setPos(CANVAS_WIDTH);
        }
    };
    
    this.addSpeedToPlayer = function(iXToAdd){
        _oPlayer.x += iXToAdd;
        this.refreshRectangle();
    };
    
    this.addPos = function(){
        _oPlayer.x += _iVelocity;
        this.refreshRectangle();
    };
    
    this.setPos = function(newX){
        _oPlayer.x = newX;
        this.refreshRectangle();
    };
    
    this.returnState = function(){
        return _szState;
    };
    
    this.getRectangle = function(){
        return _oRectangle;
    };
    
    this.getSprite = function(){
        return _oPlayer;
    };
    
    this.getX = function(){
        return _oPlayer.x;
    };
    
    this.getY = function(){
        return _oPlayer.y;
    };
    
    var _oParent = this;
    
    this._init();
    
}
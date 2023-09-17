function CCharacter(iX, iY, oSprite)
{
    var _iStartingX;
    var _iStartingY;
    var _iGravityForce;
    var _iHalfHeight;
    var _iHeight;
    var _iWidth;
    var _oSprite;
    var _bOnGround;
    var _rChar;
    var _bOnCollision;
    var _sheetData;
    var _oMask;
    var _iTap;
    var _spriteSheet;
    var _bCrouch;
    var _bSoundPlayed;
    var _bGameOver;

    this.init = function (iX, iY, oSprite)
    {
        _iTap = 0;
        _bSoundPlayed = false;
        _bGameOver = false;
        _sheetData = {
            images: [oSprite],
            frames: {width: 120, height: 122, count: 32, regX: 60, regY: 61, spacing: 0, margin: 0},
            animations: {
                idle: [0, 14],
                jump: [15, 20],
                air: [18,23],
                land: [24,31],
                charge: [27]
            }
        };
        _spriteSheet = new createjs.SpriteSheet(_sheetData);
        _oSprite = new createjs.Sprite(_spriteSheet, "air");
        _iHeight = _sheetData.frames.height;
        _iWidth = _sheetData.frames.width;
        _iHalfHeight = _iHeight * 0.5;
        _bCrouch = false;
        _oSprite.x = _iStartingX = iX;
        _oSprite.y = _iStartingY = iY - iY / 1.8;
        _rChar = createRect(_oSprite.x - _iWidth / 2, _oSprite.y - _iHalfHeight, _iWidth, _iHeight);
        
        
         s_oStage.addChild(_oSprite);
         _oMask = new createjs.Shape();
        _oMask.graphics.beginFill("rgba(255,0,0,1)").drawRect(0, 0, 100, 5);
        _oMask.regX = 50;
        _oMask.x = _oSprite.x;
        _oMask.y = _oSprite.y - _iHeight/2;
        _oMask.scaleX = 0;
        s_oStage.addChild(_oMask);
        _iGravityForce = GRAVITY;
        _bOnCollision = false;
    };

    this.reset = function (){
        _iGravityForce = GRAVITY;
        _bOnGround = false;
    };
    
    this.getSprite = function (){
        return _oSprite;
    };
    
    this.getY = function (){
        return _oSprite.y;
    };
    
    this.getX = function ()
    {
        return _oSprite.x;
    };

    this.getHeight = function ()
    {
        return _iHeight;
    };

    this.getWidth = function ()
    {
        return _iWidth;
    };

    this.setCharge = function (bSet) 
    {
      _bCrouch = bSet;  
    };
    this.onGround = function ()
    {
        return _bOnGround;
    };
    this.isColliding = function ()
    {
        return _bOnCollision;
    };
    this.update = function (){
        _iGravityForce += 1;
        var vMoveByY = {x: 0, y: _iGravityForce},
                vMoveByX = {x: -s_oGame.getNextXPos(), y: 0},
                vMoveByXX = {x: s_oGame.getNextXPos(), y: 0},
                oCollisionY = null,
                oCollisionX = null,
                oCollisionXX = null,
                aObstacles = s_oGame.updateCollidables();
        _rChar = createRect(_oSprite.x - 32, _oSprite.y - _iHalfHeight, 64, _iHeight);
        oCollisionY = calculateObj2ArrCollision(_rChar, 'y', aObstacles, vMoveByY);
        oCollisionX = calculateObj2ArrCollision(_rChar, 'x', aObstacles, vMoveByX);
        oCollisionXX = calculateObj2ArrCollision(_rChar, 'x', aObstacles, vMoveByXX);
        _oSprite.y += vMoveByY.y;


        if (oCollisionX !== null){
            s_oGame.setUpdObst(false);
            oCollisionY = null;
        }else{
            if (!oCollisionY){
                if (_bOnGround === true){
                    _bOnGround = false;
                }
            }else{
                oCollisionX = null;
                s_oGame.setUpdObst(true);

                if (vMoveByY.y === 0){
                    if (_bSoundPlayed === false){
                        playSound("footstep", 1,false);
                        _bSoundPlayed = true;
                    }
                    _bOnGround = true;
                    s_oGame.setUpdObst(true);

                }
                _iGravityForce = 0;
            }
        }
        
        if (oCollisionY !== null && !_bOnGround) {
            s_oGame.increaseScore();

        }
        _oMask.x = _oSprite.x;
        _oMask.y = _oSprite.y - _iHeight/2;
        this.updateAnim();
        if (_oSprite.y > CANVAS_HEIGHT)
        {
            if (_bGameOver === false) {
                s_oGame.gameOver();
                _bGameOver = true;
            }
        }
    };
    
    this.updateGraphics = function (iTap){
        _iTap = iTap;
         if (iTap >= 25) 
        {
            _iTap= 25;
        }
        var percentage = _iTap / 25;
        _oMask.alpha = 1;
        createjs.Tween.get(_oMask).to({scaleX: percentage}, 100).call(function () { _oMask.alpha = 0.001});
    };
    
    this.updateAnim = function () {
        if (_bOnGround && _oSprite.currentAnimation !== "idle"){
           _oSprite.gotoAndStop("air");
           _oSprite.gotoAndPlay("idle");
        }
        
        if (!_bOnGround && _oSprite.currentAnimation === "charge"){
            _oSprite.gotoAndStop("charge");
            _oSprite.gotoAndPlay("air");
        }
        
        if (_bOnGround && _oSprite.currentAnimation === "idle" && _bCrouch === true){
            _oSprite.gotoAndStop("idle");
            _oSprite.gotoAndPlay("charge");
        }
    };
    
    this.jump = function (iMultiplier){
        if (_bOnGround){
            playSound("jump",1,false);
            _iGravityForce += -iMultiplier;
            _bSoundPlayed = false;
        }
    };


    this.init(iX, iY, oSprite);
}
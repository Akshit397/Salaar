function CGame() {
    var _bUpdate;
    var _bJumping
    var _oInterface;
    var _oObstacleManager;
    var _oCharacterManager;
    var _oParallax_0;
    var _oParallax_1;
    var _bTapping;
    var _iTappingTime;
    var _iScore;
    var _bCollision;
    var _oCollision;
    var _bUpdateObst;
    var _iBestScore;
    var _iWorld;
    var _bGameOver;

    this._init = function () {
        _bTapping = false;
        _bJumping = false;
        
        var aBackgroundsImages = new Array("bg_game", "bg_game_1", "bg_game_2")
        var aParallaxes = new Array("1_parallax_", "2_parallax_", "3_parallax_");
        _bGameOver = true;
        _iWorld = Math.floor(randomFloatBetween(0, aBackgroundsImages.length))
        setVolume("soundtrack", 0.4);

        _oParallax_0 = new CParallax(aBackgroundsImages[_iWorld], 2, true,  true, 0);
        
        if (_iWorld === 0)
        {
        _oParallax_1 = new CParallax(aParallaxes[_iWorld] + "0", 2, true,  false, 1100);
        }
        else if (_iWorld === 1)
        {
        _oParallax_1 = new CParallax(aParallaxes[_iWorld] + "0", 2, true,  false, CANVAS_HEIGHT);
        }
        else if (_iWorld === 2)
        {
        _oParallax_1 = new CParallax(aParallaxes[_iWorld], 2, false,  false, CANVAS_HEIGHT);

        }
        
         
        if (getItem(SCORE_ITEM_NAME) !== null)
        {
            _iBestScore = getItem(SCORE_ITEM_NAME);
        }
        else
        {
            _iBestScore = 0;
        }
        _iScore = 0;
        _oObstacleManager = new CObstacle(s_oSpriteLibrary.getSprite("obstacle_" + _iWorld.toString()));
        _oCharacterManager = new CCharacter(STARTX, STARTY, s_oSpriteLibrary.getSprite("hero"));

        _oInterface = new CInterface(_iBestScore);

        _oObstacleManager.update(0);

        _iTappingTime = 0;
        _bCollision = false;
        _oCollision = null;


        _bUpdate = true;
        _bUpdateObst = true;
    };



    this.unload = function () {
        _oInterface.unload();
        s_oStage.removeAllChildren();

        s_oGame = null;
    };
    this.restart = function () {
        _oInterface.unload();
        s_oStage.removeAllChildren();
        this._init();
    };

    this.gameOver = function () 
    {
        _bGameOver = true;
        if (_bGameOver)
        {
            if (_iWorld === 0) {
                playSound("splash",1,false);
            }
            else
            {
                playSound("hero_falling",1,false);
            }
            _bUpdateObst = false;
            _oInterface.gameOver();
            if (_iScore > getItem(SCORE_ITEM_NAME)) {
                saveItem(SCORE_ITEM_NAME, _iScore);
            }
            _bGameOver = false;
        }
    };
    this.increaseScore = function () {
       _iScore++;
       _oInterface.refreshScore(_iScore);
       _bJumping = false;
    };
    this.getScore = function () 
    {
      return _iScore; 
    };
    this.onExit = function () {
        setVolume("soundtrack", 1);

        s_oGame.unload();
        s_oMain.gotoMenu();

        $(s_oMain).trigger("end_session");
        $(s_oMain).trigger("save_score", _iScore);

        $(s_oMain).trigger("show_interlevel_ad");
    };
    this.getNextXPos = function (){
        return _oObstacleManager.getNextXPos();
    };

    this.updateCollidables = function (){
        return _oObstacleManager.getArray();
    };

    this.tapScreen = function () {
        if(_bJumping){
            return;
        }
        
        _bTapping = true;
        _oCharacterManager.setCharge(true);
    };
    
    this.releaseScreen = function () {
        if(_bJumping){
            return;
        }
        
        _bTapping = false;
        _bJumping = true;
       _oCharacterManager.updateGraphics(0);

        _oCharacterManager.setCharge(false);

        if (_iTappingTime > 25) {
        _iTappingTime = 25;

        }
        if (_iTappingTime < 10)
        {
        _iTappingTime = 10;
        }
        _oCharacterManager.jump(_iTappingTime);
        if (!_oCharacterManager.isColliding())
        {
        _oObstacleManager.setMoltiplier(_iTappingTime);
        _oParallax_0.setMoltiplier(_iTappingTime * 0.2);
        _oParallax_1.setMoltiplier(_iTappingTime * 0.6);
           }
        else 
        {
        _oObstacleManager.setMoltiplier(0);
        _oParallax_0.setMoltiplier(0);
        _oParallax_1.setMoltiplier(0);
       }
        _iTappingTime = 0;
     };

    this.setUpdObst = function (_bSet){
      _bUpdateObst = _bSet;  
    };
    
    this.update = function () {
        if (_bUpdate === false) {
            return;
        }

        if (_bTapping){
            _iTappingTime += 1;
            _oCharacterManager.updateGraphics(_iTappingTime);
        }
        
        _oCharacterManager.update();
        if(!_oCharacterManager.onGround() && _bUpdateObst)
        {
            _oObstacleManager.update();
            _oParallax_0.update();
            _oParallax_1.update();
        }
        
        _bJumping = !_oCharacterManager.onGround();
    };
    s_oGame = this;
    this._init();
}
var s_oGame;

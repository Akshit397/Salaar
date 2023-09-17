function CGame(oData){
    var _iScore = 0;
    var _iRowsOn = 0;
    var _iPlatformsDistance;
    var _iPlatformWithObstacles = 0;
    var _iPosition;
    var _iNumFree = 0;
    var _iNumRow = 0;
    var _iVelocityObject;
    var _iScoreAdder = 0;
    var _iPlayerAcceleration = 0;
    var _iPlatformCollided = 0;
    var _iThornTimer = 0;
    var _iPowerUpTimer = 0;
    
    var _oPlayer;
    
    var _oGameContainer;
    var _oPlayerContainer;
    var _oPlatformContainer;
    var _oBonus = null;
    
    //Platform types {0: Normal, 1: Moving, 2: PlatformWithObstacle}
    var _aTypeToSelect = [[0], [0, 0, 0, 0, 1, 1, 2]];
    
    var _aPlatform0Unused  = new Array();
    var _aPlatform1Unused  = new Array();
    var _aPlatform2Unused  = new Array();
    
    var _aPlatformInGame   = new Array();
    
    var _bThornOff = true;
    var _bUpdate = false;
    var _bIsGameOver = false;
    var _bGameStarted = false;
    var _bPlayerCanFall = true;
    var _bPowerUpOn = false;
    var _bDestroyPowerUpActivated = false;
    var _bTrembling = false;
        
    var _oInterface;
    var _oEndPanel = null;
    var _oParent = this;
    var _oScrollingBg;
    
    //INIT
    this._init = function(){
        
        playSound("ceiling",0.3,true);
        
        _iPosition = CANVAS_HEIGHT/2;
        _iVelocityObject = OBJECT_SPD;
        
        _iScoreAdder = Math.round(_iVelocityObject/7);
        
        _iPlatformsDistance = HEIGHT_BETWEEN_OBJECT;
        
        $(s_oMain).trigger("start_level", 1);
        _iNumRow = Math.floor((CANVAS_HEIGHT+_iPlatformsDistance)/_iPlatformsDistance);
        
        _oGameContainer = new createjs.Container();
        s_oStage.addChild(_oGameContainer);
        
        _oScrollingBg = new CScrollingBg(_oGameContainer);
                
        _oPlatformContainer = new createjs.Container();
        _oGameContainer.addChild(_oPlatformContainer);
        
        _aPlatformInGame.push(new CPlatform(0, 440, 3, _oPlatformContainer));
        
        for(var i=0; i<MAX_PLATFORM_FOR_TYPE; i++){
            _aPlatform0Unused.push(new CPlatform(-150, CANVAS_HEIGHT+150, 0, _oPlatformContainer));
            _aPlatform1Unused.push(new CPlatform(-150, CANVAS_HEIGHT+150, 1, _oPlatformContainer));
            _aPlatform2Unused.push(new CPlatform(-150, CANVAS_HEIGHT+150, 2, _oPlatformContainer));
        }
        
        this._controlIfAllReady();
        
        _oPlayerContainer = new createjs.Container();
        _oGameContainer.addChild(_oPlayerContainer);
        
        _oPlayer = new CPlayer(_oPlayerContainer);
        
        _oInterface = new CInterface();
       
        this.setUpdateTrue();
        this._initMovementControl();
    };
    
    this._controlIfAllReady = function(){
        if(_aPlatform0Unused.length === MAX_PLATFORM_FOR_TYPE){
            _iNumFree += _aPlatform0Unused.length;
        }
        if(_aPlatform1Unused.length === MAX_PLATFORM_FOR_TYPE){
            _iNumFree += _aPlatform1Unused.length;
        }
        if(_aPlatform2Unused.length === MAX_PLATFORM_FOR_TYPE){
            _iNumFree += _aPlatform2Unused.length;
        }
        
        if(_iNumFree >= MAX_PLATFORM_FOR_TYPE*(NUM_ELEMENTS-1)){
            for(var i=0; i<_iNumRow; i++){
                this._createRow();
            }
        }
        
        _iNumFree = 0;
    };
    
    //CREATE ROW
    this._createRow = function(){ 
        var iTypeSelected;
        var iLastElement;
        var iRangeToSelect = 0;
        
        //here I'm going to spawn platforms and bonusses
        _iPosition += _iPlatformsDistance;
        
        if(_iScore >= SCORE_TO_CHANGE_OCCURRENCE){
            iRangeToSelect = 1;
        }
        var iX = Math.random() * (CANVAS_WIDTH - PLATFORM_WIDTH);
        var iY = _iPosition;
        var iElement = Math.floor(Math.random() * _aTypeToSelect[iRangeToSelect].length);
        
        iTypeSelected = _aTypeToSelect[iRangeToSelect][iElement];
        
        //setting up the distance beetween platforms with obstacles
        if ((iTypeSelected === 1 || iTypeSelected === 2) && _iPlatformWithObstacles < SPAWN_DELAY_PLATFORM_OBSTACLES) {
            _iPlatformWithObstacles++;
            iTypeSelected = 0;
        }else if ((iTypeSelected === 1 || iTypeSelected === 2) && _iPlatformWithObstacles >= SPAWN_DELAY_PLATFORM_OBSTACLES) {
            _iPlatformWithObstacles = 0;
        }
        
        _aPlatformInGame.push( this.getFirstAvailableObstacle(iTypeSelected));
        iLastElement = _aPlatformInGame.length-1;
        if( _aPlatformInGame[iLastElement] !== null){
            _aPlatformInGame[iLastElement].changeStatusOn(iX, iY);
        }else{
            _aPlatformInGame.pop();
        }
        
        var iValue = Math.round((Math.random()* 100));
        if(iValue <= BONUS_OCCUR && (!_oBonus) && _iScore > 200 && !_bDestroyPowerUpActivated){
            var pPos1 = {x: _aPlatformInGame[iLastElement].getX(), y: _aPlatformInGame[iLastElement].getY()};
            var pPos2 = {x: _aPlatformInGame[iLastElement-1].getX(), y: _aPlatformInGame[iLastElement-1].getY()};
            
            var pPosToUse = centerBetweenPointsV2( pPos1, pPos2 );
            
            var iValue = Math.round(Math.random());
            
            if(iValue === 0){
                _oBonus = new CBonus(pPosToUse.getX(), pPosToUse.getY(), SLOW, _oPlatformContainer );
            }else{
                _oBonus = new CBonus(pPosToUse.getX(), pPosToUse.getY(), DESTROY, _oPlatformContainer );
            }
        }
          
    };
    
    this.getFirstAvailableObstacle = function(iType){
        var oApp;
        var iLastElement;
        switch (iType){
            case 0:
                if(_aPlatform0Unused.length > 0){
                    iLastElement = _aPlatform0Unused.length-1;
                    oApp = _aPlatform0Unused[iLastElement];
                    _aPlatform0Unused.pop();
                    return oApp;
                }else{
                    return null;
                }
            case 1:
                if(_aPlatform1Unused.length > 0){
                    iLastElement = _aPlatform1Unused.length-1;
                    oApp = _aPlatform1Unused[iLastElement];
                    _aPlatform1Unused.pop();
                    return oApp;
                }else{
                    return null;
                }
            case 2:
                if(_aPlatform2Unused.length > 0){
                    iLastElement = _aPlatform2Unused.length-1;
                    oApp = _aPlatform2Unused[iLastElement];
                    _aPlatform2Unused.pop();
                    return oApp;
                }else{
                    return null;
                }
        }
    };
    
    //DETECTIONG MOUSE MOVE
    this._initMovementControl = function(){
        document.onkeydown = this.onKeyDown;
        document.onkeyup = this.onKeyUp; 
        _iPlayerAcceleration = PLAYER_ACCELERATION;
        
    };
    
    this.onKeyDown = function(evt){
        if(!evt){ 
            evt = window.event; 
        } 
        
        if( evt.keyCode === LEFT_DIR ) { //left
            _oPlayer.moveLeft(true);
            evt.preventDefault();
            return false;            
        }else if( evt.keyCode === RIGHT_DIR ) { //right
            _oPlayer.moveRight(true);
            evt.preventDefault();
            return false;
        }else if( evt.keyCode === SPACEBAR || evt.keyCode === UP_DIR || evt.keyCode === DOWN_DIR ) {
            evt.preventDefault();
            return false;
        }
    };
    
    this.onKeyUp = function(evt){
        if(!evt){ 
            evt = window.event; 
        } 
        
        if( evt.keyCode === LEFT_DIR ) { //left
            _oPlayer.moveLeft(false);
            evt.preventDefault();
            return false;            
        }else if( evt.keyCode === RIGHT_DIR ) { //right
            _oPlayer.moveRight(false);
            evt.preventDefault();
            return false;
        }else if( evt.keyCode === SPACEBAR || evt.keyCode === UP_DIR || evt.keyCode === DOWN_DIR ) {
            evt.preventDefault();
            return false;
        }
        
    };
    
    this.onButtonDown = function(iValue){     
        if( iValue === LEFT_DIR ) { //left
            _oPlayer.moveLeft(true);
        }else if( iValue === RIGHT_DIR ) { //right
            _oPlayer.moveRight(true);
        }
    };
    
    this.onButtonUp = function(iValue){      
        if( iValue === LEFT_DIR ) { //left
            _oPlayer.moveLeft(false);
        }else if( iValue === RIGHT_DIR ) { //right
            _oPlayer.moveRight(false);
        }
        
    };
    
    //START GAME
    this.setUpdateTrue = function(){
        if(_bUpdate || _bIsGameOver){
            return;
        }
        _oPlayer.startGame();
        
        _bUpdate = true;
    };
    
    this.letGameStart = function(){
        _bGameStarted = true;
    };
    
    this.spawnThorns = function(){
        var bThereIsThorn = false;
        for(var i=0; i < _aPlatformInGame.length; i++){
            if(_aPlatformInGame[i].getType() === 1){
                _aPlatformInGame[i].spawnThorns();
                bThereIsThorn = true;
            }
        }
        if(bThereIsThorn){
            playSound("spikes",1,false);
        }
    };
    
    this.playAlmostThornsOnAnimation = function(){
        for(var i=0; i < _aPlatformInGame.length; i++){
            if(_aPlatformInGame[i].getType() === 1){
                _aPlatformInGame[i].playAlmostThornsOnAnimation();
            }
        }
    };
    
    this.hideThorns = function(){
        for(var i=0; i < _aPlatformInGame.length; i++){
            if(_aPlatformInGame[i].getType() === 1){
                _aPlatformInGame[i].hideThorns();
            }
        }
    };
    
    //MOVE OBJECT AND CONTROLS IF OVER CANVAS
    this.moveObject = function(){
        var iPlatformHitted = 0;                    //0:Not Hitted, 1: Platform Hitted
        var oApp = null;
        
        _oScrollingBg.move(_iVelocityObject);
        
        for(var i=0; i < _aPlatformInGame.length; i++){
            _aPlatformInGame[i].move(_iVelocityObject);
            
            iPlatformHitted = _aPlatformInGame[i].controlCollision(_oPlayer.getRectangle());
            if(iPlatformHitted === PLATFORM){
                if(!_bDestroyPowerUpActivated){
                    _bPlayerCanFall = false;
                    _iPlatformCollided = i;
                }else{
                    _aPlatformInGame[i].startAnimationDestroyed();
                    _iScore += SCORE_BREAKED_PLATFORM;
                    this.applyTrembling();
                }
            }else if(iPlatformHitted === THORNS){
                if(!_bDestroyPowerUpActivated){
                    this.gameOver();
                    _bIsGameOver = true;
                    _bUpdate = false;
                }else{
                    _aPlatformInGame[i].startAnimationDestroyed();
                    _iScore += SCORE_BREAKED_PLATFORM+5;
                    this.applyTrembling();
                }
            }else if(iPlatformHitted === OBSTACLE){
                if(!_bDestroyPowerUpActivated){
                    this.gameOver();
                    _bIsGameOver = true;
                    _bUpdate = false;
                }else{
                    _aPlatformInGame[i].startAnimationDestroyed();
                    _iScore += SCORE_BREAKED_PLATFORM+10;
                    this.applyTrembling();
                }
            }

            iPlatformHitted = _aPlatformInGame[_iPlatformCollided].controlCollision(_oPlayer.getRectangle());
            if(iPlatformHitted < 0){
                _bPlayerCanFall = true;
                _iPlatformCollided = 0;
            }

        
            oApp = this._controlIfPlatformOverCanvas(i);
            
            if(oApp !== null){
                switch(oApp.getType()){
                    case 0:
                        _aPlatform0Unused.push(oApp);
                        break;
                    case 1:
                        _aPlatform1Unused.push(oApp);
                        break;
                    case 2:
                        _aPlatform2Unused.push(oApp);
                        break;
                } 
                i--;
            }
        }
            
        if(_oBonus){
            _oBonus.move(_iVelocityObject);
            var bBonusTaken = _oBonus.controlCollision(_oPlayer.getRectangle());
            if(bBonusTaken){
                if(_oBonus.getType() === SLOW){
                    this._slowDownPowerUpOn();
                }else{
                    this._destroyPowerUpOn();
                }
                _oBonus.unload();
                _oBonus = null;
            }else{
                var bBonusOverCanvas = _oBonus.checkIfOverCanvas();
                if(bBonusOverCanvas){
                    _oBonus.unload();
                    _oBonus = null;
                }
            }
        }
    };
    
    this.applyTrembling = function(){
        playSound("platform_broken", 1, false)
        if(!_bTrembling){
            _bTrembling = true;
            
            var xShifting = 10;
            var yShifting = 30;

            createjs.Tween.get(s_oStage).to({x: Math.round(Math.random()*xShifting), y: Math.round(Math.random()*yShifting) }, 50).call(function() {
                createjs.Tween.get(s_oStage).to({x: Math.round(Math.random()*xShifting*0.8), y:-Math.round(Math.random()*yShifting*0.8) }, 50).call(function() {
                    createjs.Tween.get(s_oStage).to({y:0, x:0 }, 50).call(function() {
                        _bTrembling = false;
                    });
                });
            });
        }
    };
    
    this._slowDownPowerUpOn = function(){
        playSound("power_up_slow",1,false);
        _bPowerUpOn = true;
        _iVelocityObject = _iVelocityObject/2;
    };
    
    this._slowDownPowerUpOff = function(){
        _bPowerUpOn = false;
        _iVelocityObject = _iVelocityObject*2;
    };
    
    this._destroyPowerUpOn = function(){
        playSound("wothan_hammer",1,false);
        _bPowerUpOn = true;
        _bDestroyPowerUpActivated = true;
        _iVelocityObject = _iVelocityObject*2;
        _oPlayer.playerWithHammerOn();
    };
    
    this._destroyPowerUpOff = function(){
        _bPowerUpOn = false;
        _bDestroyPowerUpActivated = false;
        _iVelocityObject = _iVelocityObject/2;
        _oPlayer.playerWithHammerOff();
    };
    
    this._controlIfPlatformOverCanvas = function(i){
        var oApp;
        
        if(_aPlatformInGame[i].getY() <= -100){
            if(i < _aPlatformInGame.length-1){
                _aPlatformInGame[i].changeStatusOff();
                oApp = _aPlatformInGame[i];
                _aPlatformInGame.splice(i, 1);
                if(_aPlatformInGame[i].getType !== 3){
                    _iRowsOn--;
                    this._createRow();
                }
                return oApp;
            }
        }
        
        return null;
    };
    
    this.handlePlayerMovement = function(){
        _oPlayer.movePlayer(_iPlayerAcceleration);

        if(!_bDestroyPowerUpActivated){
            if(_bPlayerCanFall){
                _oPlayer.playerFalling();
            }else{
                _oPlayer.followPlatform(_iVelocityObject);
            }
        }
    };
    
    this.handlePowerUp = function(){
        if(_bPowerUpOn){
            _iPowerUpTimer += s_iTimeElaps;
            if(_iPowerUpTimer >= TIME_SLOW_DOWN_POWERUP){
                if(!_bDestroyPowerUpActivated){
                    this._slowDownPowerUpOff();
                }else{
                    this._destroyPowerUpOff();
                }
                _iPowerUpTimer = 0;
            }
        }
    };
    
    this.handleThorns = function(){
        if(_bThornOff){
            _iThornTimer += s_iTimeElaps;
            if(_iThornTimer >= TIME_TO_SPAWN_THORNS){
                this.spawnThorns();
                _bThornOff = !_bThornOff;
                _iThornTimer = 0;
            }else if(_iThornTimer >= TIME_TO_SPAWN_THORNS/2 && _iThornTimer < TIME_TO_SPAWN_THORNS){
                this.playAlmostThornsOnAnimation();
            }
        }else{
            _iThornTimer += s_iTimeElaps;
            if(_iThornTimer >= TIME_TO_HIDE_THORNS){
                this.hideThorns();
                _bThornOff = !_bThornOff;
                _iThornTimer = 0;
            }
        }
    };
    
    this.setScore = function(){
        if(!_bIsGameOver && (_iScore + Math.abs(Math.floor(_iScoreAdder))) >0){
            _iScore += Math.abs(Math.floor(_iScoreAdder));
            _oInterface.refreshScore(_iScore);
            if(_iScore % SCORE_TO_REACH_FOR_INCREMENT_SPEED === 0 && !_bPowerUpOn){
                _iVelocityObject += OBJECT_SPD_ADDER;
                _iScoreAdder = Math.round(_iVelocityObject/7);
            }
        }
    };
    
    this.controlIfGameOver = function(){
        if(_oPlayer.getY() < 150 || _oPlayer.getY() > CANVAS_HEIGHT){
            return true;
        }
        return false;
    };
    
    this.unload = function(){
        _oInterface.unload();
        if(_oEndPanel !== null){
            _oEndPanel.unload();
            _oEndPanel =null;
        }
        
        _aPlatformInGame = [];

        _aPlatform0Unused = [];
        _aPlatform1Unused = [];
        _aPlatform2Unused = [];

        
        createjs.Tween.removeAllTweens();
        s_oStage.removeAllChildren(); 
    };
 
    this.onExit = function(){
        this.unload();
        stopSound("ceiling");
        
        s_oMain.gotoMenu();
        
        $(s_oMain).trigger("end_level", 1);
        $(s_oMain).trigger("show_interlevel_ad");
        $(s_oMain).trigger("end_session");
    };
 
    this.onRestart = function(){
        this.unload();
        
        $(s_oMain).trigger("end_level", 1);
        $(s_oMain).trigger("show_interlevel_ad");
        
        s_oMain.gotoGame();
    };
    
    this.gameOver = function(){  
        _oEndPanel = CEndPanel(s_oSpriteLibrary.getSprite('msg_box'));
        
        _oPlayer.playDeadTween();
        playSound("death", 1, false);
        
        setTimeout(function(){
            stopSound("ceiling");
            if(_oEndPanel){
                _oEndPanel.show(_iScore);
            }
        },2500);
        
    };
    
    //UPDATE
    this.update = function(){
        if(_bUpdate){
            
            if(_bGameStarted){
                
                this.handleThorns();

                this.handlePowerUp();

                this.handlePlayerMovement();

                this.moveObject();

                _iPosition = _aPlatformInGame[_aPlatformInGame.length-1].getY();

                this.setScore();

                if(this.controlIfGameOver() && !_bIsGameOver){
                    this.gameOver();
                    _bIsGameOver = true;
                    _bUpdate = false;
                    _bGameStarted = false;
                }
            }else{
                //_oPlayer.update();
            }
        }
    };

    s_oGame=this;
    
    _oParent=this;
        
    PLAYER_SPD_MAX                     = oData.player_spd;
    PLAYER_SPD_FALLING                 = oData.player_spd_falling;
    PLAYER_MAX_SPD_FALLING             = oData.player_max_spd_falling;
    PLAYER_ACCELERATION                = oData.player_acceleration;
    PLAYER_DECELERATION                = oData.player_deceleration;
    OBJECT_SPD                         = oData.object_spd;
    OBJECT_SPD_ADDER                   = oData.object_spd_adder;
    SCORE_TO_REACH_FOR_INCREMENT_SPEED = oData.score_to_reach_for_increment_speed;
    OBJECT_SPD_ORIZZONTAL              = oData.object_spd_orizzontal;
    GAMMA_RANGE_ACCEPTED               = oData.gamma_range_accepted;
    CANVAS_WIDTH_RANGE_ACCEPTED        = oData.canvas_half_width_range_accepted;
    HEIGHT_BETWEEN_OBJECT              = oData.height_between_object;
    TIME_TO_SPAWN_THORNS               = oData.time_to_spawn_thorns;
    TIME_TO_HIDE_THORNS                = oData.time_to_hide_thorns;
    BONUS_OCCUR                        = oData.bonus_occur;
    TIME_SLOW_DOWN_POWERUP             = oData.time_slow_down_powerup;
    SCORE_BREAKED_PLATFORM             = oData.score_breaked_platform;
    SCORE_TO_CHANGE_OCCURRENCE         = oData.score_to_change_occurrence;
    SPAWN_DELAY_PLATFORM_OBSTACLES     = oData.spawn_delay_platform_obstacles;
    
    this._init();
}

var s_oGame;

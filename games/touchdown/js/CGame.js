function CGame(){
    var _bUpdate = false;
    var _bPowerUpActive;
    var _bKeyDown;
    var _bTouchDown;
    var _bGameOver;
    
    var _iTotScore;
    var _iCurLevelScore;
    var _iCurLevel;
    var _iTimeElapsSpawn;
    var _iNumEnemiesSpawn;
    var _iCurEnemySpawnTime;
    var _iCurMaxEnemySpawnNumber;
    var _iOffsetScaleBg;
    var _iCurTrembleIndex;
    var _iIdInterval;
    var _iTimeElapsPowerUp;
    var _aOpponent;
    var _aPowerUps;
    var _aSpawnX;
    var _aCurPowerUpSpawnTime;
    var _aTrembleSequence;
    
    var _oBg;
    var _oPost;
    var _oField;
    var _oFieldEndZone;
    var _oInterface;
    var _oContainerField;
    var _oContainerOpponent;
    var _oPlayer;
    var _oHelpPanel;
    var _oEndPanel;
    var _oNextLevelPanel;
    
    this._init = function(){
        _iCurLevel = s_iLevelSelected;
        _iTotScore = s_oMain.getScoreTillLevel(_iCurLevel);
        
        _aTrembleSequence = new Array({x:10,y:0},{x:-20,y:0},{x:10,y:-10},{x:0,y:20},{x:10,y:-10},{x:-10,y:0},{x:10,y:0},{x:-20,y:0},{x:10,y:-10},{x:0,y:20},{x:10,y:-10},{x:-10,y:0});
        
        _oContainerField = new createjs.Container();
        s_oStage.addChild(_oContainerField);
        
	var oSpriteBg = s_oSpriteLibrary.getSprite('bg_game');
        _oBg = createBitmap(oSpriteBg);
        _oBg.regX = oSpriteBg.width/2;
        _oBg.regY = oSpriteBg.height;
        _oBg.x = CANVAS_WIDTH/2;
        _oBg.y = 521;
        _oContainerField.addChild(_oBg);
        
        _oField = new CField(0,516,_oContainerField);
        _oField.show();
        
        _oFieldEndZone = new CFieldEndZone(0,516,_oContainerField);
        
        var oSpritePost = s_oSpriteLibrary.getSprite("post");
        _oPost = createBitmap(oSpritePost);
        _oPost.regX = oSpritePost.width/2;
        _oPost.regY = oSpritePost.height;
        _oPost.x = CANVAS_WIDTH - 450;
        _oPost.y = 518;
        _oContainerField.addChild(_oPost);
        
        
        _oContainerOpponent = new createjs.Container();
        _oContainerField.addChild(_oContainerOpponent);
        
        _oPlayer = new CPlayer(CANVAS_WIDTH/2,CANVAS_HEIGHT-s_iOffsetY,_oContainerField);
        _oPlayer.addEventListener(ON_PLAYER_TOUCHDOWN,this._onWinLevel,this);
        _oPlayer.addEventListener(ON_PLAYER_TACKLED,this._onEndLevel,this);
        
        _oInterface = new CInterface(_iTotScore);
        
        this.reset();

        _oHelpPanel = new CHelpPanel();
        _oHelpPanel.show();
        
        _oEndPanel = new CEndPanel();
        _oEndPanel.addEventListener(ON_RESTART,this.restart,this);
        _oEndPanel.addEventListener(ON_BACK_MENU,this.onExit,this);
        
        _oNextLevelPanel = new CNextLevelPanel();
        _oNextLevelPanel.addEventListener(ON_RESTART,this.restart,this);
        _oNextLevelPanel.addEventListener(ON_BACK_MENU,this.onExit,this);
        _oNextLevelPanel.addEventListener(ON_NEXT_LEVEL,this._onNextLevel,this);

        playSound("crowd_idle",1,true);
    };
    
    this.unload = function(){
        _bUpdate = false;
        stopSound("crowd_idle");
        
        _oInterface.unload();
       
        s_oStage.removeAllChildren();
    };
    
    this.reset = function(){    
        _bTouchDown = false;
        _bKeyDown = false;
        _bGameOver = false;
        _bPowerUpActive = false;
        _iCurLevelScore = 0;
        _iTimeElapsSpawn = 0;

        _aOpponent = new Array();
        _aPowerUps = new Array();
        
        _iNumEnemiesSpawn = s_oLevelSettings.getEnemiesSpawn(_iCurLevel);
        _iCurEnemySpawnTime = s_oLevelSettings.getStartingEnemySpawn(_iCurLevel);
        _iCurMaxEnemySpawnNumber = s_oLevelSettings.getEnemySpawnNumber(_iCurLevel);
        _aCurPowerUpSpawnTime = s_oLevelSettings.getPowerUps(_iCurLevel);
        
        
        _iTotScore = s_oMain.getScoreTillLevel(_iCurLevel);
        _iOffsetScaleBg = parseFloat( ((1-STARTING_STANDS_SCALE_BONUS)/_iNumEnemiesSpawn).toFixed(3));
        
        this._createSpawnArray();
        
        _oFieldEndZone.reset();
        _oPlayer.reset();
        _oInterface.reset(_iTotScore,_iCurLevel);
        
        _oBg.scaleX = _oBg.scaleY = STARTING_STANDS_SCALE_BONUS;
        _oPost.scaleX = _oPost.scaleY = 0.2;
        
        setVolume("crowd_idle",1);

        $(s_oMain).trigger("start_level",_iCurLevel);
    };
    
    this.restart = function(){
        $(s_oMain).trigger("restart_level",_iCurLevel);
        
        //REMOVE POWERUPS EVENTUALLY
        for(var i=0;i<_aPowerUps.length;i++){
            _aPowerUps[i].unload();
        }
        
        this.reset();
        
        this.startCountdown();
    };
    
    this.refreshButtonPos = function(){
        _oInterface.refreshButtonPos();
        
        _oPlayer.setY(CANVAS_HEIGHT-s_iOffsetY);
    };
    
    this.onKeyDown = function(evt) {
        if (_oPlayer.isJumping() || _bGameOver || _oPlayer.getCurAnim() === PLAYER_ANIM_TOUCHDOWN){
            evt.preventDefault();
            return false;
        }
        
        if(!evt){ 
            evt = window.event; 
        }  

        switch(evt.keyCode) {  
            // left  
            case 37: {
                _bKeyDown = true;
                _oPlayer.moveLeft(true);
                break; 
            }
                              
            // right  
            case 39: {
                _bKeyDown = true;
                _oPlayer.moveRight(true);
                break; 
            }
            case 32:{
                //JUMP
                _bKeyDown = true;
                _oPlayer.jump();
            }
        } 
        
        evt.preventDefault();
        return false;
    };
    
    this.onKeyUp = function(evt) { 
        if (  _bGameOver){
            evt.preventDefault();
            return false;
        }
        
        if(!evt){ 
            evt = window.event; 
        } 

        _bKeyDown = false;
        switch(evt.keyCode) {  
           // left  
           case 37: {
                   _oPlayer.moveLeft(false);
                   break; 
               }
                              
           // right  
           case 39: {
                   _oPlayer.moveRight(false);
                   break; 
               }
            case 32:{
                    break;
            }
        } 
        
        evt.preventDefault();
        return false;
    };
    
    this.moveLeft = function(bLeft){
        if((bLeft && (_bKeyDown || _oPlayer.isJumping())) || _bGameOver){
            return;
        }
        
        _bKeyDown = bLeft;
        _oPlayer.moveLeft(bLeft);
    };
    
    this.moveRight = function(bRight){
        if((bRight && (_bKeyDown || _oPlayer.isJumping())) || _bGameOver){
            return;
        }
        
        _bKeyDown = bRight;
        _oPlayer.moveRight(bRight);
    };
    
    this.moveJump = function(bJump){
        if( (bJump && (_bKeyDown || _oPlayer.isJumping())) || _bGameOver){
            return;
        }
        
        _bKeyDown = bJump;
        if(bJump){
            _oPlayer.jump();
        }
        
    };
    
    this.startCountdown = function(){
        _oPlayer.show();
        
        this._spawnEnemy();
        
        _bUpdate = true;
    };
    
    this._createSpawnArray = function(){
        _aSpawnX = new Array();

        var iCurX = s_iOffsetX+50;
        var iOffset = Math.floor(Math.random() * (CANVAS_WIDTH-s_iOffsetX - s_iOffsetX + 1)) + s_iOffsetX+50;
        iOffset /= s_oLevelSettings.getEnemiesSpawn(_iCurLevel);
        
        while(iCurX < (CANVAS_WIDTH-s_iOffsetX)){
            _aSpawnX.push(iCurX);
            iCurX += iOffset;
        }

        _aSpawnX = shuffle(_aSpawnX);
    };
    
    this.onExitFromHelp = function(){
        
        this.startCountdown();
    };
    
    this._spawnEnemy = function(){
        var iRand = Math.floor(Math.random() * _iCurMaxEnemySpawnNumber) + 1;
        for(var k=0;k<iRand;k++){
            if(_iNumEnemiesSpawn === 0){
                return;
            }
            
            //SPAWN ENEMY
            _iNumEnemiesSpawn--;

            var bLastOpponent = false;
            if(_iNumEnemiesSpawn === 0){
                bLastOpponent = true;
                _bTouchDown = true;
            }

            
            var oOpponent = new COpponent(bLastOpponent,_aSpawnX.pop(),526,_oContainerOpponent);
            oOpponent.addEventListener(ON_OPPONENT_HIDE,this.checkTouchDown,this);
            oOpponent.addEventListener(ON_OPPONENT_TACKLE,this.checkCollision,this);

            _aOpponent.push(oOpponent);

            //SCALE BACKGROUND AND POST
            var iNewScale = _oBg.scaleX + _iOffsetScaleBg;
            new createjs.Tween.get(_oBg).to({scaleX:iNewScale,scaleY:iNewScale},_iCurEnemySpawnTime);

            var iNewScalePost = _oPost.scaleX +_iOffsetScaleBg;
            new createjs.Tween.get(_oPost).to({scaleX:iNewScalePost,scaleY:iNewScalePost,x:_oPost.x + (750*_iOffsetScaleBg)},_iCurEnemySpawnTime);


            //CHECK IF MUST SHOW POWER UP
            if(_aCurPowerUpSpawnTime.indexOf(_aOpponent.length) !== -1){
                this._spawnPowerUp();
            }
        }
        
    };
    
    this._spawnPowerUp = function(){
        var iX = Math.floor(Math.random() * (MAX_POWERUP_X - MIN_POWERUP_X + 1)) + MIN_POWERUP_X;
        var iRandType = Math.floor(Math.random()*2);
        var oPowerUp = new CPowerUp(iX,510,iRandType,_oContainerOpponent);
        oPowerUp.addEventListener(ON_POWERUP_END_MOVE,this._checkCollisionWithPowerUp,this);
        
        _aPowerUps.push(oPowerUp);
    };
    
    this.checkTouchDown = function(bLast){
        if(bLast && !_bGameOver){
            this._showTouchdown();
        }
    };
    
    this.checkCollision = function(oEnemyRect){
        if(_bGameOver){
            return;
        }
        
        //CHECK COLLISION BETWEEN PLAYER AND OPPONENTS
        var oRectPlayer = _oPlayer.getRect();
        
        var iDistX = Math.abs(oEnemyRect.x-oRectPlayer.x);

        if( oRectPlayer.intersects(oEnemyRect)){

            if(_oPlayer.isJumping()){
                
                if(iDistX > MAX_DIST_AVOID_OPPONENT_IN_JUMP){
                    this.refreshScore(Math.floor(iDistX/200));
                    return;
                }
            }
            
            _bGameOver = true;
            
            _iCurTrembleIndex = 0;
            var oParent = this;
            _iIdInterval = setInterval(function(){oParent.tremble();},20);
            
            playSound("enemy_tackle",1,false);
            _oPlayer.changeAnim(PLAYER_ANIM_FALL);
            
            //STOP POWERUPS EVENTUALLY
            for(var k=0;k<_aPowerUps.length;k++){
                _aPowerUps[k].stopTween();
            }
        }else{
            this.refreshScore(Math.floor(iDistX/200));
        }
    };
    
    this._checkCollisionWithPowerUp = function(oPowerUpRect,iType){
        if(_bGameOver){
            return;
        }
        
        var oRectPlayer = _oPlayer.getRect();
        //trace("oPowerUpRect "+JSON.stringify(oPowerUpRect))
        //trace("oRectPlayer "+JSON.stringify(oRectPlayer))
        if( oRectPlayer.intersects(oPowerUpRect)){
            playSound("powerup",1,false);
            
            switch(iType){
                case 0:{
                        //SCORE BONUS
                        this.refreshScore(SCORE_POWERUP);
                        
                        new CScoreText(SCORE_POWERUP,CANVAS_WIDTH/2,CANVAS_HEIGHT/2,s_oStage);
                        break;
                }
                case 1:{
                        //SPEED UP PLAYER
                        _oPlayer.setAcceleration(HERO_SUPER_ACCELERATION,MAX_HERO_SPEED*2);
                        
                        _iTimeElapsPowerUp = 0;
                        _bPowerUpActive=true;
                        
                        _oInterface.showPowerUpGui();
                        break;
                }
            }
        }
    };
    
    this.tremble = function(){
        var oDir = _aTrembleSequence[_iCurTrembleIndex];
        _oContainerField.x = _oContainerField.x + oDir.x;
        _oContainerField.y = _oContainerField.y + oDir.y;

        _iCurTrembleIndex++;
        if(_iCurTrembleIndex === _aTrembleSequence.length){
            _iCurTrembleIndex = 0;
            clearInterval(_iIdInterval);
        }
    };
    
    this.refreshScore = function(iAmount){
        _iCurLevelScore += iAmount;
        _iTotScore += iAmount;
        
        _oInterface.refreshScore(_iTotScore);
    };
    
    this._showTouchdown = function(){
        playSound("crowd_touchdown",1,false);
        
        _oFieldEndZone.show();
        var iNewScale = _oBg.scaleX + _iOffsetScaleBg;
        new createjs.Tween.get(_oBg).to({scaleX:iNewScale,scaleY:iNewScale},1200);

        var iNewScalePost = _oPost.scaleX +_iOffsetScaleBg;
        new createjs.Tween.get(_oPost).to({scaleX:iNewScalePost,scaleY:iNewScalePost,x:_oPost.x + 500,y:_oPost.y + 60},1000);

        setTimeout(function(){_oPlayer.changeAnim(PLAYER_ANIM_TOUCHDOWN);},500);
    };
    
    this._manageOpponentDepth = function(){
        var sortFunction = function(obj1, obj2, options) {
            if (obj1.y > obj2.y) { return 1;}
            if (obj1.y < obj2.y) { return -1;}
            return 0;
        };
        
        _oContainerOpponent.sortChildren(sortFunction);
    };
    
    this.endZonePlayed = function(){
        
    };

    this._onEndLevel = function(){
        $(s_oMain).trigger("end_level",_iCurLevel);
        
        setVolume("crowd_idle",0);
        setTimeout(function(){_oEndPanel.show(_iTotScore,TEXT_GAME_OVER);},2000);
    };
    
    this._onWinLevel = function(){
        setVolume("crowd_idle",0);
        
        $(s_oMain).trigger("end_level",_iCurLevel);
        $(s_oMain).trigger("save_score",_iTotScore);
        
        if(_iCurLevel === NUM_LEVELS){
            setTimeout(function(){_oEndPanel.show(_iTotScore,TEXT_CONGRATS);},2000);
        }else{
            s_oMain.setLocalStorageLevel(_iCurLevel+1);
            s_oMain.setLocalStorageScore(_iCurLevelScore,_iCurLevel);
            setTimeout(function(){_oNextLevelPanel.show(_iCurLevelScore,_iTotScore,_iCurLevel);},2000);
        }
        
    };
    
    this._onNextLevel = function(){
        _iCurLevel++;
        
        this.reset();
        
        this.startCountdown();
    };

    this.onExit = function(){
        this.unload();
        s_oMain.gotoMenu();
        
		$(s_oMain).trigger("show_interlevel_ad");
        $(s_oMain).trigger("end_session");
        $(s_oMain).trigger("share_event",_iTotScore);
    };
    
    this.getPlayerX = function(){
        return _oPlayer.getX();
    };
    
    this.update = function(){

        if(_bUpdate === false){
            return;
        }
        
        _oPlayer.update();
        this._manageOpponentDepth();
        for(var i=0;i<_aOpponent.length;i++){
            _aOpponent[i].update();
        }
        
        if(!_bGameOver){
            _oField.update();
            _oFieldEndZone.update();


            _iTimeElapsSpawn += s_iTimeElaps;
            if(!_bTouchDown && _iTimeElapsSpawn > _iCurEnemySpawnTime){
                _iTimeElapsSpawn = 0;
                this._spawnEnemy();
            }
            
            
            if(_bPowerUpActive){
                _iTimeElapsPowerUp += s_iTimeElaps;

                if(_iTimeElapsPowerUp > TIME_EFFECT_POWERUP){
                    _bPowerUpActive = false;
                    
                    _oInterface.hidePowerUpGui();
                    _oPlayer.setAcceleration(HERO_ACCELERATION,MAX_HERO_SPEED);
                }else{
                    _oInterface.refreshPowerUpTime(_iTimeElapsPowerUp);
                }
            }
        }
        
    };
    
    s_oGame = this;

        
    this._init();
}

var s_oGame = null;
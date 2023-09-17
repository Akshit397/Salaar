function COpponent(bLast,iX,iY,oParentContainer){
    var _bUpdate = false;
    var _bLast = bLast;
    var _iCurAnim;
    var _iFlip;
    var _iTotAnimFrame;
    var _iCurFrameIndex;
    var _iWidth;
    var _iHeight;
    var _aAnim;
    var _aAnimNumFrames;
    var _aCbCompleted;
    var _aCbOwner;
    var _pStartPos;

    
    var _oContainer;
    var _oParentContainer;
    
    var _oThis = this;
    
    this._init = function(iX,iY){
        _aCbCompleted=new Array();
        _aCbOwner =new Array();
        _pStartPos = {x:iX,y:iY};
        
        _oContainer = new createjs.Container();
        _oContainer.x = iX;
        _oContainer.y = iY;
        _oContainer.scaleX = _oContainer.scaleY = 0.1;
        _oParentContainer.addChild(_oContainer);
        
        _aAnimNumFrames = new Array();
        _aAnimNumFrames[PLAYER_ANIM_RUN] = 18;
        _aAnimNumFrames[PLAYER_ANIM_FALL] = 18;
        
        _aAnim = new Array();
        _aAnim[PLAYER_ANIM_RUN] = new Array();
        for(var i=0;i<_aAnimNumFrames[PLAYER_ANIM_RUN];i++){
            var oSprite = s_oSpriteLibrary.getSprite('enemy_running_'+i);
            var oBmp = createBitmap(oSprite);
            oBmp.visible = false;
            oBmp.regX = oSprite.width/2;
            oBmp.regY = oSprite.height;
            _oContainer.addChild(oBmp);
            
            _aAnim[PLAYER_ANIM_RUN].push(oBmp);
            
            _iWidth = oSprite.width - 500;
            _iHeight = oSprite.height;
        }
        
        
        _aAnim[PLAYER_ANIM_FALL] = new Array();
        for(var i=0;i<_aAnimNumFrames[PLAYER_ANIM_FALL];i++){
            var oSprite = s_oSpriteLibrary.getSprite('enemy_tackle_'+i);
            var oBmp = createBitmap(oSprite);
            oBmp.visible = false;
            oBmp.regX = oSprite.width/2;
            oBmp.regY = oSprite.height;
            _oContainer.addChild(oBmp);

            _aAnim[PLAYER_ANIM_FALL].push(oBmp);
        }
        

        _iCurAnim = PLAYER_ANIM_RUN;
        
        
        
        this.show();
    };
    
    this.addEventListener = function( iEvent,cbCompleted, cbOwner ){
        _aCbCompleted[iEvent]=cbCompleted;
        _aCbOwner[iEvent] = cbOwner; 
    };
    
    this.reset = function(){
        _oContainer.x = _pStartPos.x;
        _oContainer.y = _pStartPos.y;
        _oContainer.scaleX = _oContainer.scaleY = 0.1;
        
        for(var i=0;i<_aAnimNumFrames[PLAYER_ANIM_RUN];i++){
            _aAnim[PLAYER_ANIM_RUN][i].visible = false;
        }
        
        for(var i=0;i<_aAnimNumFrames[PLAYER_ANIM_FALL];i++){
            _aAnim[PLAYER_ANIM_FALL][i].visible = false;
        }
        
        _iCurAnim = PLAYER_ANIM_RUN;
    };
    
    this.show = function(){
        _bUpdate = false;
        _iFlip = 1;
	this.reset();

        _oThis._startRun()
    };
    
    this._startRun = function(){
        _iTotAnimFrame = _aAnimNumFrames[_iCurAnim];
        
        _aAnim[_iCurAnim][0].visible = true;
        _iCurFrameIndex = Math.floor(Math.random()*_aAnim[PLAYER_ANIM_RUN].length);

        _oContainer.alpha = 0
        _oContainer.visible = true;
        
        /*
        var oShapeRect = new createjs.Shape();
        oShapeRect.graphics.beginFill("red").drawRect(-_iWidth/2, -_iHeight, _iWidth,_iHeight);
        oShapeRect.alpha = 0.5;
        _oContainer.addChild(oShapeRect);
        */
        
        new createjs.Tween.get(_oContainer).to({alpha:1},500);
        new createjs.Tween.get(_oContainer).to({scaleX:1,scaleY:1,y:OPPONENT_FINAL_Y},TIME_OPPONENT_RUN,createjs.Ease.cubicIn).call(function(){
            if(_aCbCompleted[ON_OPPONENT_TACKLE]){
                var oRect = new createjs.Rectangle(_oContainer.x -_iWidth/2,_oContainer.y-_iHeight,_iWidth,_iHeight);
                _aCbCompleted[ON_OPPONENT_TACKLE].call(_aCbOwner[ON_OPPONENT_TACKLE],oRect);
            }
        });
        
        new createjs.Tween.get(_oContainer).wait(2500).call(function(){
            //CHECK ORIENTATION FOR BLOCK ANIMATION
                if(s_oGame.getPlayerX() > _oContainer.x){
                    _iFlip = -1;
                }
               
                _oThis._changeAnim(PLAYER_ANIM_FALL,Math.floor(Math.random()*4));
                playSound("enemy",1,false);
        });
        
        setTimeout(function(){
                
            },2500);
	
        _bUpdate = true;
    };
    
    this.hide = function(){
        _bUpdate = false;
        _oContainer.visible = false;

        if(_aCbCompleted[ON_OPPONENT_HIDE]){
            _aCbCompleted[ON_OPPONENT_HIDE].call(_aCbOwner[ON_OPPONENT_HIDE],_bLast);
        }
    };
    
    this.playToFrame = function(iFrame){
        _aAnim[_iCurAnim][_iCurFrameIndex].visible = false;
        _iCurFrameIndex = iFrame;
        
        _aAnim[_iCurAnim][_iCurFrameIndex].scaleX = _iFlip;
        _aAnim[_iCurAnim][_iCurFrameIndex].visible= true;
    };
    
    this.nextFrame = function(){
        _aAnim[_iCurAnim][_iCurFrameIndex].visible = false;

        _iCurFrameIndex++;
        
        _aAnim[_iCurAnim][_iCurFrameIndex].scaleX = _iFlip;
        _aAnim[_iCurAnim][_iCurFrameIndex].visible= true;
        
    };
    
    this._changeAnim = function(iAnim,iCurFrame){
        _bUpdate = false;
        _aAnim[_iCurAnim][_iCurFrameIndex].visible = false;
        
        _iCurAnim = iAnim;
        _iCurFrameIndex = iCurFrame;
        _aAnim[_iCurAnim][_iCurFrameIndex].visible = true;
        
        _iTotAnimFrame = _aAnimNumFrames[_iCurAnim];
        
        _bUpdate = true;
    };
    
    this.update = function(){
        if(_bUpdate === false){
            return;
        }
        
        if (_iCurFrameIndex === _iTotAnimFrame-1) {
            if(_iCurAnim === PLAYER_ANIM_RUN){
                this.playToFrame(0);
            }else{
                this.hide();
                
            }
        }else{
            this.nextFrame();
        }   
    };
    
    _oParentContainer = oParentContainer;
    this._init(iX,iY);
}
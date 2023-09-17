function CPlayer(iX,iY,oParentContainer){
    var _bUpdate = false;
    var _bJumping;
    var _bLeft = false;
    var _bRight = false;
    var _iCurAnim;
    var _iPlayerWidth;
    var _iPlayerHeight;
    var _iStartX;
    var _iStartY;
    var _iCurAcceleration;
    var _iCurMaxSpeed;
    var _iXMove;
    var _iWidthSprite;
    var _iHeightSprite;
    var _aAnim;
    var _aAnimNumFrames;
    var _aCbCompleted;
    var _aCbOwner;
    
    var _oThis = this;
    var _oContainer;
    var _oParentContainer;
    
    this._init = function(iX,iY){
        _bJumping = false;
        _iStartX = iX;
        _iStartY = iY;
        _iXMove = 0;
        _iPlayerWidth = 609;
        _iPlayerHeight = 448;
        _iCurAcceleration = HERO_ACCELERATION;
        _iCurMaxSpeed = MAX_HERO_SPEED;
        _aCbCompleted=new Array();
        _aCbOwner =new Array();
        
        _oContainer = new createjs.Container();
        _oContainer.x = iX;
        _oContainer.y = iY;
        _oParentContainer.addChild(_oContainer);
       
        _aAnim = new Array();
        _aAnimNumFrames = new Array();
        _aAnimNumFrames[PLAYER_ANIM_RUN] = 18;
        _aAnimNumFrames[PLAYER_ANIM_FALL] = 9;
        _aAnimNumFrames[PLAYER_ANIM_TOUCHDOWN] = 50;
        _aAnimNumFrames[PLAYER_ANIM_JUMP] = 26;
        
       
        var oData = {
            images: [s_oSpriteLibrary.getSprite('player_running-0'),s_oSpriteLibrary.getSprite('player_running-1')],
            // width, height & registration point of each sprite
           "frames": [
                        [1, 1, 404, 403, 0, -74, -45],
                        [407, 1, 413, 416, 0, -68, -32],
                        [822, 1, 421, 429, 0, -66, -19],
                        [1245, 1, 420, 440, 0, -64, -8],
                        [1, 443, 427, 444, 0, -58, -4],
                        [430, 443, 438, 440, 0, -53, -8],
                        [870, 443, 447, 432, 0, -46, -16],
                        [1319, 443, 454, 416, 0, -35, -32],
                        [1, 889, 479, 404, 0, -22, -44],
                        [482, 889, 507, 407, 0, -22, -41],
                        [991, 889, 523, 421, 0, -39, -27],
                        [1516, 889, 506, 433, 0, -65, -15],
                        [1, 1324, 510, 440, 0, -74, -8],
                        [513, 1324, 503, 440, 0, -75, -8],
                        [1018, 1324, 475, 436, 0, -75, -12],
                        [1495, 1324, 443, 426, 0, -75, -22],
                        [1, 1, 421, 410, 1, -78, -38],
                        [424, 1, 401, 396, 1, -83, -52]
                    ],
            animations: {start: 0, anim: [0,_aAnimNumFrames[PLAYER_ANIM_RUN]-1]}
        };

        var oSpriteSheetRun = new createjs.SpriteSheet(oData);
        _aAnim[PLAYER_ANIM_RUN] = new createjs.Sprite(oSpriteSheetRun,"start");
        _aAnim[PLAYER_ANIM_RUN].regX = _iPlayerWidth/2;
        _aAnim[PLAYER_ANIM_RUN].regY = _iPlayerHeight;
        //_aAnim[PLAYER_ANIM_RUN].visible = false;
        _oContainer.addChild(_aAnim[PLAYER_ANIM_RUN]);
        
        
        var oData = {
            images: [s_oSpriteLibrary.getSprite('player_falling')],
            // width, height & registration point of each sprite
           "frames": [
                        [1, 1, 404, 403, 0, -74, -45],
                        [407, 1, 404, 403, 0, -74, -45],
                        [813, 1, 424, 403, 0, -63, -45],
                        [1239, 1, 449, 400, 0, -50, -48],
                        [1, 406, 477, 377, 0, -36, -71],
                        [480, 406, 550, 309, 0, -16, -139],
                        [1032, 406, 550, 309, 0, -16, -139],
                        [1, 785, 582, 248, 0, -4, -200],
                        [585, 785, 596, 88, 0, -7, -360]
                    ],
            animations: {start: 0, anim: [0,_aAnimNumFrames[PLAYER_ANIM_FALL]-1,"stop_anim"],stop_anim:_aAnimNumFrames[PLAYER_ANIM_FALL]}
        };

        var oSpriteSheetFall = new createjs.SpriteSheet(oData);
        _aAnim[PLAYER_ANIM_FALL] = new createjs.Sprite(oSpriteSheetFall,"start");
        _aAnim[PLAYER_ANIM_FALL].on("animationend",this._onPlayerFall,this);
        _aAnim[PLAYER_ANIM_FALL].visible = false;
        _aAnim[PLAYER_ANIM_FALL].regX = _iPlayerWidth/2;
        _aAnim[PLAYER_ANIM_FALL].regY = _iPlayerHeight;
        _oContainer.addChild(_aAnim[PLAYER_ANIM_FALL]);
        
        

        var oData = {
            images: [s_oSpriteLibrary.getSprite('player_touchdown-0'),s_oSpriteLibrary.getSprite('player_touchdown-1')],
            // width, height & registration point of each sprite
           "frames": [
                        [1, 1, 401, 396, 0, -83, -52],
                        [404, 1, 385, 386, 0, -95, -62],
                        [791, 1, 361, 370, 0, -113, -78],
                        [1154, 1, 343, 357, 0, -128, -91],
                        [1499, 1, 322, 362, 0, -135, -86],
                        [1, 399, 304, 370, 0, -138, -78],
                        [307, 399, 296, 377, 0, -142, -71],
                        [605, 399, 289, 384, 0, -145, -64],
                        [896, 399, 281, 383, 0, -149, -65],
                        [1179, 399, 277, 383, 0, -150, -65],
                        [1458, 399, 273, 381, 0, -152, -67],
                        [1733, 399, 269, 378, 0, -157, -70],
                        [1, 785, 260, 377, 0, -172, -71],
                        [263, 785, 241, 375, 0, -192, -73],
                        [506, 785, 218, 374, 0, -202, -74],
                        [726, 785, 197, 376, 0, -204, -72],
                        [925, 785, 215, 378, 0, -201, -70],
                        [1142, 785, 223, 380, 0, -194, -68],
                        [1367, 785, 230, 381, 0, -184, -67],
                        [1599, 785, 238, 383, 0, -182, -65],
                        [1, 1170, 261, 383, 0, -183, -65],
                        [264, 1170, 279, 383, 0, -185, -65],
                        [545, 1170, 286, 382, 0, -188, -66],
                        [833, 1170, 294, 379, 0, -195, -69],
                        [1129, 1170, 291, 376, 0, -201, -72],
                        [1422, 1170, 275, 373, 0, -210, -75],
                        [1699, 1170, 259, 368, 0, -215, -80],
                        [1, 1555, 241, 363, 0, -218, -84],
                        [244, 1555, 236, 353, 0, -210, -86],
                        [482, 1555, 251, 345, 0, -189, -89],
                        [735, 1555, 283, 335, 0, -154, -92],
                        [1020, 1555, 307, 326, 0, -131, -94],
                        [1329, 1555, 301, 315, 0, -137, -97],
                        [1632, 1555, 287, 318, 0, -149, -89],
                        [1, 1, 289, 283, 1, -148, -120],
                        [292, 1, 282, 259, 1, -157, -142],
                        [576, 1, 259, 234, 1, -188, -166],
                        [1, 286, 244, 211, 1, -213, -185],
                        [247, 286, 237, 195, 1, -229, -199],
                        [486, 286, 229, 178, 1, -242, -210],
                        [717, 286, 224, 161, 1, -246, -221],
                        [1, 499, 231, 154, 1, -253, -229],
                        [234, 499, 241, 145, 1, -260, -237],
                        [477, 499, 241, 153, 1, -264, -228],
                        [720, 499, 223, 154, 1, -270, -226],
                        [1, 655, 190, 156, 1, -277, -224],
                        [193, 655, 184, 155, 1, -266, -224],
                        [379, 655, 184, 155, 1, -268, -223],
                        [565, 655, 181, 157, 1, -275, -221],
                        [748, 655, 183, 161, 1, -275, -216],
                        [1, 818, 188, 169, 1, -275, -207],
                        [191, 818, 192, 180, 1, -273, -196],
                        [385, 818, 196, 188, 1, -273, -188],
                        [583, 818, 199, 193, 1, -273, -183],
                        [784, 818, 203, 199, 1, -272, -177],
                        [1, 1019, 207, 204, 1, -271, -172],
                        [210, 1019, 208, 207, 1, -270, -169],
                        [420, 1019, 207, 206, 1, -271, -170],
                        [629, 1019, 219, 202, 1, -269, -174],
                        [1, 1228, 240, 193, 1, -269, -183],
                        [243, 1228, 258, 181, 1, -268, -195],
                        [503, 1228, 274, 168, 1, -268, -208],
                        [1, 1423, 294, 145, 1, -268, -231],
                        [297, 1423, 315, 134, 1, -267, -242],
                        [614, 1423, 328, 136, 1, -267, -240],
                        [1, 1570, 333, 136, 1, -266, -240],
                        [336, 1570, 334, 128, 1, -265, -248],
                        [672, 1570, 328, 114, 1, -265, -262]
                    ],
            animations: {start: 0, anim: [0,_aAnimNumFrames[PLAYER_ANIM_TOUCHDOWN]-1,"stop_anim"],stop_anim:_aAnimNumFrames[PLAYER_ANIM_TOUCHDOWN]-1}
        };

        var oSpriteSheetTouchdown = new createjs.SpriteSheet(oData);
        _aAnim[PLAYER_ANIM_TOUCHDOWN] = new createjs.Sprite(oSpriteSheetTouchdown,"start");
        _aAnim[PLAYER_ANIM_TOUCHDOWN].on("animationend",this._onPlayerTouchdown,this);
        _aAnim[PLAYER_ANIM_TOUCHDOWN].visible = false;
        _aAnim[PLAYER_ANIM_TOUCHDOWN].regX = _iPlayerWidth/2;
        _aAnim[PLAYER_ANIM_TOUCHDOWN].regY = _iPlayerHeight;
        _oContainer.addChild(_aAnim[PLAYER_ANIM_TOUCHDOWN]);
        
        
        
        var oData = {
            images: [s_oSpriteLibrary.getSprite('player_jump-0'),s_oSpriteLibrary.getSprite('player_jump-1'),s_oSpriteLibrary.getSprite('player_jump-2')],
            // width, height & registration point of each sprite
           "frames": [
                        [1, 1, 405, 403, 0, -266, -309],
                        [408, 1, 415, 457, 0, -253, -255],
                        [825, 1, 421, 503, 0, -243, -209],
                        [1248, 1, 428, 547, 0, -227, -165],
                        [1, 550, 438, 581, 0, -218, -131],
                        [441, 550, 452, 608, 0, -213, -104],
                        [895, 550, 481, 632, 0, -210, -80],
                        [1378, 550, 545, 655, 0, -202, -57],
                        [1, 1207, 589, 678, 0, -196, -34],
                        [592, 1207, 628, 696, 0, -197, -16],
                        [1222, 1207, 663, 705, 0, -202, -7],
                        [1, 1, 695, 702, 1, -207, -10],
                        [698, 1, 724, 693, 1, -211, -19],
                        [1, 705, 746, 679, 1, -215, -33],
                        [749, 705, 761, 660, 1, -219, -52],
                        [1, 1386, 767, 638, 1, -223, -74],
                        [770, 1386, 754, 614, 1, -226, -98],
                        [1, 1, 692, 586, 2, -232, -126],
                        [695, 1, 644, 556, 2, -238, -156],
                        [1341, 1, 588, 525, 2, -239, -187],
                        [1, 589, 539, 503, 2, -238, -209],
                        [542, 589, 518, 489, 2, -240, -223],
                        [1062, 589, 488, 472, 2, -244, -240],
                        [1552, 589, 447, 452, 2, -249, -260],
                        [1, 1094, 420, 429, 2, -257, -283],
                        [423, 1094, 404, 403, 2, -266, -309]
                    ],
            animations: {start: 0, anim: [0,_aAnimNumFrames[PLAYER_ANIM_JUMP]-1,"stop_anim"],stop_anim:_aAnimNumFrames[PLAYER_ANIM_JUMP]}
        };

        var oSpriteSheetJump = new createjs.SpriteSheet(oData);
        _aAnim[PLAYER_ANIM_JUMP] = new createjs.Sprite(oSpriteSheetJump,"start");
        _aAnim[PLAYER_ANIM_JUMP].on("animationend",this._onPlayerJump);
        _aAnim[PLAYER_ANIM_JUMP].visible = false;
        _aAnim[PLAYER_ANIM_JUMP].x = -200;
        _aAnim[PLAYER_ANIM_JUMP].y = -220
        _aAnim[PLAYER_ANIM_JUMP].regX = _iPlayerWidth/2;
        _aAnim[PLAYER_ANIM_JUMP].regY = _iPlayerHeight;
        _oContainer.addChild(_aAnim[PLAYER_ANIM_JUMP]);
        

        _iCurAnim = PLAYER_ANIM_RUN;
    };
    
    this.addEventListener = function( iEvent,cbCompleted, cbOwner ){
        _aCbCompleted[iEvent]=cbCompleted;
        _aCbOwner[iEvent] = cbOwner; 
    };
    
    this.show = function(){

        _aAnim[_iCurAnim].visible = true;
        _aAnim[_iCurAnim].gotoAndPlay("anim");
        
        _oContainer.visible = true;
        
        _iWidthSprite = _oContainer.getBounds().width-200;
        _iHeightSprite = _oContainer.getBounds().height;
        /*
        var oShapeRect = new createjs.Shape();
        oShapeRect.graphics.beginFill("blue").drawRect(-_iWidthSprite/2, -_iHeightSprite, _iWidthSprite,_iHeightSprite);
        oShapeRect.alpha = 0.5;
        _oContainer.addChild(oShapeRect);
        */
       
       _bUpdate = true;
    };
    
    this.hide = function(){
        _bUpdate = false;
        _oContainer.visible = false;
    };
    
    this.reset = function(){
        _bUpdate = false;
        _bJumping = false;
        _bLeft = false;
        _bRight = false;
        _iXMove = 0;
        _iCurAcceleration = HERO_ACCELERATION;
        _iCurMaxSpeed = MAX_HERO_SPEED;
        
        _oContainer.alpha = 1;
        _oContainer.x = _iStartX;
        _oContainer.y = _iStartY;

        _aAnim[PLAYER_ANIM_RUN].visible = false
        _aAnim[PLAYER_ANIM_FALL].visible = false;
        _aAnim[PLAYER_ANIM_TOUCHDOWN].visible = false;
        _aAnim[PLAYER_ANIM_JUMP].visible = false;
        
        
        _iCurAnim = PLAYER_ANIM_RUN;
    };
    
    this.changeAnim = function(iAnim){
        _aAnim[_iCurAnim].visible = false;
        _aAnim[_iCurAnim].gotoAndStop("start");
        _iCurAnim = iAnim;
        _aAnim[_iCurAnim].visible = true;
        _aAnim[_iCurAnim].gotoAndPlay("anim");
    };
    
    this.jump = function(){
        _bJumping = true;
        this.changeAnim(PLAYER_ANIM_JUMP);
    };
    
    this.moveLeft = function(bLeft){
        _bLeft = bLeft;
    };

    this.moveRight = function(bRight){
        _bRight = bRight;
    };
    
    this.setAcceleration = function(iAcceleration,iMax){
        _iCurAcceleration = iAcceleration;
        _iCurMaxSpeed = iMax;
    };
    
    this.setY = function(iY){
        _oContainer.y = iY;
    };
    
    this._onPlayerFall = function(evt){
        if(evt.currentTarget.currentAnimation === "anim"){
            _oThis.hide();
            if(_aCbCompleted[ON_PLAYER_TACKLED]){
                 _aCbCompleted[ON_PLAYER_TACKLED].call(_aCbOwner[ON_PLAYER_TACKLED]);
            }
        }
    };
    
    this._onPlayerTouchdown = function(evt){
        if(evt.currentTarget.currentAnimation === "anim"){
            new createjs.Tween.get(_oContainer).to({alpha:0},500);
            if(_aCbCompleted[ON_PLAYER_TOUCHDOWN]){
                 _aCbCompleted[ON_PLAYER_TOUCHDOWN].call(_aCbOwner[ON_PLAYER_TOUCHDOWN]);
            }
        }
        
    };
    
    this._onPlayerJump = function(evt){
        if(evt.currentTarget.currentAnimation === "anim"){
            _bJumping = false;
            _oThis.changeAnim(PLAYER_ANIM_RUN);
        }  
    };
    
    this.getRect = function(){
        return new createjs.Rectangle(_oContainer.x-_iWidthSprite/2,_oContainer.y -_iHeightSprite,_iWidthSprite,_iHeightSprite);
    };
    
    this.isJumping = function(){
        return _bJumping;
    };
    
    this.getCurAnim = function(){
        return _iCurAnim;
    };
    
    this.getX = function(){
        return _oContainer.x;
    };
    
    this._updateMove = function(){
        if(_iCurAnim !== PLAYER_ANIM_RUN){
            return;
        }

        if(_bLeft){
            _iXMove -= _iCurAcceleration;
        }
        if(_bRight){
            _iXMove += _iCurAcceleration;
        }

        _oContainer.x += _iXMove;

        _iXMove *= HERO_FRICTION;
        if (_iXMove > _iCurMaxSpeed) {
                _iXMove = _iCurMaxSpeed;
        }
        
        if (_iXMove < -_iCurMaxSpeed) {
                _iXMove = -_iCurMaxSpeed;
        }

        if ( Math.abs(_iXMove) < 0.1 ) {
                _iXMove = 0;
        }
		
	if( ((_oContainer.x  + _iXMove) > CANVAS_WIDTH-s_iOffsetX)){  
            _oContainer.x = CANVAS_WIDTH  - _iXMove-s_iOffsetX;
        }
        
        if((_oContainer.x -  _iXMove)<s_iOffsetX) {
            _oContainer.x = _iXMove+s_iOffsetX;
        }
    };
            
    this.update = function(){
        if(_bUpdate === false){
            return;
        }

        this._updateMove();
    };
    
    _oParentContainer = oParentContainer;
    this._init(iX,iY);
}
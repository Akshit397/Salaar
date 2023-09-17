function CHelpPanel(){
    var _bHandState;
    var _aKeys;
    var _iIntervalId;
    var _oListener;
    
    var _oFade;
    var _oKey0;
    var _oKey1;
    var _oKey2;
    var _oButStart;
    var _oRunningPlayer;
    var _oJumpingPlayer;
    var _oContainer;
    
    var _oThis = this;
    
    this._init = function(){
        _oContainer = new createjs.Container();
        _oContainer.visible = false;
        s_oStage.addChild(_oContainer);
        
        _oFade = new createjs.Shape();
        _oFade.graphics.beginFill("rgba(0,0,0,0.7)").drawRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
        _oListener = _oFade.on("click",function(){});
        _oContainer.addChild(_oFade);
        
        var oSprite = s_oSpriteLibrary.getSprite("msg_box_wide");
        var oBg = createBitmap(oSprite);
        oBg.regX = oSprite.width/2;
        oBg.regY = oSprite.height/2;
        oBg.x = CANVAS_WIDTH/2;
        oBg.y = CANVAS_HEIGHT/2; 
        _oContainer.addChild(oBg);
        
        _aKeys = new Array();

        var oSpriteKey0;
        var oSpriteKey1;
        var oSpriteKey2;
        if(s_bMobile){
            oSpriteKey0 = s_oSpriteLibrary.getSprite("but_left");
            oSpriteKey1 = s_oSpriteLibrary.getSprite("but_right");
            oSpriteKey2 = s_oSpriteLibrary.getSprite("but_jump");
        }else{
            oSpriteKey0 = s_oSpriteLibrary.getSprite("key_0");
            oSpriteKey1 = s_oSpriteLibrary.getSprite("key_1");
            oSpriteKey2 = s_oSpriteLibrary.getSprite("key_2");
        }

        _oKey0 = createBitmap(oSpriteKey0);
        _oKey0.regX = oSpriteKey0.width/2;
        _oKey0.regY = oSpriteKey0.height/2;
        _oKey0.x = CANVAS_WIDTH/2 - 340;
        _oKey0.y = CANVAS_HEIGHT/2 + 130;
        _oContainer.addChild(_oKey0);

        _aKeys.push(_oKey0);

        _oKey1 = createBitmap(oSpriteKey1);
        _oKey1.regX = oSpriteKey1.width/2;
        _oKey1.regY = oSpriteKey1.height/2;
        _oKey1.x = CANVAS_WIDTH/2 - 220;
        _oKey1.y = CANVAS_HEIGHT/2 + 130;
        _oContainer.addChild(_oKey1);
        _aKeys.push(_oKey1);
        
        var aSprites = new Array();
        for(var i=0;i<18;i++){
            aSprites.push(s_oSpriteLibrary.getSprite("player_running_"+i))
        }
            
        _oRunningPlayer = this._attachPlayerRun();
        _oRunningPlayer.gotoAndPlay("anim");
        
        _oKey2 = createBitmap(oSpriteKey2);
        _oKey2.regX = oSpriteKey2.width/2;
        _oKey2.regY = oSpriteKey2.height/2;
        _oKey2.x = CANVAS_WIDTH/2 + 240;
        _oKey2.y = CANVAS_HEIGHT/2 + 130;
        _oContainer.addChild(_oKey2);
        _aKeys.push(_oKey2);
        
        var aSprites = new Array();
        for(var i=0;i<26;i++){
            aSprites.push(s_oSpriteLibrary.getSprite("player_jump_"+i))
        }
        
        _oJumpingPlayer = this._attachPlayerJump();
        _oJumpingPlayer.on("animationend",this._onEndJump,this);
        
        _oButStart = new CGfxButton(CANVAS_WIDTH/2,CANVAS_HEIGHT/2,s_oSpriteLibrary.getSprite("but_next"),_oContainer);
        _oButStart.addEventListener(ON_MOUSE_UP,this._onStart,this);
        
        
        this._playAnims();
    };
    
    this.unload = function(){
        _oFade.off("click",_oListener);
    };
    
    this.show = function(){
        _bHandState = true;
        
        _oContainer.alpha = 0;
        _oContainer.visible = true;
        createjs.Tween.get(_oContainer).to({alpha:1},500);
    };
    
    this.hide = function(){
        createjs.Tween.get(_oContainer).to({alpha:0} , 500,createjs.Ease.cubicOut).call(function(){
                                                                                    clearInterval(_iIntervalId);
                                                                                    _oContainer.visible = false;
                                                                                });
    };
    
    this._attachPlayerRun = function(){
        var iPlayerWidth = 609;
        var iPlayerHeight = 448;
        
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
            animations: {start: 0, anim: [0,17]}
        };

        var oSpriteSheet = new createjs.SpriteSheet(oData);
        var oSprite = new createjs.Sprite(oSpriteSheet,"start");
        oSprite.scaleX = oSprite.scaleY = 0.4;
        oSprite.x = CANVAS_WIDTH/2 - 320;
        oSprite.y = CANVAS_HEIGHT/2 + 70;
        oSprite.regX = iPlayerWidth/2;
        oSprite.regY = iPlayerHeight;
        _oContainer.addChild(oSprite);
        
        return oSprite;
    };
    
    this._attachPlayerJump = function(iX,iY){
        var iPlayerWidth = 609;
        var iPlayerHeight = 448;
        
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
            animations: {start: 0, anim: [0,25,"stop_anim"],stop_anim:25}
        };

        var oSpriteSheet = new createjs.SpriteSheet(oData);
        var oSprite = new createjs.Sprite(oSpriteSheet,"start");
        oSprite.scaleX = oSprite.scaleY = 0.4;
        oSprite.x = CANVAS_WIDTH/2 + 180;
        oSprite.y = CANVAS_HEIGHT/2 - 35;
        oSprite.regX = iPlayerWidth/2;
        oSprite.regY = iPlayerHeight;
        _oContainer.addChild(oSprite);
        
        return oSprite;
    };
    
    this._playAnims = function(){
        var iRightX = _oRunningPlayer.x + 130;
        var iLeftX = _oRunningPlayer.x;
        
        _oKey1.scaleX = _oKey1.scaleY = 0.9;
        createjs.Tween.get(_oRunningPlayer,{loop:true}).to({x: iRightX}, 2000, createjs.Ease.cubicOut).call(function(){
                                                                _oKey1.scaleX = _oKey1.scaleY = 1;
                                                                _oKey0.scaleX = _oKey0.scaleY = 0.9;
                                                    }).to({x: iLeftX}, 2000, createjs.Ease.cubicOut).call(function(){
                                                                _oKey0.scaleX = _oKey0.scaleY = 1;
                                                                _oKey1.scaleX = _oKey1.scaleY = 0.9;
                                                    });
                                                    
                                                    
                                                    
        _iIntervalId = setInterval(function(){
                                    _oKey2.scaleX = _oKey2.scaleY = 0.9;
                                    _oJumpingPlayer.gotoAndPlay("anim");
                                },3000);
    };
    
    this._onEndJump = function(evt){
        if(evt.currentTarget.currentAnimation === "anim"){
            _oKey2.scaleX = _oKey2.scaleY = 1;
        }
    };
    
    this._onStart = function(){
        _oButStart.disable();
        
        _oThis.hide();
        s_oGame.onExitFromHelp();
    };
    
    this._init();
}
function CScrollingBg(oContainer){
    var _oScrollingBg1 = null;
    var _oScrollingBg2 = null;
    var _oScrollingBg3 = null;
    var _oTorch1 = null;
    var _oTorch2 = null;
    
    var _oContainer = oContainer;
    
    this._init = function(){
        var oSpriteTile = s_oSpriteLibrary.getSprite('bg_scroll_1');
        
        _oScrollingBg1 = createBitmap(oSpriteTile);
        _oContainer.addChild(_oScrollingBg1);
        _oContainer.setChildIndex(_oScrollingBg1, BG_INDEX);
        
        var oSpriteTorch = s_oSpriteLibrary.getSprite('torch');
        var framerate = 15;
        var oData = {   
            images: [oSpriteTorch], 
            framerate: framerate,
            // width, height & registration point of each sprite
            frames: {width: TORCH_WIDTH, height: TORCH_HEIGHT, regX: 0, regY: 0}, 
            animations: {idle:[0, 12, "idle"]}
        };
        var oSpriteSheet = new createjs.SpriteSheet(oData);
        
        _oTorch1 = createSprite(oSpriteSheet, "idle", 0, 0, 0, 0);
        _oTorch1.y = 50;
        _oContainer.addChild(_oTorch1);
        _oContainer.setChildIndex(_oTorch1, BG_INDEX);
        
        _oTorch2 = createSprite(oSpriteSheet, "idle", 0, 0, 0, 0);
        _oTorch2.x = CANVAS_WIDTH-TORCH_WIDTH-45;
        _oTorch2.y = 50;
        _oContainer.addChild(_oTorch2);
        _oContainer.setChildIndex(_oTorch2, BG_INDEX);
        
        oSpriteTile = s_oSpriteLibrary.getSprite('bg_scroll_2');
        _oScrollingBg2 = createBitmap(oSpriteTile);
        _oScrollingBg2.y = CANVAS_HEIGHT;
        _oContainer.addChild(_oScrollingBg2); 
        _oContainer.setChildIndex(_oScrollingBg2, BG_INDEX);
        
        oSpriteTile = s_oSpriteLibrary.getSprite('bg_scroll_3');
        _oScrollingBg3 = createBitmap(oSpriteTile);
        _oScrollingBg3.y = CANVAS_HEIGHT*2;
        _oContainer.addChild(_oScrollingBg3); 
        _oContainer.setChildIndex(_oScrollingBg3, BG_INDEX);
        
    };
    
    this.move = function(iVelocity){   
        
        //passed bg2
        if(_oScrollingBg2.y <= -CANVAS_HEIGHT){
            _oScrollingBg2.y = _oScrollingBg3.y+CANVAS_HEIGHT;
        } 
        
        //passed bg3
        if(_oScrollingBg3.y <= -CANVAS_HEIGHT){
            _oScrollingBg3.y = _oScrollingBg2.y+CANVAS_HEIGHT;
        } 
        
        if(_oScrollingBg1.y <= 0){
            _oScrollingBg1.y+=iVelocity;
            _oTorch1.y += iVelocity;
            _oTorch2.y += iVelocity;
        } 
        _oScrollingBg2.y+=iVelocity;
        _oScrollingBg3.y+=iVelocity;
        
    };
    
    this._init();
}
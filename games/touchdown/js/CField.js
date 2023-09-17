function CField(iX,iY,oParentContainer){
    var _bUpdate = false;
    var _iTotAnimFrame;
    var _iCurFrameIndex;
    var _aAnim;
    var _oContainer;
    var _oParentContainer;
    
    this._init = function(iX,iY){
        _oContainer = new createjs.Container();
        _oContainer.visible = false;
        _oContainer.x = iX;
        _oContainer.y = iY;
        _oParentContainer.addChild(_oContainer);
        
        _aAnim = new Array();
        for(var i=0;i<18;i++){
            var oBmp = createBitmap(s_oSpriteLibrary.getSprite('field_loop_'+i));
            _oContainer.addChild(oBmp);
            
            _aAnim.push(oBmp);
            
            if(i > 0){
                oBmp.visible = false;
            }
        }
    };
    
    this.show = function(){
        _iTotAnimFrame = _aAnim.length;
        
        _aAnim[0].visible = true;
        _iCurFrameIndex = 0;
        _oContainer.visible = true;
        _bUpdate = true;
    };
    
    this.hide = function(){
        _oContainer.visible = false;
    };
    
    this.playToFrame = function(iFrame){
        _aAnim[_iCurFrameIndex].visible = false;
        _iCurFrameIndex = iFrame;
        _aAnim[_iCurFrameIndex].visible= true;
    };
    
    this.nextFrame = function(){
        
        _aAnim[_iCurFrameIndex].visible = false;
        _iCurFrameIndex++;
        _aAnim[_iCurFrameIndex].visible= true;
    };
    
    this.update = function(){
        if(_bUpdate === false){
            return;
        }
        

        if (_iCurFrameIndex === _iTotAnimFrame-1) {
            this.playToFrame(0);
        }else{
            this.nextFrame();
        }
          
    };
    
    _oParentContainer = oParentContainer;
    this._init(iX,iY);
}
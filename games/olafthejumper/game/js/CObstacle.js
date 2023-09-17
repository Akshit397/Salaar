function CObstacle(oSprite, iCharW, iCharH) {
    var _iMinHeight;
    var _iMaxHeight;
    var _iMinDistance;
    var _iMaxDistance;
    var _iHalfWidth;
    var _iLastObjIndex;
    var _iLastObjPassedByHero;
    var _iCont;
    var _aObstacles;
    var _oSprite;
    var _iSpeed;
    var _iCharW;
    var _iCharH;
    var _iMoltiplier;
   
   

    this._init = function (oSprite, iCharW, iCharH) {
        _iCont = 0;
        _iMoltiplier = 1;
        _oSprite = oSprite;
        _iCharW = iCharW;
        _iCharH = iCharH;
        _iSpeed = -0.5;
        _iMinHeight = Math.floor(oSprite.height / 10);
        _iMaxHeight = Math.floor(oSprite.height / 5);
        _iMinDistance = Math.floor(oSprite.width *2);
        _iMaxDistance = Math.floor(oSprite.width * 8);
        _iHalfWidth = oSprite.width / 2;
        OBST_HEIGHT = oSprite.height - 15;
        OBST_WIDTH = oSprite.width - 25;
        this._initLevel();
    };

    this._initLevel = function () {
        var iXPos = STARTX;
        var iYPos = STARTY;
        var iRandDistance = 0;
        var iRandHeight = 0;
        _aObstacles = new Array();
        while (iXPos < (CANVAS_WIDTH * 2) + oSprite.width) {
            

            var oObstacle = createBitmap(oSprite);
            oObstacle.regX = oSprite.width / 2;
            oObstacle.regY = oSprite.height / 2;
            oObstacle.x = iXPos + iRandDistance;// + (oSprite.width);
            oObstacle.y = iYPos + iRandHeight;// + (oSprite.height); //+ 1;

            s_oStage.addChild(oObstacle);
            iXPos = iXPos + iRandDistance;
            iRandDistance = Math.floor(randomFloatBetween(_iMinDistance, _iMaxDistance));
            iRandHeight = Math.floor(randomFloatBetween(_iMinHeight, _iMaxHeight));
            _aObstacles.push(oObstacle);
            
        }
       

        _iLastObjIndex = _aObstacles.length - 1;
        _iLastObjPassedByHero = -1;
    };
    this.getArray = function ()
    {
        return _aObstacles;
    };
    
    this.setMoltiplier = function (iSetValue) 
    {
        _iMoltiplier = iSetValue;
    };

    this.getNextXPos = function () 
    {
        return _iSpeed * _iMoltiplier;
    };
    
    this.update = function () {
        
        for (var i = 0; i < _aObstacles.length; i++) {
            if (_aObstacles[i].x < -_iHalfWidth) {
                var iRandDistance = Math.floor(randomFloatBetween(_iMinDistance, _iMaxDistance));
                var iRandHeight = Math.floor(randomFloatBetween(_iMinHeight, _iMaxHeight));

                _aObstacles[i].x = iRandDistance + _aObstacles[_iLastObjIndex].x;
                _aObstacles[i].y = iRandHeight + STARTY;
                _iLastObjIndex = i;
            }
            
               _aObstacles[i].x += _iSpeed * _iMoltiplier;
               
                if( _iLastObjPassedByHero !== i && _aObstacles[i].x < STARTX){
                _iLastObjPassedByHero = i;
            }
        }
    };

    this._init(oSprite, iCharW, iCharH);
}
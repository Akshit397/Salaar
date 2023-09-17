function CParallax(szSpritePrefix, iQuantity, bSame, bBackGround, iSetY)
{
    var _aParallaxImgs;
    var _aImgsWidths;
    var _iLastImgIndex;

    var _iWidth;
    var _iHeight;
    var _iSpeed;
    var _iMoltiplier;
    var _bBackGround;
    this.init = function (szSpritePrefix, iQuantity, bSame, bBackGround, iSetY)
    {
        _iSpeed = 0.1;
        _iMoltiplier = 0;
        _bBackGround = bBackGround;
        var iXPos = 0;
        var randX = Math.floor(randomFloatBetween(200, 600));
		var randY = Math.floor(randomFloatBetween(iSetY, iSetY + 100));
        var oParallaxContainer = new createjs.Container();
        s_oStage.addChild(oParallaxContainer);
        _aParallaxImgs = new Array();
        _aImgsWidths = new Array();
        
       
        for (var j = 0; j < 2; j++)
        {
            for (var i = 0; i < iQuantity; i++)
            {
				var randFlip = Math.floor(randomFloatBetween(0,1))

                if (bSame === false)
                {
                    var oSprite = s_oSpriteLibrary.getSprite(szSpritePrefix + i.toString());
                } 
                else
                {
                    var oSprite = s_oSpriteLibrary.getSprite(szSpritePrefix);
                }
                _iHeight = oSprite.height;
                _iWidth = oSprite.width;
                _aImgsWidths.push(_iWidth);
                if (bBackGround === null || bBackGround === false)
                {
				if (randFlip === 1)
				{
                var oImg = createBitmap(oSprite);
                oImg.x = iXPos;
                oImg.regY = _iHeight;
                oImg.y = randY;
				oImg.scaleX = -1;

                iXPos += _iWidth + randX;
				}
				else 
				{
				var oImg = createBitmap(oSprite);
                oImg.x = iXPos;
                oImg.regY = _iHeight;
                oImg.y = randY;

                iXPos += _iWidth + randX;
				}
                }
                else
                {
                var oImg = createBitmap(oSprite);
               
                    oImg.x = iXPos;
                    oImg.y = 0;
                   
                iXPos += _iWidth;
                
                }
                
                
                oParallaxContainer.addChild(oImg);
                _aParallaxImgs.push(oImg);
            }
        }






        _iLastImgIndex = _aParallaxImgs.length - 1;

    };

    
    this.setMoltiplier = function (iSetValue)
    {
        _iMoltiplier = iSetValue;
    };
    this.update = function ()
    {
        var randX = Math.floor(randomFloatBetween(200, 600));
		var randY = Math.floor(randomFloatBetween(iSetY, iSetY + 100));

         

        if (_bBackGround === false)
        {

            for (var i = 0; i < _aParallaxImgs.length; i++)
            {
                if (_aParallaxImgs[i].x <= -_aImgsWidths[i])
                {
                    _aParallaxImgs[i].x = _aParallaxImgs[_iLastImgIndex].x + randX;
                }
                _aParallaxImgs[i].x -= _iSpeed * _iMoltiplier;
                _iLastImgIndex = i;
            }
        } else
        {

            for (var i = 0; i < _aParallaxImgs.length; i++)
            {
                if (_aParallaxImgs[i].x <= -_aImgsWidths[i])
                {
                    _aParallaxImgs[i].x = _aParallaxImgs[_iLastImgIndex].x + _aImgsWidths[i];
					_aParallaxImgs[i].y = randY;
                }
                _aParallaxImgs[i].x -= _iSpeed * _iMoltiplier;
                _iLastImgIndex = i;
            }
        }
    };

    this.init(szSpritePrefix, iQuantity, bSame, bBackGround, iSetY);
}


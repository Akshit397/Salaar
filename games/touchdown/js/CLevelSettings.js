function CLevelSettings(){
    
    var _aEnemiesToSpawn;
    var _aEnemySpawnTime;
    var _aEnemySpawnNumber;
    var _aPowerUpAfterEnemy;
    
    this._init = function(){
        _aEnemiesToSpawn = new Array();
        _aEnemiesToSpawn[0] = 16;
        _aEnemiesToSpawn[1] = 20;
        _aEnemiesToSpawn[2] = 22;
        _aEnemiesToSpawn[3] = 24;
        _aEnemiesToSpawn[4] = 26;   
        _aEnemiesToSpawn[5] = 28;
        _aEnemiesToSpawn[6] = 30;
        _aEnemiesToSpawn[7] = 30;
        _aEnemiesToSpawn[8] = 32;
        _aEnemiesToSpawn[9] = 34;
        _aEnemiesToSpawn[10] = 36;
        _aEnemiesToSpawn[11] = 38;
        
        
        _aEnemySpawnTime = new Array();
        _aEnemySpawnTime[0] = 1500;
        _aEnemySpawnTime[1] = 1200;
        _aEnemySpawnTime[2] = 1000;
        _aEnemySpawnTime[3] = 1200;
        _aEnemySpawnTime[4] = 1100;
        _aEnemySpawnTime[5] = 1000;
        _aEnemySpawnTime[6] = 1000;
        _aEnemySpawnTime[7] = 1200;
        _aEnemySpawnTime[8] = 1100;
        _aEnemySpawnTime[9] = 800;
        _aEnemySpawnTime[10] = 700;        
        _aEnemySpawnTime[11] = 600;
        
        
        _aEnemySpawnNumber = new Array();
        _aEnemySpawnNumber[0] = 1;
        _aEnemySpawnNumber[1] = 1;
        _aEnemySpawnNumber[2] = 1;
        _aEnemySpawnNumber[3] = 2;
        _aEnemySpawnNumber[4] = 2;
        _aEnemySpawnNumber[5] = 2;
        _aEnemySpawnNumber[6] = 2;
        _aEnemySpawnNumber[7] = 3;
        _aEnemySpawnNumber[8] = 3;
        _aEnemySpawnNumber[9] = 2;
        _aEnemySpawnNumber[10] = 2;
        _aEnemySpawnNumber[11] = 2;
        
        _aPowerUpAfterEnemy = new Array();
        _aPowerUpAfterEnemy[0] = [4];
        _aPowerUpAfterEnemy[1] = [4];
        _aPowerUpAfterEnemy[2] = [5];
        _aPowerUpAfterEnemy[3] = [6];
        _aPowerUpAfterEnemy[4] = [7];
        _aPowerUpAfterEnemy[5] = [8];
        _aPowerUpAfterEnemy[6] = [9];
        _aPowerUpAfterEnemy[7] = [10];
        _aPowerUpAfterEnemy[8] = [11];
        _aPowerUpAfterEnemy[9] = [12];
        _aPowerUpAfterEnemy[10] = [4,9];
        _aPowerUpAfterEnemy[11] = [5,10];
        
        
        NUM_LEVELS = _aEnemiesToSpawn.length;
    };
    
    this.getEnemiesSpawn = function(iLevel){
        return _aEnemiesToSpawn[iLevel-1];
    };
    
    this.getStartingEnemySpawn = function(iLevel){
        return _aEnemySpawnTime[iLevel-1];
    };
    
    this.getEnemySpawnNumber = function(iLevel){
        return _aEnemySpawnNumber[iLevel-1];
    };
    
    this.getPowerUps = function(iLevel){
        return _aPowerUpAfterEnemy[iLevel-1];
    };
    
    this._init();
}
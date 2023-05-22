class Variable {
    version = [0, 1, 0]
    errorCount = 0;
    set allError(v){
        this.errorCount = v;
    }
    get allError(){
        return this.errorCount;
    }
    //config = new Config();
}

module.exports.IMCMAN = new Variable();

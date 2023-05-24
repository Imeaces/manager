//这东西不是让你改的，这是读配置用的

const fs = require("fs");

class UnknownConfigError extends Error {
    constructor(code){
        super("未知的配置文件版本: "+code);
    }
}

function isPortNumber(num){
    return isFinite(num) && num >= 0 && num <= 65535 && Math.floor(num) === num;
}

class Config {
    static createDefaultConfig(filePath){
        try {
            fs.accessSync(filePath);
            return false;
        } catch (e) {
            if (e.code === 'ENOENT'){
                fs.copyFileSync("config/defaults/config.json", filePath);
            } else {
                throw e;
            }
            return true;
        }
    }
    configVersion = 2;
    constructor(configFileJsonString, ignoreVersionError = false){
        //去除注释，因为不支持jsonc
        const jsonText = configFileJsonString.replaceAll(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
        const deserialisedConfig = JSON.parse(jsonText);
        
        if (deserialisedConfig.configVersion !== this.configVersion && !ignoreVersionError){
             throw new UnknownConfigError(deserialisedConfig.configVersion);
        }
        
        this.httpServer = new HttpServerConfig(deserialisedConfig.http);
        this.csrf = new CSRFConfig(deserialisedConfig.csrf);
        this.ftp = new FTPConfig(deserialisedConfig.ftpFileSystem);
        this.console = new ConsoleConfig(deserialisedConfig.console);
        this.webPanel = new WebPanelConfig(deserialisedConfig.webPanel);
        this.logging = new LoggingConfig(deserialisedConfig.logging);
        this.dataStatistics = new DataStatisticsConfig(deserialisedConfig.dataCenter);
        this.session = new SessionConfig(deserialisedConfig.session);
        this.server = new ServerConfig(deserialisedConfig.server);
        this.onlineFileManager = new OnlineFileManagerConfig(deserialisedConfig.onlineFileManager);
        this.publicApi = new PublicAPIConfig(deserialisedConfig.publicApi);
        
        
    }
    httpServer;
    csrf;
    ftp;
    console;
    webPanel;
    logging;
    dataStatistics;
    session;
    server;
    onlineFileManager;
    publicApi;
    freezeConfigValue(configFileJson){
    
        if (this instanceof Config)
            Object.freeze(this);
        else
            throw new TypeError("not a Config object");
    }
    toOldLocalProperties(){
        const localPropertyObject = {};
        /**
         *【使用前必读】
         * 这里是 MCSM 面板的重要细节配置文件，可以修改许多核心功能与细节功能；
         * 比如，终端实时刷新时间间隔，端口监听，日志缓存，等等。
         * 若您不理解某些配置的意思，请切勿随意改动，以下默认配置均为测试后的最佳配置，
         * 但是若您熟悉这些细节，您可以修改绝大部分设置，需要重启面板生效。
         * 
         * 
         *【无计算机语言基础者请阅读】
         * 文本值，双引号之间是文本描述（字符串），类似于 "UTF-8" ，"Hello" 等等；
         * 真假值, true 代表准许 false 代表禁止；
         * 数字值，直接书写即可,无需双引号，列如 1,2,3,5.565,20000,5555 等；
         * 注释，纯属用来看的，毫无作用 // 代表单行注释；
         * 
         * 请放心，这不是要你书写计算机语言，而是进行十分简单的编辑；
         * 当然你可以选择不改动此文件。
         * 
         * 
         * 项目尽可能在 UTF8 编码环境中运行。
         *
         * 
         * 【配置开始，谨慎修改】
        */
        
        //HTTP 服务监听端口
        localPropertyObject.http_port = this.httpServer.httpPort;
        
        
        //HTTP 服务监听ip, 默认 0.0.0.0 | 可不填
        localPropertyObject.http_ip = this.httpServer.bindAddress;
        
        
        // 注意：FTP 功能已于当前版本删除，因为原版的FTP功能及其不稳定。
        localPropertyObject.ftp_is_allow = this.ftp.enabled;
        localPropertyObject.ftp_port = this.ftp.port;
        localPropertyObject.ftp_ip = this.ftp.ip;
        localPropertyObject.ftp_start_port = this.ftp.ftpPortModePortRange[0];
        localPropertyObject.ftp_end_port = this.ftp.ftpPortModePortRange[1];
        
        
        //控制台实时刷新频率 单位毫秒 默认 1000 毫秒
        //建议在 1000 毫秒 与 3000 毫秒之选择 
        localPropertyObject.console_send_times = this.console.updateInterval * 1000;
        
        
        //控制台一次性发送的数据最大限制 
        //数据最大限制 单位KB | 默认 28 KB
        localPropertyObject.console_max_out = this.console.updatePackSizeLimit;
        
        
        //是否开启 gzip 静态文件压缩，但是如果你使用反向代理或某 HTTP 服务自带的gzip，请关闭它
        localPropertyObject.is_gzip = this.httpServer.useGzipCompression;
        
        
        //是否准许跨域请求，如果准许，将失去一部分安全性，但是你二次开发可能需要
        localPropertyObject.is_allow_csrf = this.csrf.allowCSRF;
        
        
        //登录页面 URL，我们有两个登录页面，你可以选择其一，或自己选择
        //我们设计了 3 个不同的登录界面供你选择
        // /public/login/    /public/login2/    /public/login3/
        localPropertyObject.login_url = this.webPanel.loginPageUrl;
        
        
        //日志文件记录的最大大小。默认是 1MB
        //大小越大，储存的日志内容越多，但是对服务器硬盘要求也会略微变大。
        //单位 MB | 推荐 1~5 MB 之间
        localPropertyObject.terminalQueue_max_size = this.logging.logSizePerFile;
        
        
        //控制数据中心 数据刷新频率 单位毫秒
        //默认 2000 毫秒
        localPropertyObject.data_center_times = this.dataStatistics.updateInterval * 1000;
        
        
        //是否准许本控制面板使用自定义参数 | 默认准许使用
        //注意! 此功能既可以让你的控制面板尝试更多姿势 (包括 WebShell)
        //注意! 也会让其他别有用心的管理员 (只有管理员有权使用)，入侵你的宿主机
        localPropertyObject.customize_commande = this.server.enableCustomCommandLineFeature;
        
        
        //Session Cookie 与 Login 管理器最大时间
        //意味着,第一次登录之后,这段时间内是可以不需要输入密码就可以登录的。
        //超过这段时间后,访问需要重新登录
        //单位 分钟 | 默认 240 分钟
        localPropertyObject.session_max_age = this.session.maxAge;
        
        
        //每个服务器拥有的最大计划任务数量
        //默认 10 个
        
        //#如果是 -1 就是说无限个，但是我不知道有没有这种兼容，就设置为999999个
        localPropertyObject.schedule_max = this.server.maxScheduleCount >= 0 ? this.server.maxScheduleCount : 999999;
        
        
        //所有用户总数，最高解压缩任务上限
        //默认最大同时解压1个压缩文件，多余的会排队进行
        localPropertyObject.max_eac_task_limit = null;
        if (this.onlineFileManager.allowOnlineDecompression){
            if (this.onlineFileManager.maxDecompressTasks > 0){
                localPropertyObject.max_eac_task_limit = this.onlineFileManager.maxDecompressTasks;
            } else {
                localPropertyObject.max_eac_task_limit = 999999
            }
        } else {
            localPropertyObject.max_eac_task_limit = 0;
        }
        
        
        //是否禁止 /api/* 公开接口获取 | 默认不禁止
        //这不利于你二次开发，对接或使用，但是会更加的安全 
        localPropertyObject.allow_status_api = this.publicApi.statusApiEnabled;
        
        
        
        /**
         *【配置结束，重启面板生效】
         * 若重启面板报错，说明您修改格式有误，请备份并删除此文件，面板会重新生成新文件。
        */
        
        return localPropertyObject;
    }
}

class InvalidConfigError extends Error {
    constructor(key, expectValue, curValue){
        super(`配置 ${key} 的值错误，需要：${expectValue}，得到${curValue}`);
    }
}

class HttpServerConfig {
    constructor(deserializedConfig){
        this.bindAddress = String(deserializedConfig.bindAddress);
        
        this.httpPort = Number(deserializedConfig.httpPort);
        if (!isPortNumber(this.httpPort)){
            throw new InvalidConfigError("http.httpPort", "[0, 65535] 之间的整数", deserializedConfig.httpPort);
        }
        
        this.useGZIP = !!deserializedConfig.useGzipCompression;
    }
    bindAddress = "0.0.0.0";
    httpPort = 23333;
    useGZIP = true;
}
class CSRFConfig {
    static excludePathExamples = new Map();
    constructor(deserializedConfig){
        this.allowCSRF = !!deserializedConfig.allowCSRF;
        
        this.excludeExample = deserializedConfig.excludes;
        if (typeof deserializedConfig.excludes === "string"){
            this.excludePaths = excludePathExamples.get(this.excludeExample);
        } else if (Array.isArray(deserializedConfig.excludes)){
            this.excludePaths = deserializedConfig.excludes.map(String);
        } else if (deserializedConfig.excludes != null){
            throw new InvalidConfigError("csrf.excludes", "urlPath[] | ExclusionExampleName", deserializedConfig.excludes);
        }
    }
    allowCSRF = false;
    excludeExample = null;
    excludePaths = [];
}
class FTPConfig {
    constructor(deserializedConfig){
        this.enabled = !!deserializedConfig.enable;
        if (!this.enabled){
            return;
        }
        
        this.port = deserializedConfig.port;
        if (!isPortNumber(this.port)){
            throw new InvalidConfigError("ftp.port", "[0, 65535] 之间的整数", deserializedConfig.port);
        }
        
        this.ip = String(deserializedConfig.ip);
        this.ftpPortModePortRange = deserializedConfig.ftpPortModePortRange.map(Number);
        if (!Array.isArray(this.ftpPortModePortRange) || this.ftpPortModePortRange.length !== 2 || this.ftpPortModePortRange.findIndex(v => v < 0 || v > 65535) !== -1){
            throw new InvalidConfigError("ftp.ftpPortModePortRange", "[FirstPort, LastPort]", deserializedConfig.ftpPortModePortRange.map);
        }
    }
    enabled = false;
    port = 10022;
    ip = "0.0.0.0";
    ftpPortModePortRange = [ 62000, 62300 ];
}
class ConsoleConfig {
    constructor(deserializedConfig){
        this.updateInterval = Number(deserializedConfig.updateInterval);
        if (isNaN(this.updateInterval) || this.updateInterval <= 0){
            throw new InvalidConfigError("console.updateInterval", "大于0的数字", deserializedConfig.updateInterval);
        }
        
        this.updatePackSizeLimit = Number(deserializedConfig.updatePackSizeLimit);
        if (isNaN(this.updatePackSizeLimit)){
            throw new InvalidConfigError("console.updatePackSizeLimit", "数字", deserializedConfig.updatePackSizeLimit);
        }

        this.logConsoleOutput = !!deserializedConfig.logConsoleOutput;
    }
    updateInterval = 1;
    updatePackSizeLimit = 10; 
    logConsoleOutput = false;
}
class WebPanelConfig {
    constructor(deserializedConfig){
        this.loginPageUrl = String(deserializedConfig.loginPageUrl);
    }
    loginPageUrl = "/public/login1/";
    
}
class LoggingConfig {
    constructor(deserializedConfig){
        this.logRollingTimes = Number(deserializedConfig.logRollingTimes);
        if (isNaN(this.logRollingTimes) || Math.floor(this.logRollingTimes) !== this.logRollingTimes){
            throw new InvalidConfigError("logging.logRollingTimes", "整数", deserializedConfig.logRollingTimes);
        }

        this.serverLogSizePerFile = Number(deserializedConfig.serverLogSizePerFile);
        if (isNaN(this.serverLogSizePerFile) || this.serverLogSizePerFile <= 0){
            throw new InvalidConfigError("logging.serverLogSizePerFile", "大于0的数字", deserializedConfig.serverLogSizePerFile);
        }

        this.logSizePerFile = Number(deserializedConfig.logSizePerFile);
        if (isNaN(this.logSizePerFile) || this.logSizePerFile <= 0){
            throw new InvalidConfigError("logging.logSizePerFile", "大于0的数字", deserializedConfig.logSizePerFile);
        }
    }
    logRollingTimes = 4;
    serverLogSizePerFile = 2048;
    logSizePerFile = 4096;
}
class DataStatisticsConfig {
    constructor(deserializedConfig){
        this.updateInterval = Number(deserializedConfig.updateInterval);
        if (isNaN(this.updateInterval) || this.updateInterval <= 0){
            throw new InvalidConfigError("dataCenter.updateInterval", "大于0的数字", deserializedConfig.updateInterval);
        }
    }
    updateInterval = 2;
}
class SessionConfig {
    constructor(deserializedConfig){
        this.maxAge = Number(deserializedConfig.maxAge);
        if (isNaN(this.maxAge) || this.maxAge <= 0){
            throw new InvalidConfigError("session.maxAge", "大于0的数字", deserializedConfig.maxAge);
        }
    }
    maxAge = 120;
}
class ServerConfig {
    constructor(deserializedConfig){
        this.enableCustomCommandLineFeature = !!deserializedConfig.serverCustomCommand;
        this.maxScheduleCount = deserializedConfig.maxScheduleCount;
        if (isNaN(this.maxScheduleCount) || Math.floor(this.maxScheduleCount) !== this.maxScheduleCount){
            throw new InvalidConfigError("server.maxScheduleCount", "整数", deserializedConfig.maxScheduleCount);
        }
    }
    enableCustomCommandLineFeature = false;
    maxScheduleCount = 7;
}
class OnlineFileManagerConfig {
    constructor(deserializedConfig){
        this.allowOnlineDecompression = !!deserializedConfig.allowOnlineDecompression;
        this.maxDecompressTasks = Number(deserializedConfig.maxDecompressTasks);
        if (isNaN(this.maxDecompressTasks) || Math.floor(this.maxDecompressTasks) !== this.maxDecompressTasks || this.maxDecompressTasks < 1){
            throw new InvalidConfigError("onlineFileManager.maxDecompressTasks", "大于0的整数", deserializedConfig.maxDecompressTasks);
        }
    }
    allowFileUpload = true; //之后可能会改
    allowOnlineDecompression = true;
    maxDecompressTasks = 2; //min 1
    adminExempt = true;
}
class PublicAPIConfig {
    constructor(deserializedConfig){
        this.enabled = !!deserializedConfig.enable;
        this.statusApiEnabled = !!deserializedConfig.statusApi;
        this.requestRateLimit = deserializedConfig.requestRateLimit;
        if (isNaN(this.requestRateLimit) || Math.floor(this.requestRateLimit) !== this.requestRateLimit){
            throw new InvalidConfigError("publicApi.requestRateLimit", "整数", deserializedConfig.requestRateLimit);
        }
    }
    enabled = true;
    statusApiEnabled = true;
    requestRateLimit = 20;
}

module.exports.Config = Config;

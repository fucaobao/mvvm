/**
 Observer是将输入的Plain Object进行处理,利用Object.defineProperty转化为getter与setter,从而在赋值与取值时进行拦截
 这是Vue响应式框架的基础
 */
function isObject(obj) {
    return obj != null && typeof(obj) == 'object';
}

function isPlainObject(obj) {
    return Object.prototype.toString(obj) == '[object Object]';
}

function observer(data) {
    if (!isObject(data) || !isPlainObject(data)) {
        return;
    }
    return new Observer(data);
}

function Observer(data) {
    this.data = data;
    this.walk(data);
}
Observer.prototype.walk = function(data) {
    let self = this;
    Object.keys(data).forEach(function(key){
        self.defineReactive(data, key, data[key]);
    });
};
Observer.prototype.defineReactive = function(data, key, value) {
    var dep = new Dep();
    Object.defineProperty(data, key, {
        enumerable: true,
        configurable: false,
        get: function() {
            console.log("intercept get:" + key);
            if (Dep.target) {
                //JS的浏览器单线程特性，保证这个全局变量在同一时间内，只会有同一个监听器使用
                dep.addSub(Dep.target);
            }
            return value;
        },
        set: function(newVal) {
            console.log("intercept set:" + key);
            if (newVal == value) {
                return;
            }
            //修改value,get取值时也会变化
            //不能使用data[key]=newVal
            //因为在set中继续调用set赋值，引起递归调用
            value = newVal;
            //监视新值
            observer(newVal);
            dep.notify(newVal);
        }
    });
};

function Dep() {
    this.subs = {};
}
Dep.prototype.addSub = function(target) {
    //去重
    if (!this.subs[target.uid]) {
        this.subs[target.uid] = target;
    }
};
Dep.prototype.notify = function(newVal) {
    for (var uid in this.subs) {
        this.subs[uid].update(newVal);
    }
};
Dep.target = null;
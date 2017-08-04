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
    this.dep = new Dep();
    this.data = data;
    this.walk(data);
}
Observer.prototype.walk = function(data) {
    let self = this;
    Object.keys(data).forEach(function(key) {
        self.defineReactive(data, key, data[key]);
    });
};
Observer.prototype.defineReactive = function(data, key, value) {
    let dep = new Dep();
    let childOb = observer(value);
    Object.defineProperty(data, key, {
        enumerable: true,
        configurable: false,
        get: function() {
            console.log('get:' + key);
            if (Dep.target) {
                //JS的浏览器单线程特性，保证这个全局变量在同一时间内，只会有同一个监听器使用
                dep.addSub(Dep.target);
            }
            if (childOb) {
                childOb.dep.addSub(Dep.target);
            }
            return value;
        },
        set: function(newVal) {
            console.log('set:' + key);
            if (newVal == value) {
                return;
            }
            //修改value,get取值时也会变化
            //不能使用data[key]=newVal
            //因为在set中继续调用set赋值，引起递归调用
            value = newVal;
            //监视新值
            observer(newVal);
            dep.notify();
        }
    });
};

let uid = 0;
Dep.target = null;

function Dep() {
    this.depIds = {};
    this.uid = uid++;
    this.subs = [];
}
Dep.prototype.addSub = function(sub) {
    // 去重
    if (!this.depIds.hasOwnProperty(this.uid)) {
        this.subs.push(sub);
        this.depIds[this.uid] = sub;
    }
};
Dep.prototype.notify = function() {
    this.subs.forEach(function(sub) {
        // 执行sub的update更新函数
        sub.update();
    });
};
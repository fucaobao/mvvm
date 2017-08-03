/**
 * @class 双向绑定类 MVVM
 * @param {[type]} options [description]
 */
function MVVM(options) {
    this._options = options || {};
    let data = this._options.data;
    let methods = this._options.methods;
    this._proxy(data);
    observer(data);
    new Compiler(options.el || document.body, this);
}

MVVM.prototype._proxy = function(data) {
    //添加
    let self = this;
    Object.keys(data).forEach(function(key) {
        Object.defineProperty(self, key, {
            configurable: false,
            enumerable: true,
            get: function proxyGetter() {
                return data[key];
            },
            set: function proxySetter(newVal) {
                data[key] = newVal;
            }
        });
    });
};